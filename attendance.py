#!/usr/bin/env python3
# ─── attendance.py ───────────────────────────────────────────────────────────
# Raspberry Pi attendance system
# Place this file on your Pi and run: python3 attendance.py
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
import os
from datetime import datetime
from flask import Flask, request, jsonify
from picamera2 import Picamera2

# ─── Config ──────────────────────────────────────────────────────────────────
LARAVEL_URL  = "http://192.168.0.27:8000"  # Your Laravel server
PI_TOKEN     = "my-super-secret-pi-token-123"  # Must match PI_TOKEN in .env
FLASK_PORT   = 5000
SCAN_INTERVAL = 1       # Seconds between each face scan
HEADERS = {
    "X-Pi-Token": PI_TOKEN,
    "Accept":     "application/json",
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

current_session   = None     # Current session dict from Laravel
known_encodings   = []       # List of face encodings
known_students    = []       # List of student dicts matching encodings
marked_students   = set()    # Student IDs already marked this session
camera_thread     = None
camera_running    = False
picam_instance    = None     # Track globally so stop_camera() can force-close it
session_lock      = threading.Lock()

annotated_frame   = None     # Latest annotated BGR frame for the display window
frame_lock        = threading.Lock()


# ─── Flask endpoint — Laravel pushes session data here ───────────────────────
@app.route("/prepare", methods=["POST"])
def prepare():
    """
    Laravel calls this ~10 min before a session starts.
    Receives session info + student face URLs.
    """
    token = request.headers.get("X-Pi-Token")
    if token != PI_TOKEN:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    if not data or "session_id" not in data:
        return jsonify({"error": "Invalid payload"}), 400

    log.info(f"Received session prepare: Session {data['session_id']} — {data.get('subject')}")
    log.info(f"Students to load: {len(data.get('students', []))}")

    # Load faces in background so we respond to Laravel quickly
    thread = threading.Thread(target=load_session, args=(data,), daemon=True)
    thread.start()

    return jsonify({
        "success": True,
        "message": f"Loading {len(data.get('students', []))} faces for session {data['session_id']}",
    })


@app.route("/status", methods=["GET"])
def status():
    """Health check — Laravel or admin can call this to check Pi is alive."""
    with session_lock:
        return jsonify({
            "online":          True,
            "session_id":      current_session["session_id"] if current_session else None,
            "subject":         current_session.get("subject") if current_session else None,
            "faces_loaded":    len(known_encodings),
            "marked_students": len(marked_students),
            "camera_running":  camera_running,
        })


@app.route("/stop", methods=["POST"])
def stop():
    """Laravel can call this to manually stop scanning."""
    token = request.headers.get("X-Pi-Token")
    if token != PI_TOKEN:
        return jsonify({"error": "Unauthorized"}), 401

    stop_camera()
    return jsonify({"success": True, "message": "Camera stopped"})


# ─── Session loading ──────────────────────────────────────────────────────────
def load_session(data: dict):
    """Download face images and encode them, then start camera."""
    global current_session, known_encodings, known_students, marked_students

    new_encodings = []
    new_students  = []

    for student in data.get("students", []):
        face_url = student.get("face_url")
        if not face_url:
            log.warning(f"No face URL for student {student.get('name')}")
            continue

        try:
            # Download image
            response = requests.get(face_url, timeout=10)
            response.raise_for_status()

            # Decode image
            img_array = np.frombuffer(response.content, np.uint8)
            rgb_img   = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
            rgb_img   = cv2.cvtColor(rgb_img, cv2.COLOR_BGR2RGB)

            # Encode face
            encodings = face_recognition.face_encodings(rgb_img)
            if not encodings:
                log.warning(f"No face found in image for {student.get('name')}")
                continue

            new_encodings.append(encodings[0])
            new_students.append(student)
            log.info(f"Loaded face for {student.get('name')} (ID: {student.get('id')})")

        except Exception as e:
            log.error(f"Failed to load face for {student.get('name')}: {e}")

    # Update global state
    with session_lock:
        current_session = data
        known_encodings = new_encodings
        known_students  = new_students
        marked_students = set()

    log.info(f"Session ready: {len(new_encodings)} faces loaded for session {data['session_id']}")

    # Start camera
    start_camera(data)


# ─── Camera loop ─────────────────────────────────────────────────────────────
def start_camera(session_data: dict):
    """Start the camera scanning loop in a background thread."""
    global camera_thread, camera_running

    stop_camera()  # Stop any existing camera first

    camera_running = True
    camera_thread  = threading.Thread(
        target=camera_loop,
        args=(session_data,),
        daemon=True,
    )
    camera_thread.start()
    log.info("Camera started")


def stop_camera():
    """Stop the camera loop and force-close the hardware."""
    global camera_running, picam_instance
    camera_running = False
    if camera_thread and camera_thread.is_alive():
        camera_thread.join(timeout=8)
    if picam_instance is not None:
        try:
            picam_instance.stop()
            picam_instance.close()
        except Exception:
            pass
        picam_instance = None
    time.sleep(1)  # Give OS time to release the hardware
    log.info("Camera stopped")


def camera_loop(session_data: dict):
    """Main camera loop — captures frames and matches faces."""
    global camera_running, annotated_frame

    # Calculate session end time
    end_block   = session_data.get("end_block", 10)
    end_time_str = None
    try:
        from app_models import BLOCKS
    except ImportError:
        # Inline block definitions matching Laravel
        BLOCKS = {
            1:  {"start": "08:00", "end": "09:00"},
            2:  {"start": "09:00", "end": "10:00"},
            3:  {"start": "10:00", "end": "11:00"},
            4:  {"start": "11:00", "end": "12:00"},
            5:  {"start": "12:00", "end": "13:00"},
            6:  {"start": "13:00", "end": "14:00"},
            7:  {"start": "14:00", "end": "15:00"},
            8:  {"start": "15:00", "end": "16:00"},
            9:  {"start": "16:00", "end": "17:00"},
            10: {"start": "17:00", "end": "18:00"},
        }

    session_end_str = session_data.get("end_time") or BLOCKS.get(end_block, {}).get("end", "18:00")
    session_date    = datetime.now().strftime("%Y-%m-%d")
    session_end     = datetime.strptime(f"{session_date} {session_end_str}", "%Y-%m-%d %H:%M")

    # Init Pi Camera — retry up to 3 times in case hardware needs a moment to release
    global picam_instance
    picam = None
    for attempt in range(3):
        try:
            picam = Picamera2()
            picam_instance = picam
            break
        except RuntimeError as e:
            log.warning(f"Camera init attempt {attempt + 1} failed: {e}")
            time.sleep(3)

    if picam is None:
        log.error("Could not initialize camera after 3 attempts — aborting")
        return

    config = picam.create_preview_configuration(main={"format": "BGR888", "size": (640, 480)})
    picam.configure(config)
    picam.start()
    time.sleep(2)  # Warm up camera

    subject_label        = session_data.get("subject_name") or session_data.get("subject", "")
    last_face_overlays   = []   # [(top,right,bottom,left), label, color] from last recognition
    last_recognition_at  = 0.0
    log.info(f"Scanning until {session_end_str}")

    try:
        while camera_running:
            # Stop when session ends
            if datetime.now() >= session_end:
                log.info("Session ended — stopping camera")
                break

            # Capture frame (BGR888) — runs as fast as the camera allows (~30fps)
            bgr = picam.capture_array()
            rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)  # face_recognition needs RGB

            # Run face recognition only every SCAN_INTERVAL seconds
            now = time.time()
            if now - last_recognition_at >= SCAN_INTERVAL:
                last_recognition_at = now
                face_locations = face_recognition.face_locations(rgb, model="hog")
                new_overlays   = []

                if face_locations:
                    face_encodings_in_frame = face_recognition.face_encodings(rgb, face_locations)

                    with session_lock:
                        session_id     = current_session["session_id"] if current_session else None
                        encodings_copy = list(known_encodings)
                        students_copy  = list(known_students)
                        marked_copy    = set(marked_students)

                    for i, loc in enumerate(face_locations):
                        label = "Unknown"
                        color = (0, 0, 255)

                        if i < len(face_encodings_in_frame) and encodings_copy and session_id:
                            face_enc  = face_encodings_in_frame[i]
                            distances = face_recognition.face_distance(encodings_copy, face_enc)
                            matches   = face_recognition.compare_faces(encodings_copy, face_enc, tolerance=0.5)
                            best_idx  = int(np.argmin(distances))

                            if matches[best_idx]:
                                student    = students_copy[best_idx]
                                conf       = (1 - distances[best_idx]) * 100
                                student_id = student["id"]
                                label      = f"{student['name']} ({conf:.0f}%)"

                                if student_id in marked_copy:
                                    color = (0, 200, 255)  # Amber — already marked
                                else:
                                    color = (0, 255, 0)    # Green
                                    log.info(f"Recognised: {student['name']} ({conf:.1f}%)")
                                    if post_attendance(session_id, student_id):
                                        with session_lock:
                                            marked_students.add(student_id)
                                        log.info(f"Marked attendance for {student['name']}")

                        new_overlays.append((loc, label, color))

                last_face_overlays = new_overlays

            # Draw last known face overlays on every frame (smooth video)
            for (top, right, bottom, left), label, color in last_face_overlays:
                cv2.rectangle(bgr, (left, top), (right, bottom), color, 2)
                (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
                cv2.rectangle(bgr, (left, top - th - 10), (left + tw + 6, top), color, -1)
                cv2.putText(bgr, label, (left + 3, top - 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

            # HUD bar
            with session_lock:
                marked_count = len(marked_students)
                total_count  = len(known_students)
            now_str = datetime.now().strftime("%H:%M:%S")
            hud = f"{subject_label}  |  {marked_count}/{total_count} marked  |  {now_str}"
            cv2.rectangle(bgr, (0, 0), (640, 28), (30, 30, 30), -1)
            cv2.putText(bgr, hud, (8, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220, 220, 220), 1)

            with frame_lock:
                annotated_frame = bgr

    except Exception as e:
        log.error(f"Camera loop error: {e}")
    finally:
        if picam is not None:
            try:
                picam.stop()
                picam.close()
            except Exception:
                pass
        picam_instance = None
        log.info("Camera closed")


# ─── Post attendance to Laravel ───────────────────────────────────────────────
def post_attendance(session_id: int, student_id: int) -> bool:
    """Send attendance record to Laravel."""
    try:
        response = requests.post(
            f"{LARAVEL_URL}/api/attendance/record",
            json={
                "session_id": session_id,
                "student_id": student_id,
                "timestamp":  datetime.now().isoformat(),
            },
            headers=HEADERS,
            timeout=5,
        )

        if response.ok:
            data = response.json()
            log.info(f"Laravel response: {data.get('message')}")
            return True
        else:
            log.warning(f"Laravel returned {response.status_code}: {response.text}")
            return False

    except requests.exceptions.ConnectionError:
        log.warning("Could not reach Laravel server — failing silently")
        return False
    except Exception as e:
        log.error(f"Error posting attendance: {e}")
        return False


# ─── Display loop (runs on main thread) ──────────────────────────────────────
def display_loop():
    """Show annotated camera feed in a window on the Pi's screen."""
    cv2.namedWindow("Attendance System", cv2.WINDOW_NORMAL)
    cv2.resizeWindow("Attendance System", 800, 600)

    placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.putText(placeholder, "Waiting for session...", (130, 230),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (180, 180, 180), 2)
    cv2.putText(placeholder, "Prepare a session to start scanning", (70, 275),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 100, 100), 1)

    while True:
        with frame_lock:
            f = annotated_frame

        cv2.imshow("Attendance System", f if f is not None else placeholder)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cv2.destroyAllWindows()


# ─── Startup ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    log.info("Pi Attendance System starting...")
    log.info(f"Laravel server: {LARAVEL_URL}")
    log.info(f"Listening on port {FLASK_PORT}")

    # Flask must run in a background thread so display_loop can own the main thread
    flask_thread = threading.Thread(
        target=lambda: app.run(host="0.0.0.0", port=FLASK_PORT, debug=False, threaded=True),
        daemon=True,
    )
    flask_thread.start()

    # Display window on main thread (required by OpenCV on Linux)
    display_loop()
