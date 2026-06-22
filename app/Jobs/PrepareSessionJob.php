<?php
// ─── app/Jobs/PrepareSessionJob.php ──────────────────────────────────────────
 
namespace App\Jobs;
 
use App\Models\Session;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
 
class PrepareSessionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
 
    public function handle(): void
    {
        $piUrl   = config('pi.url');       // http://192.168.0.41:5000
        $piToken = config('pi.token');     // shared secret token
 
        // Find sessions starting in the next 10 minutes OR already running
        $upcoming = Session::whereIn('status', ['scheduled', 'ongoing'])
            ->whereDate('date', today())
            ->get()
            ->filter(function ($session) {
                $today     = today()->format('Y-m-d');
                $startTime = \Carbon\Carbon::parse($today . ' ' . Session::BLOCKS[$session->start_block]['start']);
                $endTime   = \Carbon\Carbon::parse($today . ' ' . Session::BLOCKS[$session->end_block]['end']);
                // Send if session hasn't ended yet and starts within 10 minutes (or already started)
                return now()->lt($endTime) && now()->diffInMinutes($startTime, false) <= 10;
            });
 
        foreach ($upcoming as $session) {
            $session->load('subject');
 
            // Get enrolled students with approved face images (face data is on users table)
            $students = $session->subject->students()
                ->join('users', 'users.email', '=', 'students.email')
                ->where('users.face_status', 'approved')
                ->whereNotNull('users.face_image_path')
                ->select('students.id', 'students.name', 'students.student_id', 'students.email')
                ->get()
                ->map(fn($s) => [
                    'id'             => $s->id,
                    'name'           => $s->name,
                    'face_url'       => $s->face_image_url,
                    'face_left_url'  => $s->face_left_path  ? config('app.url') . '/storage/' . $s->face_left_path  : null,
                    'face_right_url' => $s->face_right_path ? config('app.url') . '/storage/' . $s->face_right_path : null,
                ]);
 
            if ($students->isEmpty()) {
                Log::info("PrepareSessionJob: No approved faces for session {$session->id}");
                continue;
            }
 
            $payload = [
                'session_id'  => $session->id,
                'subject'     => $session->subject->code,
                'subject_name'=> $session->subject->name,
                'start_time'  => Session::BLOCKS[$session->start_block]['start'],
                'end_time'    => Session::BLOCKS[$session->end_block]['end'],
                'students'    => $students,
            ];
 
            try {
                $response = Http::withHeaders([
                    'X-Pi-Token' => $piToken,
                    'Accept'     => 'application/json',
                ])
                ->timeout(10)
                ->post("{$piUrl}/prepare", $payload);
 
                if ($response->successful()) {
                    Log::info("PrepareSessionJob: Session {$session->id} sent to Pi successfully.");
                } else {
                    Log::warning("PrepareSessionJob: Pi responded with {$response->status()} for session {$session->id}");
                }
            } catch (\Exception $e) {
                // Fail silently — Pi might be offline
                Log::warning("PrepareSessionJob: Could not reach Pi — {$e->getMessage()}");
            }
        }
    }
}