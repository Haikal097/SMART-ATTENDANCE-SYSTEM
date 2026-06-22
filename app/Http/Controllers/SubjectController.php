<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use App\Models\User;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Subject::withCount(['students', 'sessions'])
            ->with(['lecturers:id,name,email']);

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('code', 'like', "%{$request->search}%")
                  ->orWhere('name', 'like', "%{$request->search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $subjects = $query->orderBy('code')->paginate(15)->withQueryString();

        return Inertia::render('Subjects/index', [
            'subjects' => $subjects,
            'filters'  => $request->only(['search', 'status']),
            'stats'    => [
                'total'         => Subject::count(),
                'active'        => Subject::where('status', 'active')->count(),
                'totalStudents' => \DB::table('student_subject')->distinct('student_id')->count(),
                'totalSessions' => \DB::table('class_sessions')->count(),
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Subjects/create', [
            'lecturers' => User::where('role', 'lecturer')
                ->select('id', 'name', 'email')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code'                => 'required|string|unique:subjects,code|max:20',
            'name'                => 'required|string|max:255',
            'description'         => 'nullable|string',
            'credit_hours'        => 'required|integer|min:1|max:10',
            'status'              => 'required|in:active,inactive',
            'start_date'          => 'nullable|date',
            'end_date'            => 'nullable|date|after_or_equal:start_date',
            'lecturers'           => 'nullable|array',
            'lecturers.*.user_id' => 'required|exists:users,id',
            'lecturers.*.role'    => 'required|in:lecturer',
        ]);

        $subject = Subject::create([
            'code'         => $validated['code'],
            'name'         => $validated['name'],
            'description'  => $validated['description'] ?? null,
            'credit_hours' => $validated['credit_hours'],
            'status'       => $validated['status'],
            'start_date'   => $validated['start_date'] ?? null,
            'end_date'     => $validated['end_date']   ?? null,
        ]);

        if (!empty($validated['lecturers'])) {
            $lecturers = collect($validated['lecturers'])
                ->filter(fn($l) => !empty($l['user_id']))
                ->mapWithKeys(fn($l) => [$l['user_id'] => ['role' => $l['role']]]);

            $subject->lecturers()->sync($lecturers);
        }

        return redirect()->route('subjects.index')
            ->with('success', 'Subject created successfully.');
    }

    public function show(Subject $subject)
    {
        $subject->load([
            'lecturers:id,name,email',
            'students:id,name,student_id,email,status',
            'sessions' => fn($q) => $q->withCount([
                'attendances as present_count' => fn($q) => $q->whereIn('status', ['present', 'late']),
                'attendances as total_count',
            ])->orderBy('date', 'desc'),
        ]);

        return Inertia::render('Subjects/show', [
            'subject' => [
                'id'           => $subject->id,
                'code'         => $subject->code,
                'name'         => $subject->name,
                'description'  => $subject->description,
                'credit_hours' => $subject->credit_hours,
                'status'       => $subject->status,
                'lecturers'    => $subject->lecturers->map(fn($l) => [
                    'id'    => $l->id,
                    'name'  => $l->name,
                    'email' => $l->email,
                    'pivot' => ['role' => $l->pivot->role],
                ]),
                'students' => $subject->students->map(fn($s) => [
                    'id'         => $s->id,
                    'name'       => $s->name,
                    'student_id' => $s->student_id,
                    'email'      => $s->email,
                    'status'     => $s->status,
                    'pivot'      => ['enrolled_at' => $s->pivot->enrolled_at],
                ]),
                'sessions' => $subject->sessions->map(fn($s) => [
                    'id'             => $s->id,
                    'date'           => $s->date->format('Y-m-d'),
                    'start_block'    => $s->start_block,
                    'end_block'      => $s->end_block,
                    'start_time'     => \App\Models\Session::BLOCKS[$s->start_block]['start'],
                    'end_time'       => \App\Models\Session::BLOCKS[$s->end_block]['end'],
                    'room'           => $s->room,
                    'status'         => $s->status,
                    'present'        => $s->present_count ?? 0,
                    'total'          => $s->total_count   ?? 0,
                ]),
                'stats' => [
                    'totalStudents' => $subject->students->count(),
                    'totalSessions' => $subject->sessions->count(),
                    'avgAttendance' => $this->calcAvgAttendance($subject),
                ],
            ],
            'availableStudents' => Student::whereNotIn('id', $subject->students->pluck('id'))
                ->select('id', 'name', 'student_id', 'email')
                ->orderBy('name')
                ->get(),
            'canManage' => in_array(auth()->user()->role, ['admin', 'lecturer']),
        ]);
    }

    public function edit(Subject $subject)
    {
        $subject->load('lecturers:id,name,email');

        return Inertia::render('Subjects/create', [
            'subject' => [
                'id'           => $subject->id,
                'code'         => $subject->code,
                'name'         => $subject->name,
                'description'  => $subject->description ?? '',
                'credit_hours' => $subject->credit_hours,
                'status'       => $subject->status,
                'start_date'   => $subject->start_date?->format('Y-m-d') ?? '',  // ← fixed
                'end_date'     => $subject->end_date?->format('Y-m-d')   ?? '',  // ← fixed
                'lecturers'    => $subject->lecturers->map(fn($l) => [
                    'id'    => $l->id,
                    'pivot' => ['role' => $l->pivot->role],
                ]),
            ],
            'lecturers' => User::where('role', 'lecturer')
                ->select('id', 'name', 'email')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function update(Request $request, Subject $subject)
    {
        $validated = $request->validate([
            'code'                => 'required|string|max:20|unique:subjects,code,' . $subject->id,
            'name'                => 'required|string|max:255',
            'description'         => 'nullable|string',
            'credit_hours'        => 'required|integer|min:1|max:10',
            'status'              => 'required|in:active,inactive',
            'start_date'          => 'nullable|date',
            'end_date'            => 'nullable|date|after_or_equal:start_date',
            'lecturers'           => 'nullable|array',
            'lecturers.*.user_id' => 'required|exists:users,id',
            'lecturers.*.role'    => 'required|in:lecturer',
        ]);

        $subject->update([
            'code'         => $validated['code'],
            'name'         => $validated['name'],
            'description'  => $validated['description'] ?? null,
            'credit_hours' => $validated['credit_hours'],
            'status'       => $validated['status'],
            'start_date'   => $validated['start_date'] ?? null,  // ← fixed
            'end_date'     => $validated['end_date']   ?? null,  // ← fixed
        ]);

        $lecturers = collect($validated['lecturers'] ?? [])
            ->filter(fn($l) => !empty($l['user_id']))
            ->mapWithKeys(fn($l) => [$l['user_id'] => ['role' => $l['role']]]);

        $subject->lecturers()->sync($lecturers);

        return redirect()->route('subjects.index')
            ->with('success', 'Subject updated successfully.');
    }

    public function destroy(Subject $subject)
    {
        $subject->delete();
        return back()->with('success', 'Subject deleted.');
    }

    public function enroll(Request $request, Subject $subject)
    {
        $request->validate([
            'student_ids'   => 'required|array|min:1',
            'student_ids.*' => 'exists:students,id',
        ]);

        $syncData = collect($request->student_ids)
            ->mapWithKeys(fn($id) => [$id => ['enrolled_at' => now()->toDateString()]]);

        $subject->students()->syncWithoutDetaching($syncData);

        return back()->with('success', count($request->student_ids) . ' student(s) enrolled.');
    }

    public function unenroll(Subject $subject, Student $student)
    {
        $subject->students()->detach($student->id);
        return back()->with('success', "{$student->name} removed from subject.");
    }

    private function calcAvgAttendance(Subject $subject): float
    {
        $sessions = $subject->sessions()->withCount([
            'attendances as present_count' => fn($q) => $q->whereIn('status', ['present', 'late']),
            'attendances as total_count',
        ])->get();

        if ($sessions->isEmpty()) return 0;

        $total   = $sessions->sum('total_count');
        $present = $sessions->sum('present_count');

        return $total > 0 ? round(($present / $total) * 100, 1) : 0;
    }
}