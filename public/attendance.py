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
LARAVEL_URL  = "http://192.168.0.12:8000"   # Your Laravel server
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
session_lock      = threading.Lock()


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
            img       = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
            rgb_img   = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

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
    """Stop the camera loop."""
    global camera_running
    camera_running = False
    if camera_thread and camera_thread.is_alive():
        camera_thread.join(timeout=5)
    log.info("Camera stopped")


def camera_loop(session_data: dict):
    """Main camera loop — captures frames and matches faces."""
    global camera_running

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

    # Init Pi Camera
    picam = Picamera2()
    config = picam.create_preview_configuration(main={"format": "RGB888", "size": (640, 480)})
    picam.configure(config)
    picam.start()
    time.sleep(2)  # Warm up camera

    log.info(f"Scanning until {session_end_str}")

    try:
        while camera_running:
            # Stop when session ends
            if datetime.now() >= session_end:
                log.info("Session ended — stopping camera")
                break

            # Capture frame
            frame = picam.capture_array()

            # Find faces in frame
            face_locations = face_recognition.face_locations(frame, model="hog")
            if not face_locations:
                time.sleep(SCAN_INTERVAL)
                continue

            face_encodings_in_frame = face_recognition.face_encodings(frame, face_locations)

            with session_lock:
                session_id     = current_session["session_id"] if current_session else None
                encodings_copy = list(known_encodings)
                students_copy  = list(known_students)
                marked_copy    = set(marked_students)

            if not session_id or not encodings_copy:
                time.sleep(SCAN_INTERVAL)
                continue

            for face_encoding in face_encodings_in_frame:
                matches    = face_recognition.compare_faces(encodings_copy, face_encoding, tolerance=0.5)
                distances  = face_recognition.face_distance(encodings_copy, face_encoding)

                if not any(matches):
                    continue

                best_match_idx = int(np.argmin(distances))
                if not matches[best_match_idx]:
                    continue

                student = students_copy[best_match_idx]
                student_id = student["id"]

                # Skip if already marked
                if student_id in marked_copy:
                    continue

                log.info(f"Recognised: {student['name']} (ID: {student_id})")

                # Post to Laravel
                success = post_attendance(session_id, student_id)

                if success:
                    with session_lock:
                        marked_students.add(student_id)
                    log.info(f"Marked attendance for {student['name']}")

            time.sleep(SCAN_INTERVAL)

    except Exception as e:
        log.error(f"Camera loop error: {e}")
    finally:
        picam.stop()
        picam.close()
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


# ─── Startup ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    log.info("Pi Attendance System starting...")
    log.info(f"Laravel server: {LARAVEL_URL}")
    log.info(f"Listening on port {FLASK_PORT}")

    # Start Flask server (listens for Laravel pushes)
    app.run(host="0.0.0.0", port=FLASK_PORT, debug=False, threaded=True)
