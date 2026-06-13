#!/usr/bin/env python3
# ─── attendance.py ───────────────────────────────────────────────────────────
# Raspberry Pi attendance system
# Camera runs 24/7 and streams MJPEG video.
# Face recognition activates only when a session is prepared.
#
# Install dependencies:
#   pip3 install flask face_recognition opencv-python requests picamera2

import cv2
import face_recognition
import numpy as np
import requests
import threading
import logging
import time
from datetime import datetime
from flask import Flask, request, jsonify, Response
from picamera2 import Picamera2

# ─── Config ──────────────────────────────────────────────────────────────────
LARAVEL_URL   = "http://192.168.0.16:8000"
PI_TOKEN      = "my-super-secret-pi-token-123"
FLASK_PORT    = 5000
SCAN_INTERVAL = 1       # Seconds between face recognition passes
STREAM_FPS    = 15      # MJPEG stream frame rate
HEADERS = {
    "X-Pi-Token":   PI_TOKEN,
    "Accept":       "application/json",
    "Content-Type": "application/json",
}

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("attendance.log"),
        logging.StreamHandler(),
    ]
)
log = logging.getLogger(__name__)

# ─── Global state ─────────────────────────────────────────────────────────────
app = Flask(__name__)

current_session  = None
known_encodings  = []
known_students   = []
marked_students  = set()
session_lock     = threading.Lock()

camera_active    = False
picam_instance   = None
annotated_frame  = None
frame_lock       = threading.Lock()


# ─── MJPEG stream ─────────────────────────────────────────────────────────────
@app.route("/stream")
def stream():
    """
    Live MJPEG stream — embed in the admin page as:
        <img src="http://<pi-ip>:5000/stream">
    """
    def generate():
        blank = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(blank, "Camera starting...", (140, 240),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (160, 160, 160), 2)
        while True:
            with frame_lock:
                f = annotated_frame
            frame = f if f is not None else blank
            ok, jpeg = cv2.imencode(".jpg", cv2.cvtColor(frame, cv2.COLOR_BGR2RGB), [cv2.IMWRITE_JPEG_QUALITY, 70])
            if ok:
                yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n"
                       + jpeg.tobytes() + b"\r\n")
            time.sleep(1.0 / STREAM_FPS)

    return Response(generate(), mimetype="multipart/x-mixed-replace; boundary=frame")


# ─── Flask routes ─────────────────────────────────────────────────────────────
@app.route("/prepare", methods=["POST"])
def prepare():
    token = request.headers.get("X-Pi-Token")
    if token != PI_TOKEN:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    if not data or "session_id" not in data:
        return jsonify({"error": "Invalid payload"}), 400

    log.info(f"Received session prepare: Session {data['session_id']} — {data.get('subject')}")
    log.info(f"Students to load: {len(data.get('students', []))}")

    threading.Thread(target=load_session, args=(data,), daemon=True).start()

    return jsonify({
        "success": True,
        "message": f"Loading {len(data.get('students', []))} faces for session {data['session_id']}",
    })


@app.route("/status", methods=["GET"])
def status():
    with session_lock:
        return jsonify({
            "online":          True,
            "camera_running":  camera_active,
            "session_id":      current_session["session_id"] if current_session else None,
            "subject":         current_session.get("subject") if current_session else None,
            "faces_loaded":    len({s["id"] for s in known_students}),
            "marked_students": len(marked_students),
        })


@app.route("/stop", methods=["POST"])
def stop():
    token = request.headers.get("X-Pi-Token")
    if token != PI_TOKEN:
        return jsonify({"error": "Unauthorized"}), 401

    clear_session()
    return jsonify({"success": True, "message": "Session cleared — camera still streaming"})


# ─── Session management ───────────────────────────────────────────────────────
def load_session(data: dict):
    """Download and encode all face angles for every student."""
    global current_session, known_encodings, known_students, marked_students

    new_encodings = []
    new_students  = []

    for student in data.get("students", []):
        name = student.get("name", "Unknown")
        urls = {
            "frontal": student.get("face_url"),
            "left":    student.get("face_left_url"),
            "right":   student.get("face_right_url"),
        }

        loaded = 0
        for angle, url in urls.items():
            if not url:
                continue
            try:
                resp = requests.get(url, timeout=10)
                resp.raise_for_status()
                img_array = np.frombuffer(resp.content, np.uint8)
                img       = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
                rgb_img   = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                encodings = face_recognition.face_encodings(rgb_img)
                if not encodings:
                    log.warning(f"No face found in {angle} image for {name}")
                    continue
                new_encodings.append(encodings[0])
                new_students.append(student)
                loaded += 1
                log.info(f"Loaded {angle} face for {name} (ID: {student.get('id')})")
            except Exception as e:
                log.error(f"Failed to load {angle} face for {name}: {e}")

        if loaded == 0:
            log.warning(f"No angles loaded for {name} — will not be recognised")
        else:
            log.info(f"{name}: {loaded}/3 angle(s) loaded")

    with session_lock:
        current_session = data
        known_encodings = new_encodings
        known_students  = new_students
        marked_students = set()

    log.info(f"Session ready: {len(new_encodings)} encoding(s) for session {data['session_id']}")


def clear_session():
    global current_session, known_encodings, known_students, marked_students
    with session_lock:
        current_session = None
        known_encodings = []
        known_students  = []
        marked_students = set()
    log.info("Session cleared — camera continues streaming")


