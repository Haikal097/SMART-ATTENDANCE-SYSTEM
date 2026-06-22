<?php

// app/Http/Controllers/StudentController.php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class StudentController extends Controller
{
    /**
     * Display a listing of the students.
     */
    public function index(Request $request)
    {
        $query = Student::query()
            ->select('students.*')
            ->selectRaw('
                (SELECT ROUND(
                    SUM(status IN ("present","late")) / NULLIF(COUNT(*), 0) * 100
                ) FROM attendances WHERE attendances.student_id = students.id) as computed_rate
            ')
            ->selectRaw('
                (SELECT COUNT(*) FROM attendances WHERE attendances.student_id = students.id) as total_sessions
            ');

        // Search
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name',        'like', "%{$request->search}%")
                  ->orWhere('email',      'like', "%{$request->search}%")
                  ->orWhere('student_id', 'like', "%{$request->search}%");
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $students = $query->orderBy('name')->paginate(15)->withQueryString();

        $students->through(fn ($s) => [
            'id'             => $s->id,
            'name'           => $s->name,
            'studentId'      => $s->student_id,
            'email'          => $s->email,
            'phone'          => $s->phone,
            'enrollmentDate' => $s->enrollment_date,
            'status'         => $s->status ?? 'active',
            'attendanceRate' => (int) ($s->computed_rate ?? 0),
            'totalSessions'  => (int) ($s->total_sessions ?? 0),
            'faceRegistered' => (bool) $s->face_registered,
        ]);

        // Overall avg rate from actual attendance records
        $attStats = \App\Models\Attendance::selectRaw(
            'student_id,
             SUM(status IN ("present","late")) as attended,
             COUNT(*) as total'
        )->groupBy('student_id')->get();

        $avgRate = $attStats->count() > 0
            ? round($attStats->avg(fn ($r) => $r->total > 0 ? ($r->attended / $r->total * 100) : 0), 1)
            : 0;

        return Inertia::render('Students/Index', [
            'students' => $students,
            'filters'  => $request->only(['search', 'status']),
            'stats'    => [
                'total'          => Student::count(),
                'active'         => Student::where('status', 'active')->count(),
                'faceRegistered' => Student::where('face_registered', true)->count(),
                'avgAttendance'  => $avgRate,
            ],
        ]);
    }
    
    // Also make sure your destroy() and bulkAction() look like this:
    
    public function destroy(Student $student)
    {
        $student->delete();
        return back()->with('success', 'Student deleted.');
    }

    /**
     * Show the form for creating a new student.
     */
    public function create()
    {
        return Inertia::render('Students/Create');
    }

    /**
     * Store a newly created student.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'student_id'      => 'required|string|unique:students',
            'email'           => 'required|email|unique:students|unique:users',
            'phone'           => 'nullable|string',
            'enrollment_date' => 'nullable|date',
            'password'        => 'required|string|min:6',
        ]);

        // Create login account
        User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => 'student',
        ]);

        // Create student record
        Student::create([
            'name'            => $validated['name'],
            'student_id'      => $validated['student_id'],
            'email'           => $validated['email'],
            'phone'           => $validated['phone'] ?? null,
            'enrollment_date' => $validated['enrollment_date'] ?? null,
            'status'          => 'active',
        ]);

        return redirect()->route('students.index')
            ->with('success', "Student {$validated['name']} created. They can log in with their email and the password you set.");
    }

    /**
     * Display the specified student.
     */
    public function show(Student $student)
    {
        $attendances = $student->attendances()->with('session.subject')->get();
        $totalSessions = $attendances->count();
        $attended      = $attendances->whereIn('status', ['present', 'late'])->count();
        $rate          = $totalSessions > 0 ? round(($attended / $totalSessions) * 100) : 0;

        $recent = $student->attendances()
            ->with('session.subject')
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get()
            ->map(fn ($a) => [
                'id'          => $a->id,
                'status'      => $a->status,
                'date'        => $a->session?->date?->format('Y-m-d'),
                'subject'     => $a->session?->subject?->name ?? '—',
                'subject_code'=> $a->session?->subject?->code ?? '—',
                'time'        => $a->session
                    ? \App\Models\Session::BLOCKS[$a->session->start_block]['start']
                      . '–' . \App\Models\Session::BLOCKS[$a->session->end_block]['end']
                    : '—',
                'checked_in_at' => $a->checked_in_at,
            ]);

        $subjects = $student->subjects()
            ->select('subjects.id', 'subjects.code', 'subjects.name', 'subjects.status')
            ->get()
            ->map(fn ($s) => [
                'id'     => $s->id,
                'code'   => $s->code,
                'name'   => $s->name,
                'status' => $s->status,
            ]);

        $user = $student->user;

        return Inertia::render('Students/Show', [
            'student' => [
                'id'             => $student->id,
                'name'           => $student->name,
                'studentId'      => $student->student_id,
                'email'          => $student->email,
                'phone'          => $student->phone,
                'enrollmentDate' => $student->enrollment_date ? \Carbon\Carbon::parse($student->enrollment_date)->format('Y-m-d') : null,
                'status'         => $student->status ?? 'active',
                'faceStatus'     => $user?->face_status ?? 'none',
                'attendanceRate' => $rate,
                'totalSessions'  => $totalSessions,
                'attended'       => $attended,
            ],
            'subjects'          => $subjects,
            'recentAttendance'  => $recent,
        ]);
    }

    /**
     * Show the form for editing the specified student.
     */
    public function edit(Student $student)
    {
        return Inertia::render('Students/Edit', [
            'student' => $student,
        ]);
    }

    /**
     * Update the specified student.
     */
    public function update(Request $request, Student $student)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'student_id' => 'required|string|unique:students,student_id,' . $student->id,
            'email'      => 'required|email|unique:students,email,' . $student->id,
            'phone'  => 'nullable|string',
            'status' => 'nullable|in:active,inactive,graduated,suspended',
        ]);

        $student->update($validated);

        return redirect()->route('students.index')
            ->with('success', 'Student updated successfully.');
    }

    /**
     * Handle bulk actions.
     */
    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'action' => 'required|in:delete,register_face,email',
            'ids' => 'required|array',
            'ids.*' => 'exists:students,id'
        ]);

        $students = Student::whereIn('id', $validated['ids']);

        switch ($validated['action']) {
            case 'delete':
                $students->delete();
                $message = 'Students deleted successfully.';
                break;
            case 'register_face':
                // Trigger face registration process
                $message = 'Face registration initiated for selected students.';
                break;
            case 'email':
                // Send email to selected students
                $message = 'Emails sent to selected students.';
                break;
        }

        return back()->with('success', $message);
    }

    /**
     * Show import page.
     */
    public function import()
    {
        return Inertia::render('Students/Import');
    }

    /**
     * Handle import.
     */
    public function importStore(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls'
        ]);

        // Process import logic here
        
        return redirect()->route('students.index')
            ->with('success', 'Students imported successfully.');
    }

    /**
     * Export students data as CSV.
     */
    public function export(Request $request)
    {
        $students = Student::query()
            ->selectRaw('
                students.*,
                (SELECT ROUND(SUM(status IN ("present","late")) / NULLIF(COUNT(*), 0) * 100)
                 FROM attendances WHERE attendances.student_id = students.id) as computed_rate,
                (SELECT COUNT(*) FROM attendances WHERE attendances.student_id = students.id) as total_sessions
            ')
            ->orderBy('name')
            ->get();

        $filename = 'students_' . now()->format('Ymd_His') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($students) {
            $out = fopen('php://output', 'w');

            fputcsv($out, ['Name', 'Student ID', 'Email', 'Phone', 'Status', 'Enrollment Date', 'Face Registered', 'Attendance Rate (%)', 'Total Sessions']);

            foreach ($students as $s) {
                fputcsv($out, [
                    $s->name,
                    $s->student_id,
                    $s->email,
                    $s->phone ?? '',
                    $s->status ?? 'active',
                    $s->enrollment_date ?? '',
                    $s->face_registered ? 'Yes' : 'No',
                    (int) ($s->computed_rate ?? 0),
                    (int) ($s->total_sessions ?? 0),
                ]);
            }

            fclose($out);
        };

        return response()->stream($callback, 200, $headers);
    }
}