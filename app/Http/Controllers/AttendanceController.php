<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Session;
use App\Models\Student;
use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    /**
     * Show the attendance recording page for a session.
     */
    private function authorise(Subject $subject): void
    {
        $user = auth()->user();

        // Students cannot access this page at all
        abort_if($user->role === 'student', 403, 'Access denied.');

        // Lecturers can only manage subjects they are assigned to
        if ($user->role === 'lecturer') {
            $assigned = $subject->lecturers()->where('users.id', $user->id)->exists();
            abort_if(! $assigned, 403, 'You are not assigned to this subject.');
        }

        // Admins pass through without further checks
    }

    public function show(Subject $subject, Session $session)
    {
        $this->authorise($subject);

        // Ensure the session actually belongs to this subject
        abort_if($session->subject_id !== $subject->id, 404);

        // Get all students enrolled in this subject
        $students = $subject->students()
            ->select('students.id', 'students.name', 'students.student_id', 'students.avatar_url')
            ->orderBy('students.name')
            ->get()
            ->map(function ($student) use ($session) {
                // Check if attendance already recorded for this session
                $record = Attendance::where('student_id', $student->id)
                    ->where('session_id', $session->id)
                    ->first();

                return [
                    'id'             => $student->id,
                    'name'           => $student->name,
                    'student_id'     => $student->student_id,
                    'avatar_url'     => $student->avatar_url,
                    'current_status' => $record?->status ?? null,
                ];
            });

        return Inertia::render('Attendance/Record', [
            'subject' => [
                'id'   => $subject->id,
                'code' => $subject->code,
                'name' => $subject->name,
            ],
            'session' => [
                'id'          => $session->id,
                'date'        => $session->date->format('Y-m-d'),
                'start_block' => $session->start_block,
                'end_block'   => $session->end_block,
                'start_time'  => \App\Models\Session::BLOCKS[$session->start_block]['start'],
                'end_time'    => \App\Models\Session::BLOCKS[$session->end_block]['end'],
                'room'        => $session->room,
                'status'      => $session->status,
            ],
            'students' => $students,
        ]);
    }

    /**
     * Save attendance records for a session.
     */
    public function store(Request $request, Subject $subject, Session $session)
    {
        $this->authorise($subject);

        abort_if($session->subject_id !== $subject->id, 404);

        $request->validate([
            'records'              => 'required|array',
            'records.*.student_id' => 'required|integer|exists:students,id',
            'records.*.status'     => 'required|in:present,absent,late,excused',
        ]);

        foreach ($request->records as $record) {
            Attendance::updateOrCreate(
                [
                    'student_id' => $record['student_id'],
                    'session_id' => $session->id,
                ],
                [
                    'status'        => $record['status'],
                    'method'        => 'manual',
                    'checked_in_at' => $record['status'] === 'present' || $record['status'] === 'late'
                        ? now()
                        : null,
                ]
            );
        }

        // Update session status to completed if it was scheduled/ongoing
        if (in_array($session->status, ['scheduled', 'ongoing'])) {
            $session->update(['status' => 'completed']);
        }

        return back()->with('success', 'Attendance saved successfully.');
    }
}