# ─── Camera loop (runs forever) ───────────────────────────────────────────────
def camera_loop():
    global camera_active, picam_instance, annotated_frame

    # Init camera with retries
    picam = None
    for attempt in range(5):
        try:
            picam = Picamera2()
            picam_instance = picam
            break
        except Exception as e:
            log.warning(f"Camera init attempt {attempt + 1}/5 failed: {e}")
            time.sleep(5)

    if picam is None:
        log.error("Could not initialize camera after 5 attempts — stream unavailable")
        camera_active = False
        return

    config = picam.create_preview_configuration(main={"format": "BGR888", "size": (640, 480)})
    picam.configure(config)
    picam.start()
    time.sleep(2)
    log.info("Camera ready — live stream started")

    last_recognition_at = 0.0
    last_face_overlays  = []

    try:
        while camera_active:
            bgr = picam.capture_array()

            # Snapshot of session state for this frame
            with session_lock:
                sess        = current_session
                enc_copy    = list(known_encodings)
                stu_copy    = list(known_students)
                marked_copy = set(marked_students)

            now = time.time()

            # Run face recognition only when a session is active
            if sess and enc_copy and (now - last_recognition_at >= SCAN_INTERVAL):
                last_recognition_at = now
                rgb            = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
                face_locations = face_recognition.face_locations(rgb, model="hog")
                new_overlays   = []

                if face_locations:
                    face_encs = face_recognition.face_encodings(rgb, face_locations)
                    for i, loc in enumerate(face_locations):
                        label = "Unknown"
                        color = (0, 0, 255)
                        if i < len(face_encs):
                            distances = face_recognition.face_distance(enc_copy, face_encs[i])
                            matches   = face_recognition.compare_faces(enc_copy, face_encs[i], tolerance=0.5)
                            best_idx  = int(np.argmin(distances))
                            if matches[best_idx]:
                                student    = stu_copy[best_idx]
                                conf       = (1 - distances[best_idx]) * 100
                                student_id = student["id"]
                                label      = f"{student['name']} ({conf:.0f}%)"
                                if student_id in marked_copy:
                                    color = (0, 200, 255)  # amber — already marked
                                else:
                                    color = (0, 255, 0)    # green — new match
                                    log.info(f"Recognised: {student['name']} ({conf:.1f}%)")
                                    if post_attendance(sess["session_id"], student_id):
                                        with session_lock:
                                            marked_students.add(student_id)
                        new_overlays.append((loc, label, color))

                last_face_overlays = new_overlays

            elif not sess:
                last_face_overlays = []  # clear boxes when no session

            # Draw face boxes
            display = bgr.copy()
            for (top, right, bottom, left), label, color in last_face_overlays:
                cv2.rectangle(display, (left, top), (right, bottom), color, 2)
                (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
                cv2.rectangle(display, (left, top - th - 10), (left + tw + 6, top), color, -1)
                cv2.putText(display, label, (left + 3, top - 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

            # HUD bar
            with session_lock:
                marked_count = len(marked_students)
                total_count  = len({s["id"] for s in known_students})
                subject      = current_session.get("subject", "") if current_session else ""

            now_str = datetime.now().strftime("%H:%M:%S")
            hud = (f"{subject}  |  {marked_count}/{total_count} marked  |  {now_str}"
                   if sess else f"Live  |  No active session  |  {now_str}")
            cv2.rectangle(display, (0, 0), (640, 28), (30, 30, 30), -1)
            cv2.putText(display, hud, (8, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220, 220, 220), 1)

            # Auto-clear session when its end time passes
            if sess:
                end_str = sess.get("end_time", "23:59")
                today   = datetime.now().strftime("%Y-%m-%d")
                try:
                    session_end = datetime.strptime(f"{today} {end_str}", "%Y-%m-%d %H:%M")
                    if datetime.now() >= session_end:
                        log.info("Session time ended — clearing session")
                        clear_session()
                except Exception:
                    pass

            with frame_lock:
                annotated_frame = display

    except Exception as e:
        log.error(f"Camera loop error: {e}")
    finally:
        try:
            picam.stop()
            picam.close()
        except Exception:
            pass
        picam_instance = None
        camera_active  = False
        log.info("Camera closed")


# ─── Post attendance to Laravel ───────────────────────────────────────────────
def post_attendance(session_id: int, student_id: int) -> bool:
    try:
        resp = requests.post(
            f"{LARAVEL_URL}/api/attendance/record",
            json={
                "session_id": session_id,
                "student_id": student_id,
                "timestamp":  datetime.now().isoformat(),
            },
            headers=HEADERS,
            timeout=5,
        )
        if resp.ok:
            log.info(f"Laravel response: {resp.json().get('message')}")
            return True
        log.warning(f"Laravel returned {resp.status_code}: {resp.text}")
        return False
    except requests.exceptions.ConnectionError:
        log.warning("Could not reach Laravel server — failing silently")
        return False
    except Exception as e:
        log.error(f"Error posting attendance: {e}")
        return False


# ─── Startup ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    log.info("Pi Attendance System starting...")
    log.info(f"Laravel server: {LARAVEL_URL}")
    log.info(f"Stream:  http://0.0.0.0:{FLASK_PORT}/stream")
    log.info(f"Status:  http://0.0.0.0:{FLASK_PORT}/status")

    # Start camera in background thread (runs forever)
    camera_active = True
    threading.Thread(target=camera_loop, daemon=True).start()

    # Flask on main thread
    app.run(host="0.0.0.0", port=FLASK_PORT, debug=False, threaded=True)
