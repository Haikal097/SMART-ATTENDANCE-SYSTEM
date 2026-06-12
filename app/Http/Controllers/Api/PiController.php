<?php
// ─── app/Http/Controllers/Api/PiController.php ───────────────────────────────
 
namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Session;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
 
class PiController extends Controller
{
    /**
     * Pi posts this when it recognises a student face.
     * POST /api/attendance/record
     */
    public function record(Request $request): JsonResponse
    {
        $request->validate([
            'session_id' => 'required|integer|exists:class_sessions,id',
            'student_id' => 'required|integer|exists:students,id',
            'timestamp'  => 'required|string',
        ]);
 
        $session   = Session::findOrFail($request->session_id);
        $student   = Student::findOrFail($request->student_id);
        $checkedIn = now();
 
        // Determine status — late if more than 30 min after session start
        $sessionStart = \Carbon\Carbon::parse(
            $session->date->format('Y-m-d') . ' ' . Session::BLOCKS[$session->start_block]['start']
        );
        $minutesLate = $sessionStart->diffInMinutes($checkedIn, false);
        $status = $minutesLate > 30 ? 'late' : 'present';
 
        // Prevent duplicate — only record once per student per session
        $existing = Attendance::where('student_id', $student->id)
            ->where('session_id', $session->id)
            ->first();
 
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Already recorded',
                'status'  => $existing->status,
            ]);
        }
 
        Attendance::create([
            'student_id'    => $student->id,
            'session_id'    => $session->id,
            'status'        => $status,
            'checked_in_at' => $checkedIn,
            'method'        => 'face',
        ]);
 
        // Mark session as ongoing if it was scheduled
        if ($session->status === 'scheduled') {
            $session->update(['status' => 'ongoing']);
        }
 
        return response()->json([
            'success' => true,
            'student' => $student->name,
            'status'  => $status,
            'message' => "{$student->name} marked as {$status}",
        ]);
    }
 
    /**
     * Fallback — Pi can poll this to get the current session.
     * GET /api/session/current
     */
    public function current(): JsonResponse
    {
        $session = Session::currentSession();
 
        if (!$session) {
            return response()->json(['session' => null]);
        }
 
        $session->load('subject');
        $enrolledStudents = $session->subject->students()
            ->where('face_status', 'approved')
            ->whereNotNull('face_image_url')
            ->select('students.id', 'students.name', 'students.student_id', 'students.face_image_url')
            ->get();
 
        return response()->json([
            'session' => [
                'id'         => $session->id,
                'subject'    => $session->subject->code,
                'start_time' => Session::BLOCKS[$session->start_block]['start'],
                'end_time'   => Session::BLOCKS[$session->end_block]['end'],
                'students'   => $enrolledStudents->map(fn($s) => [
                    'id'       => $s->id,
                    'name'     => $s->name,
                    'face_url' => $s->face_image_url,
                ]),
            ],
        ]);
    }
}