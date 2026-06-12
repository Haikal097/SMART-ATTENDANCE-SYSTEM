<?php

// app/Http/Controllers/StudentController.php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\Request;
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

        // Class filter
        if ($request->filled('class')) {
            $query->where('class_id', $request->class);
        }

        $students = $query->orderBy('name')->paginate(15)->withQueryString();

        $students->through(fn ($s) => [
            'id'             => $s->id,
            'name'           => $s->name,
            'studentId'      => $s->student_id,
            'email'          => $s->email,
            'phone'          => $s->phone,
            'class'          => $s->class_id ?? 'Unassigned',
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
            'filters'  => $request->only(['search', 'status', 'class']),
            'classes'  => Student::select('class_id')
                ->distinct()
                ->whereNotNull('class_id')
                ->pluck('class_id'),
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
        return Inertia::render('Students/Create', [
            'classes' => \App\Models\ClassRoom::select('id', 'name', 'code')->get()
        ]);
    }

    /**
     * Store a newly created student.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'student_id' => 'required|string|unique:students',
            'email' => 'required|email|unique:students',
            'phone' => 'nullable|string',
            'class_id' => 'nullable|exists:classes,id',
            'enrollment_date' => 'nullable|date',
        ]);

        $student = Student::create($validated);

        return redirect()->route('students.index')
            ->with('success', 'Student created successfully.');
    }

    /**
     * Display the specified student.
     */
    public function show(Student $student)
    {
        return Inertia::render('Students/Show', [
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'studentId' => $student->student_id,
                'email' => $student->email,
                'phone' => $student->phone,
                'class' => $student->class?->name,
                'enrollmentDate' => $student->enrollment_date?->format('Y-m-d'),
                'status' => $student->status,
                'attendanceRate' => $student->attendance_rate,
                'faceRegistered' => $student->face_registered,
                'attendances' => $student->attendances()->latest()->take(10)->get(),
            ]
        ]);
    }

    /**
     * Show the form for editing the specified student.
     */
    public function edit(Student $student)
    {
        return Inertia::render('Students/Edit', [
            'student' => $student,
            'classes' => \App\Models\ClassRoom::select('id', 'name', 'code')->get()
        ]);
    }

    /**
     * Update the specified student.
     */
    public function update(Request $request, Student $student)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'student_id' => 'required|string|unique:students,student_id,' . $student->id,
            'email' => 'required|email|unique:students,email,' . $student->id,
            'phone' => 'nullable|string',
            'class_id' => 'nullable|exists:classes,id',
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
     * Export students data.
     */
    public function export(Request $request)
    {
        // Generate and return CSV/Excel file
        $students = Student::all();
        
        // Export logic here
        
        return response()->download($filename);
    }
}