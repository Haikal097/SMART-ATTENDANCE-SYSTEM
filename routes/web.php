<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\StudentController; 
use App\Http\Controllers\MediaController; 
use App\Http\Controllers\FaceApprovalController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\ScheduleController;


Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        $role = auth()->user()->role;
        if ($role === 'student')  return redirect()->route('student.dashboard');
        if ($role === 'lecturer') return redirect()->route('lecturer.dashboard');

        $today = today()->toDateString();

        // ── Stats ─────────────────────────────────────────────────────────────
        $totalStudents       = \App\Models\Student::count();
        $activeSubjects      = \App\Models\Subject::where('status', 'active')->count();
        $todaySessionCount   = \App\Models\Session::whereDate('date', $today)->where('status', '!=', 'cancelled')->count();
        $pendingFaceApprovals = \App\Models\User::where('face_status', 'pending')->count();

        // ── Today's sessions ──────────────────────────────────────────────────
        $todayClasses = \App\Models\Session::with(['subject', 'subject.lecturers:id,name'])
            ->whereDate('date', $today)
            ->where('status', '!=', 'cancelled')
            ->orderBy('start_block')
            ->get()
            ->map(fn ($s) => [
                'id'             => $s->id,
                'subject_id'     => $s->subject_id,
                'subject_code'   => $s->subject->code ?? '—',
                'subject_name'   => $s->subject->name ?? '—',
                'time'           => \App\Models\Session::BLOCKS[$s->start_block]['start'] . '–' . \App\Models\Session::BLOCKS[$s->end_block]['end'],
                'status'         => $s->status,
                'room'           => $s->room,
                'enrolled_count' => $s->subject?->students()->count() ?? 0,
                'present_count'  => $s->attendances()->where('status', 'present')->count(),
                'late_count'     => $s->attendances()->where('status', 'late')->count(),
                'lecturer'       => $s->subject?->lecturers->first()?->name ?? 'TBA',
            ]);

        // ── Recent attendance (today, last 20) ────────────────────────────────
        $recentAttendance = \App\Models\Attendance::with(['student', 'session.subject'])
            ->whereHas('session', fn ($q) => $q->whereDate('date', $today))
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($a) => [
                'id'            => $a->id,
                'student_name'  => $a->student->name ?? '—',
                'student_id'    => $a->student->student_id ?? '—',
                'subject_code'  => $a->session->subject->code ?? '—',
                'checked_in_at' => $a->checked_in_at?->format('H:i') ?? '—',
                'status'        => $a->status,
                'method'        => $a->method,
            ]);

        // ── Weekly trend (last 7 days) ────────────────────────────────────────
        $weeklyTrend = collect(range(6, 0))->map(function ($daysAgo) {
            $date    = today()->subDays($daysAgo)->toDateString();
            $total   = \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereDate('date', $date))->count();
            $present = \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereDate('date', $date))->where('status', 'present')->count();
            return [
                'label'   => today()->subDays($daysAgo)->format('D'),
                'date'    => $date,
                'total'   => $total,
                'present' => $present,
                'rate'    => $total > 0 ? round(($present / $total) * 100) : 0,
            ];
        })->values()->all();

        // ── All schedules for weekly timetable ───────────────────────────────
        $subjectIndex = \App\Models\Subject::orderBy('id')->pluck('id')->values()->flip()->toArray();
        $weeklySchedules = \App\Models\Schedule::with('subject:id,code')
            ->get()
            ->map(fn ($sc) => [
                'subject_id'    => $sc->subject_id,
                'subject_code'  => $sc->subject->code,
                'subject_index' => $subjectIndex[$sc->subject_id] ?? 0,
                'day_of_week'   => $sc->day_of_week,
                'start_block'   => $sc->start_block,
                'end_block'     => $sc->end_block,
                'type'          => $sc->type,
                'time_range'    => $sc->time_range,
            ]);

        return Inertia::render('dashboard', [
            'stats' => [
                'totalStudents'       => $totalStudents,
                'activeSubjects'      => $activeSubjects,
                'todaySessions'       => $todaySessionCount,
                'pendingFaceApprovals'=> $pendingFaceApprovals,
            ],
            'todayClasses'     => $todayClasses,
            'recentAttendance' => $recentAttendance,
            'weeklySchedules'  => $weeklySchedules,
            'weeklyTrend'      => $weeklyTrend,
        ]);
    })->name('dashboard');

    // Reports & Analytics
    Route::get('/reports', function () {
        // ── Summary ───────────────────────────────────────────────────────────
        $totalStudents  = \App\Models\Student::count();
        $activeSubjects = \App\Models\Subject::where('status', 'active')->count();
        $totalSessions  = \App\Models\Session::where('status', '!=', 'cancelled')->count();

        $attRow     = \App\Models\Attendance::selectRaw('COUNT(*) as total, SUM(status = "present") as present_count')->first();
        $totalAtt   = (int) ($attRow->total ?? 0);
        $presentAll = (int) ($attRow->present_count ?? 0);
        $overallRate = $totalAtt > 0 ? round(($presentAll / $totalAtt) * 100) : 0;

        // ── 30-day trend ──────────────────────────────────────────────────────
        $trend = collect(range(29, 0))->map(function ($daysAgo) {
            $date    = today()->subDays($daysAgo)->toDateString();
            $total   = \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereDate('date', $date))->count();
            $present = \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereDate('date', $date))->where('status', 'present')->count();
            return [
                'date'    => $date,
                'label'   => today()->subDays($daysAgo)->format('d M'),
                'total'   => $total,
                'present' => $present,
                'rate'    => $total > 0 ? round(($present / $total) * 100) : null,
            ];
        })->values()->all();

        // ── Subject stats ─────────────────────────────────────────────────────
        $sessionCounts = \App\Models\Session::where('status', '!=', 'cancelled')
            ->selectRaw('subject_id, count(*) as session_count')
            ->groupBy('subject_id')
            ->get()->keyBy('subject_id');

        $subjectAtt = \App\Models\Attendance::join('class_sessions', 'attendances.session_id', '=', 'class_sessions.id')
            ->selectRaw('class_sessions.subject_id, count(*) as total, SUM(attendances.status = "present") as present_count, SUM(attendances.status = "late") as late_count')
            ->groupBy('class_sessions.subject_id')
            ->get()->keyBy('subject_id');

        $subjectStats = \App\Models\Subject::withCount('students')->get()->map(function ($subj) use ($sessionCounts, $subjectAtt) {
            $sessions = (int) ($sessionCounts->get($subj->id)?->session_count ?? 0);
            $att      = $subjectAtt->get($subj->id);
            $total    = (int) ($att?->total ?? 0);
            $present  = (int) ($att?->present_count ?? 0);
            $late     = (int) ($att?->late_count ?? 0);
            $rate     = $total > 0 ? round(($present / $total) * 100) : 0;
            return [
                'id'       => $subj->id,
                'code'     => $subj->code,
                'name'     => $subj->name,
                'status'   => $subj->status,
                'enrolled' => $subj->students_count,
                'sessions' => $sessions,
                'total'    => $total,
                'present'  => $present,
                'late'     => $late,
                'absent'   => max(0, $total - $present - $late),
                'rate'     => $rate,
            ];
        })->sortByDesc('enrolled')->values()->all();

        // ── Method breakdown ──────────────────────────────────────────────────
        $methods = \App\Models\Attendance::selectRaw('COALESCE(method, "unknown") as method, count(*) as count')
            ->groupBy('method')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($m) => ['method' => $m->method, 'count' => (int) $m->count])
            ->values()->all();

        // ── Day-of-week stats (MySQL DAYOFWEEK: 2=Mon … 6=Fri) ───────────────
        $dayStats = collect([
            ['day' => 'Mon', 'num' => 2],
            ['day' => 'Tue', 'num' => 3],
            ['day' => 'Wed', 'num' => 4],
            ['day' => 'Thu', 'num' => 5],
            ['day' => 'Fri', 'num' => 6],
        ])->map(function ($d) {
            $total   = \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereRaw('DAYOFWEEK(date) = ?', [$d['num']]))->count();
            $present = \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereRaw('DAYOFWEEK(date) = ?', [$d['num']]))->where('status', 'present')->count();
            return [
                'day'     => $d['day'],
                'total'   => $total,
                'present' => $present,
                'rate'    => $total > 0 ? round(($present / $total) * 100) : 0,
            ];
        })->values()->all();

        // ── At-risk students (rate < 80%, ≥ 1 session) ───────────────────────
        $studentAtt = \App\Models\Attendance::selectRaw(
            'student_id, count(*) as total, SUM(status = "present") as present_count, SUM(status = "late") as late_count'
        )->groupBy('student_id')->get()->keyBy('student_id');

        $atRisk = \App\Models\Student::all()->map(function ($student) use ($studentAtt) {
            $summary = $studentAtt->get($student->id);
            if (!$summary || $summary->total < 1) return null;
            $total   = (int) $summary->total;
            $present = (int) $summary->present_count;
            $late    = (int) $summary->late_count;
            $rate    = round(($present / $total) * 100);
            return [
                'id'         => $student->id,
                'name'       => $student->name,
                'student_id' => $student->student_id,
                'total'      => $total,
                'present'    => $present,
                'late'       => $late,
                'absent'     => max(0, $total - $present - $late),
                'rate'       => $rate,
            ];
        })->filter(fn ($s) => $s !== null && $s['rate'] < 80)
          ->sortBy('rate')
          ->values()
          ->take(15)
          ->all();

        return Inertia::render('Admin/Reports', [
            'summary'      => compact('totalStudents', 'activeSubjects', 'totalSessions', 'overallRate', 'totalAtt', 'presentAll'),
            'trend'        => $trend,
            'subjectStats' => $subjectStats,
            'methods'      => $methods,
            'dayStats'     => $dayStats,
            'atRisk'       => $atRisk,
        ]);
    })->name('reports');

    // Students Routes
    Route::get('/students', [StudentController::class, 'index'])->name('students.index');
    Route::get('/students/create', [StudentController::class, 'create'])->name('students.create');
    Route::post('/students', [StudentController::class, 'store'])->name('students.store');
    Route::get('/students/{student}', [StudentController::class, 'show'])->name('students.show');
    Route::get('/students/{student}/edit', [StudentController::class, 'edit'])->name('students.edit');
    Route::put('/students/{student}', [StudentController::class, 'update'])->name('students.update');
    Route::delete('/students/{student}', [StudentController::class, 'destroy'])->name('students.destroy');
    Route::post('/students/bulk-action', [StudentController::class, 'bulkAction'])->name('students.bulk');
    Route::get('/students/import', [StudentController::class, 'import'])->name('students.import');
    Route::post('/students/import', [StudentController::class, 'importStore'])->name('students.import.store');
    Route::get('/students/export', [StudentController::class, 'export'])->name('students.export');

     // ── Lecturer Routes ────────────────────────────────────────────
    Route::prefix('lecturer')->name('lecturer.')->group(function () {
        Route::get('/timetable', function () {
            $user     = auth()->user();
            $subjects = $user->subjects()->with('schedules')->get()->values();

            $subjectIds = $subjects->pluck('id');

            $weeklySchedules = \App\Models\Schedule::with('subject:id,code,name')
                ->whereIn('subject_id', $subjectIds)
                ->get()
                ->map(function ($sc) use ($subjects) {
                    $idx = $subjects->search(fn ($s) => $s->id === $sc->subject_id);
                    return [
                        'id'            => $sc->id,
                        'subject_id'    => $sc->subject_id,
                        'subject_code'  => $sc->subject->code,
                        'subject_name'  => $sc->subject->name,
                        'subject_index' => $idx !== false ? $idx : 0,
                        'day_of_week'   => $sc->day_of_week,
                        'start_block'   => $sc->start_block,
                        'end_block'     => $sc->end_block,
                        'type'          => $sc->type,
                        'time_range'    => $sc->time_range,
                    ];
                });

            // Today's sessions for the lecturer
            $today = today()->toDateString();
            $todaySessions = \App\Models\Session::with('subject:id,code,name')
                ->whereIn('subject_id', $subjectIds)
                ->whereDate('date', $today)
                ->where('status', '!=', 'cancelled')
                ->orderBy('start_block')
                ->get()
                ->map(fn ($s) => [
                    'id'           => $s->id,
                    'subject_id'   => $s->subject_id,
                    'subject_code' => $s->subject->code,
                    'subject_name' => $s->subject->name,
                    'time'         => \App\Models\Session::BLOCKS[$s->start_block]['start'] . '–' . \App\Models\Session::BLOCKS[$s->end_block]['end'],
                    'start_block'  => $s->start_block,
                    'end_block'    => $s->end_block,
                    'room'         => $s->room,
                    'status'       => $s->status,
                ]);

            return Inertia::render('Lecturer/Timetable', [
                'weeklySchedules' => $weeklySchedules->values(),
                'todaySessions'   => $todaySessions->values(),
            ]);
        })->name('timetable');

        Route::get('/subjects', function () {
            $user     = auth()->user();
            $subjects = $user->subjects()
                ->with(['schedules', 'students'])
                ->withCount('students')
                ->orderBy('code')
                ->get()
                ->values()
                ->map(function ($s, $idx) {
                    $totalSessions  = $s->sessions()->count();
                    $presentCount   = \App\Models\Attendance::whereHas('session', fn ($q) => $q->where('subject_id', $s->id))
                        ->where('status', 'present')->count();
                    return [
                        'id'             => $s->id,
                        'code'           => $s->code,
                        'name'           => $s->name,
                        'description'    => $s->description,
                        'credit_hours'   => $s->credit_hours,
                        'status'         => $s->status,
                        'start_date'     => $s->start_date?->format('d M Y'),
                        'end_date'       => $s->end_date?->format('d M Y'),
                        'students_count' => $s->students_count,
                        'sessions_count' => $totalSessions,
                        'attendance_rate'=> $totalSessions > 0 ? round(($presentCount / $totalSessions) * 100) : 0,
                        'subject_index'  => $idx,
                        'schedules'      => $s->schedules->map(fn ($sc) => [
                            'id'          => $sc->id,
                            'day_of_week' => $sc->day_of_week,
                            'start_block' => $sc->start_block,
                            'end_block'   => $sc->end_block,
                            'type'        => $sc->type,
                            'time_range'  => $sc->time_range,
                        ]),
                    ];
                });

            return Inertia::render('Lecturer/Subjects', ['subjects' => $subjects]);
        })->name('subjects');

        Route::get('/dashboard', function () {
            $user       = auth()->user();
            $today      = today()->toDateString();
            $subjects   = $user->subjects()->with(['schedules', 'students'])->withCount('students')->get();
            $subjectIds = $subjects->pluck('id');

            // Stats
            $totalStudents  = $subjects->sum('students_count');
            $todaySessionCount = \App\Models\Session::whereIn('subject_id', $subjectIds)
                ->whereDate('date', $today)->where('status', '!=', 'cancelled')->count();

            $totalAttRecords = \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereIn('subject_id', $subjectIds))->count();
            $totalPresent    = \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereIn('subject_id', $subjectIds))
                ->where('status', 'present')->count();
            $overallRate     = $totalAttRecords > 0 ? round(($totalPresent / $totalAttRecords) * 100) : 0;

            // Today's sessions
            $todayClasses = \App\Models\Session::with('subject')
                ->whereIn('subject_id', $subjectIds)
                ->whereDate('date', $today)
                ->where('status', '!=', 'cancelled')
                ->orderBy('start_block')
                ->get()
                ->map(fn ($s) => [
                    'id'             => $s->id,
                    'subject_id'     => $s->subject_id,
                    'subject_code'   => $s->subject->code ?? '—',
                    'subject_name'   => $s->subject->name ?? '—',
                    'time'           => \App\Models\Session::BLOCKS[$s->start_block]['start'] . '–' . \App\Models\Session::BLOCKS[$s->end_block]['end'],
                    'start_block'    => $s->start_block,
                    'status'         => $s->status,
                    'room'           => $s->room,
                    'enrolled_count' => $s->subject?->students()->count() ?? 0,
                    'present_count'  => $s->attendances()->where('status', 'present')->count(),
                    'late_count'     => $s->attendances()->where('status', 'late')->count(),
                ]);

            // Recent attendance across lecturer's subjects (last 15)
            $recentAttendance = \App\Models\Attendance::with(['student', 'session.subject'])
                ->whereHas('session', fn ($q) => $q->whereIn('subject_id', $subjectIds))
                ->latest()
                ->limit(15)
                ->get()
                ->map(fn ($a) => [
                    'id'            => $a->id,
                    'student_name'  => $a->student->name ?? '—',
                    'student_id'    => $a->student->student_id ?? '—',
                    'subject_code'  => $a->session?->subject?->code ?? '—',
                    'checked_in_at' => $a->checked_in_at?->format('H:i') ?? '—',
                    'status'        => $a->status,
                    'method'        => $a->method,
                ]);

            // Weekly schedules for lecturer's subjects
            $subjectList = $subjects->values();
            $weeklySchedules = \App\Models\Schedule::with('subject:id,code')
                ->whereIn('subject_id', $subjectIds)
                ->get()
                ->map(function ($sc) use ($subjectList) {
                    $idx = $subjectList->search(fn ($s) => $s->id === $sc->subject_id);
                    return [
                        'subject_id'    => $sc->subject_id,
                        'subject_code'  => $sc->subject->code,
                        'subject_index' => $idx !== false ? $idx : 0,
                        'day_of_week'   => $sc->day_of_week,
                        'start_block'   => $sc->start_block,
                        'end_block'     => $sc->end_block,
                        'type'          => $sc->type,
                        'time_range'    => $sc->time_range,
                    ];
                });

            // Per-subject summary
            $subjectSummary = $subjectList->map(function ($s, $idx) {
                $totalRecords = \App\Models\Attendance::whereHas('session', fn ($q) => $q->where('subject_id', $s->id))->count();
                $present      = \App\Models\Attendance::whereHas('session', fn ($q) => $q->where('subject_id', $s->id))
                    ->where('status', 'present')->count();
                return [
                    'id'             => $s->id,
                    'code'           => $s->code,
                    'name'           => $s->name,
                    'students_count' => $s->students_count,
                    'sessions_count' => $s->sessions()->count(),
                    'rate'           => $totalRecords > 0 ? round(($present / $totalRecords) * 100) : 0,
                    'subject_index'  => $idx,
                ];
            });

            return Inertia::render('Lecturer/Dashboard', [
                'stats' => [
                    'mySubjects'     => $subjects->count(),
                    'totalStudents'  => $totalStudents,
                    'todaySessions'  => $todaySessionCount,
                    'attendanceRate' => $overallRate,
                ],
                'todayClasses'     => $todayClasses->values(),
                'recentAttendance' => $recentAttendance->values(),
                'weeklySchedules'  => $weeklySchedules->values(),
                'subjectSummary'   => $subjectSummary->values(),
            ]);
        })->name('dashboard');

        Route::get('/reports', function () {
            $user       = auth()->user();
            $subjects   = $user->subjects()->with('students')->withCount('students')->get();
            $subjectIds = $subjects->pluck('id');

            // Per-subject stats
            $subjectStats = $subjects->map(function ($s) {
                $totalRecords = \App\Models\Attendance::whereHas('session', fn ($q) => $q->where('subject_id', $s->id))->count();
                $present      = \App\Models\Attendance::whereHas('session', fn ($q) => $q->where('subject_id', $s->id))->where('status', 'present')->count();
                $late         = \App\Models\Attendance::whereHas('session', fn ($q) => $q->where('subject_id', $s->id))->where('status', 'late')->count();
                $absent       = \App\Models\Attendance::whereHas('session', fn ($q) => $q->where('subject_id', $s->id))->where('status', 'absent')->count();
                $sessions     = $s->sessions()->count();
                return [
                    'id'       => $s->id,
                    'code'     => $s->code,
                    'name'     => $s->name,
                    'enrolled' => $s->students_count,
                    'sessions' => $sessions,
                    'total'    => $totalRecords,
                    'present'  => $present,
                    'late'     => $late,
                    'absent'   => $absent,
                    'rate'     => $totalRecords > 0 ? round(($present + $late) / $totalRecords * 100) : 0,
                ];
            })->values();

            // 30-day trend across all lecturer subjects
            $trend = collect(range(29, 0))->map(function ($daysAgo) use ($subjectIds) {
                $date    = today()->subDays($daysAgo)->toDateString();
                $total   = \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereIn('subject_id', $subjectIds)->whereDate('date', $date))->count();
                $present = \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereIn('subject_id', $subjectIds)->whereDate('date', $date))->where('status', 'present')->count();
                return [
                    'label'   => today()->subDays($daysAgo)->format('d M'),
                    'total'   => $total,
                    'present' => $present,
                    'rate'    => $total > 0 ? round($present / $total * 100) : null,
                ];
            });

            // At-risk students (< 80%) across lecturer's subjects
            $atRisk = $subjects->flatMap(function ($s) {
                return $s->students->map(function ($stu) use ($s) {
                    $total   = \App\Models\Attendance::where('student_id', $stu->id)->whereHas('session', fn ($q) => $q->where('subject_id', $s->id))->count();
                    $present = \App\Models\Attendance::where('student_id', $stu->id)->whereHas('session', fn ($q) => $q->where('subject_id', $s->id))->whereIn('status', ['present', 'late'])->count();
                    $rate    = $total > 0 ? round($present / $total * 100) : 0;
                    if ($rate >= 80 || $total === 0) return null;
                    return [
                        'id'           => $stu->id,
                        'name'         => $stu->name,
                        'student_id'   => $stu->student_id,
                        'subject_code' => $s->code,
                        'total'        => $total,
                        'present'      => $present,
                        'absent'       => $total - $present,
                        'rate'         => $rate,
                    ];
                });
            })->filter()->sortBy('rate')->values()->take(20);

            // Summary
            $totalRecords = \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereIn('subject_id', $subjectIds))->count();
            $totalPresent = \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereIn('subject_id', $subjectIds))->where('status', 'present')->count();

            return Inertia::render('Lecturer/Reports', [
                'summary' => [
                    'subjects'     => $subjects->count(),
                    'students'     => $subjects->sum('students_count'),
                    'sessions'     => \App\Models\Session::whereIn('subject_id', $subjectIds)->count(),
                    'overallRate'  => $totalRecords > 0 ? round($totalPresent / $totalRecords * 100) : 0,
                ],
                'subjectStats' => $subjectStats,
                'trend'        => $trend,
                'atRisk'       => $atRisk,
            ]);
        })->name('reports');

        Route::get('/attendance/take', function () {
            $user       = auth()->user();
            $subjectIds = $user->subjects()->pluck('subjects.id');
            $today      = today()->toDateString();

            $sessions = \App\Models\Session::with('subject')
                ->whereIn('subject_id', $subjectIds)
                ->whereDate('date', $today)
                ->where('status', '!=', 'cancelled')
                ->orderBy('start_block')
                ->get()
                ->map(fn ($s) => [
                    'id'           => $s->id,
                    'subject_id'   => $s->subject_id,
                    'subject_code' => $s->subject->code ?? '—',
                    'subject_name' => $s->subject->name ?? '—',
                    'room'         => $s->room ?? '—',
                    'time'         => \App\Models\Session::BLOCKS[$s->start_block]['start'] . '–' . \App\Models\Session::BLOCKS[$s->end_block]['end'],
                    'start_block'  => $s->start_block,
                    'status'       => $s->status,
                    'enrolled'     => $s->subject?->students()->count() ?? 0,
                    'present'      => $s->attendances()->whereIn('status', ['present', 'late'])->count(),
                    'recorded'     => $s->attendances()->count() > 0,
                ]);

            return Inertia::render('Lecturer/TakeAttendance', [
                'sessions' => $sessions,
                'date'     => today()->format('l, d F Y'),
            ]);
        })->name('attendance.take');

        Route::get('/attendance/records', function (Request $request) {
            $user       = auth()->user();
            $subjects   = $user->subjects()->get();
            $subjectIds = $subjects->pluck('id');

            $query = \App\Models\Attendance::with(['student', 'session.subject'])
                ->whereHas('session', fn ($q) => $q->whereIn('subject_id', $subjectIds))
                ->whereHas('student');

            if ($request->filled('subject')) {
                $query->whereHas('session', fn ($q) => $q->where('subject_id', $request->subject));
            }
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
            if ($request->filled('method')) {
                $query->where('method', $request->method);
            }
            if ($request->filled('date_from')) {
                $query->whereHas('session', fn ($q) => $q->whereDate('date', '>=', $request->date_from));
            }
            if ($request->filled('date_to')) {
                $query->whereHas('session', fn ($q) => $q->whereDate('date', '<=', $request->date_to));
            }
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->whereHas('student', fn ($sq) => $sq->where('name', 'like', "%$search%")->orWhere('student_id', 'like', "%$search%"))
                      ->orWhereHas('session.subject', fn ($sq) => $sq->where('code', 'like', "%$search%"));
                });
            }

            $records = $query->orderByDesc('checked_in_at')->orderByDesc('created_at')
                ->paginate(25)
                ->withQueryString()
                ->through(fn ($a) => [
                    'id'           => $a->id,
                    'student_name' => $a->student->name,
                    'student_id'   => $a->student->student_id,
                    'subject_code' => $a->session?->subject?->code ?? '—',
                    'subject_name' => $a->session?->subject?->name ?? '—',
                    'date'         => $a->session?->date?->format('d M Y') ?? '—',
                    'time'         => $a->checked_in_at?->format('H:i') ?? '—',
                    'status'       => $a->status,
                    'method'       => $a->method ?? 'manual',
                ]);

            $totalRecords = \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereIn('subject_id', $subjectIds))->count();
            $stats = [
                'total'   => $totalRecords,
                'present' => \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereIn('subject_id', $subjectIds))->where('status', 'present')->count(),
                'late'    => \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereIn('subject_id', $subjectIds))->where('status', 'late')->count(),
                'absent'  => \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereIn('subject_id', $subjectIds))->where('status', 'absent')->count(),
            ];

            return Inertia::render('Lecturer/AttendanceRecords', [
                'records'  => $records,
                'subjects' => $subjects->map(fn ($s) => ['id' => $s->id, 'code' => $s->code, 'name' => $s->name])->values(),
                'filters'  => $request->only(['search', 'subject', 'status', 'method', 'date_from', 'date_to']),
                'stats'    => $stats,
            ]);
        })->name('attendance.records');

        Route::get('/sessions', function (Request $request) {
            $user       = auth()->user();
            $subjects   = $user->subjects()->get();
            $subjectIds = $subjects->pluck('id');

            $query = \App\Models\Session::with('subject')
                ->whereIn('subject_id', $subjectIds);

            if ($request->filled('subject')) {
                $query->where('subject_id', $request->subject);
            }
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
            if ($request->filled('date_from')) {
                $query->whereDate('date', '>=', $request->date_from);
            }
            if ($request->filled('date_to')) {
                $query->whereDate('date', '<=', $request->date_to);
            }

            $sessions = $query->orderByDesc('date')->orderBy('start_block')
                ->paginate(25)
                ->withQueryString()
                ->through(fn ($s) => [
                    'id'           => $s->id,
                    'subject_id'   => $s->subject_id,
                    'subject_code' => $s->subject?->code ?? '—',
                    'subject_name' => $s->subject?->name ?? '—',
                    'date'         => $s->date?->format('d M Y') ?? '—',
                    'date_raw'     => $s->date?->toDateString(),
                    'time'         => \App\Models\Session::BLOCKS[$s->start_block]['start'] . '–' . \App\Models\Session::BLOCKS[$s->end_block]['end'],
                    'room'         => $s->room ?? '—',
                    'status'       => $s->status,
                    'enrolled'     => $s->subject?->students()->count() ?? 0,
                    'present'      => $s->attendances()->whereIn('status', ['present', 'late'])->count(),
                    'recorded'     => $s->attendances()->count() > 0,
                    'is_holiday'   => $s->is_holiday,
                ]);

            $allSessions = \App\Models\Session::whereIn('subject_id', $subjectIds);
            $stats = [
                'total'     => (clone $allSessions)->count(),
                'today'     => (clone $allSessions)->whereDate('date', today())->count(),
                'upcoming'  => (clone $allSessions)->where('status', 'scheduled')->whereDate('date', '>=', today())->count(),
                'completed' => (clone $allSessions)->where('status', 'completed')->count(),
            ];

            return Inertia::render('Lecturer/Sessions', [
                'sessions' => $sessions,
                'subjects' => $subjects->map(fn ($s) => ['id' => $s->id, 'code' => $s->code, 'name' => $s->name])->values(),
                'filters'  => $request->only(['subject', 'status', 'date_from', 'date_to']),
                'stats'    => $stats,
            ]);
        })->name('sessions');

        Route::get('/students', function (Request $request) {
            $user       = auth()->user();
            $subjects   = $user->subjects()->get();
            $subjectIds = $subjects->pluck('id');

            // Get all students enrolled in lecturer's subjects
            $query = \App\Models\Student::with('subjects')
                ->whereHas('subjects', fn ($q) => $q->whereIn('subjects.id', $subjectIds));

            if ($request->filled('subject')) {
                $query->whereHas('subjects', fn ($q) => $q->where('subjects.id', $request->subject));
            }
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(fn ($q) => $q->where('name', 'like', "%$search%")->orWhere('student_id', 'like', "%$search%"));
            }
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            $students = $query->orderBy('name')->paginate(25)->withQueryString()->through(function ($s) use ($subjectIds) {
                $totalAtt   = $s->attendances()->whereHas('session', fn ($q) => $q->whereIn('subject_id', $subjectIds))->count();
                $presentAtt = $s->attendances()->whereHas('session', fn ($q) => $q->whereIn('subject_id', $subjectIds))->whereIn('status', ['present', 'late'])->count();
                return [
                    'id'              => $s->id,
                    'name'            => $s->name,
                    'student_id'      => $s->student_id,
                    'email'           => $s->email,
                    'status'          => $s->status,
                    'face_status'     => $s->face_status,
                    'attendance_rate' => $totalAtt > 0 ? round(($presentAtt / $totalAtt) * 100) : null,
                    'total_att'       => $totalAtt,
                    'present_att'     => $presentAtt,
                    'enrolled_subjects' => $s->subjects->whereIn('id', $subjectIds->toArray())->map(fn ($sub) => [
                        'id'   => $sub->id,
                        'code' => $sub->code,
                        'name' => $sub->name,
                    ])->values(),
                ];
            });

            $totalStudents = \App\Models\Student::whereHas('subjects', fn ($q) => $q->whereIn('subjects.id', $subjectIds))->count();
            $stats = [
                'total'    => $totalStudents,
                'active'   => \App\Models\Student::whereHas('subjects', fn ($q) => $q->whereIn('subjects.id', $subjectIds))->where('status', 'active')->count(),
                'face_reg' => \App\Models\Student::whereHas('subjects', fn ($q) => $q->whereIn('subjects.id', $subjectIds))->where('face_status', 'approved')->count(),
            ];

            return Inertia::render('Lecturer/Students', [
                'students' => $students,
                'subjects' => $subjects->map(fn ($s) => ['id' => $s->id, 'code' => $s->code, 'name' => $s->name])->values(),
                'filters'  => $request->only(['search', 'subject', 'status']),
                'stats'    => $stats,
            ]);
        })->name('students');
    });

    // ── Student Routes ──────────────────────────────────────────────
    Route::prefix('student')->name('student.')->group(function () {
        Route::get('/dashboard', function () {
            $user    = auth()->user();
            $student = \App\Models\Student::where('email', $user->email)->first();
            $today   = today()->toDateString();

            if (!$student) {
                return Inertia::render('Students/Dashboard', [
                    'student'          => null,
                    'stats'            => ['enrolledSubjects' => 0, 'attendanceRate' => 0, 'presentToday' => 0, 'todaySessions' => 0],
                    'enrolledSubjects' => [],
                    'todaySessions'    => [],
                    'recentAttendance' => [],
                    'weeklySchedules'  => [],
                    'faceStatus'       => $user->face_status ?? 'none',
                ]);
            }

            $enrolledSubjects = $student->subjects()->with(['schedules', 'lecturers:id,name'])->get();
            $enrolledIds      = $enrolledSubjects->pluck('id')->toArray();

            // Per-subject attendance stats
            $subjectStats = $enrolledSubjects->values()->map(function ($subject, $idx) use ($student) {
                $total    = $subject->sessions()->count();
                $attended = \App\Models\Attendance::where('student_id', $student->id)
                    ->whereHas('session', fn ($q) => $q->where('subject_id', $subject->id))
                    ->where('status', 'present')->count();
                return [
                    'id'                => $subject->id,
                    'code'              => $subject->code,
                    'name'              => $subject->name,
                    'lecturer'          => $subject->lecturers->first()?->name ?? 'TBA',
                    'sessions_total'    => $total,
                    'sessions_attended' => $attended,
                    'rate'              => $total > 0 ? round(($attended / $total) * 100) : 0,
                    'subject_index'     => $idx,
                ];
            });

            // Overall stats
            $totalSessions = $subjectStats->sum('sessions_total');
            $totalAttended = $subjectStats->sum('sessions_attended');
            $overallRate   = $totalSessions > 0 ? round(($totalAttended / $totalSessions) * 100) : 0;

            // Today's sessions
            $todaySessions = \App\Models\Session::with('subject')
                ->whereIn('subject_id', $enrolledIds)
                ->whereDate('date', $today)
                ->where('status', '!=', 'cancelled')
                ->orderBy('start_block')
                ->get()
                ->map(fn ($s) => [
                    'id'           => $s->id,
                    'subject_id'   => $s->subject_id,
                    'subject_code' => $s->subject->code,
                    'subject_name' => $s->subject->name,
                    'time'         => \App\Models\Session::BLOCKS[$s->start_block]['start'] . '–' . \App\Models\Session::BLOCKS[$s->end_block]['end'],
                    'start_block'  => $s->start_block,
                    'end_block'    => $s->end_block,
                    'status'       => $s->status,
                    'room'         => $s->room,
                    'my_status'    => \App\Models\Attendance::where('student_id', $student->id)->where('session_id', $s->id)->value('status'),
                ]);

            $presentToday = $todaySessions->whereNotNull('my_status')->where('my_status', 'present')->count();

            // Recent attendance (last 10)
            $recentAttendance = \App\Models\Attendance::with(['session.subject'])
                ->where('student_id', $student->id)
                ->latest()
                ->limit(10)
                ->get()
                ->map(fn ($a) => [
                    'id'           => $a->id,
                    'subject_code' => $a->session?->subject?->code ?? '—',
                    'subject_name' => $a->session?->subject?->name ?? '—',
                    'date'         => $a->session?->date?->format('d M Y') ?? '—',
                    'day'          => $a->session?->date?->format('D') ?? '',
                    'checked_in_at'=> $a->checked_in_at?->format('H:i') ?? '—',
                    'status'       => $a->status,
                    'method'       => $a->method,
                ]);

            // Weekly schedules (enrolled subjects only)
            $weeklySchedules = \App\Models\Schedule::with('subject:id,code')
                ->whereIn('subject_id', $enrolledIds)
                ->get()
                ->map(function ($sc) use ($enrolledSubjects) {
                    $idx = $enrolledSubjects->values()->search(fn ($s) => $s->id === $sc->subject_id);
                    return [
                        'subject_id'    => $sc->subject_id,
                        'subject_code'  => $sc->subject->code,
                        'subject_index' => $idx !== false ? $idx : 0,
                        'day_of_week'   => $sc->day_of_week,
                        'start_block'   => $sc->start_block,
                        'end_block'     => $sc->end_block,
                        'type'          => $sc->type,
                        'time_range'    => $sc->time_range,
                    ];
                });

            return Inertia::render('Students/Dashboard', [
                'student' => [
                    'id'            => $student->id,
                    'name'          => $student->name,
                    'student_id'    => $student->student_id,
                    'face_status'   => $student->face_status,
                    'face_image_url'=> $student->face_image_url,
                ],
                'stats' => [
                    'enrolledSubjects' => $enrolledSubjects->count(),
                    'attendanceRate'   => $overallRate,
                    'presentToday'     => $presentToday,
                    'todaySessions'    => $todaySessions->count(),
                ],
                'enrolledSubjects' => $subjectStats->values(),
                'todaySessions'    => $todaySessions->values(),
                'recentAttendance' => $recentAttendance->values(),
                'weeklySchedules'  => $weeklySchedules->values(),
                'faceStatus'       => $user->face_status ?? 'none',
            ]);
        })->name('dashboard');
        
        Route::get('/courses', function () {
            $user    = auth()->user();
            $student = \App\Models\Student::where('email', $user->email)->first();

            $enrolledIds = $student
                ? $student->subjects()->pluck('subjects.id')->toArray()
                : [];

            $subjects = \App\Models\Subject::with(['lecturers:id,name', 'schedules'])
                ->withCount('students')
                ->where(function ($q) use ($enrolledIds) {
                    $q->where('status', 'active')->orWhereIn('id', $enrolledIds);
                })
                ->orderBy('code')
                ->get()
                ->map(fn($s) => [
                    'id'             => $s->id,
                    'code'           => $s->code,
                    'name'           => $s->name,
                    'description'    => $s->description,
                    'credit_hours'   => $s->credit_hours,
                    'status'         => $s->status,
                    'start_date'     => $s->start_date?->format('d M Y'),
                    'end_date'       => $s->end_date?->format('d M Y'),
                    'lecturer'       => $s->lecturers->first()?->name ?? 'TBA',
                    'schedule'       => $s->schedules->map(
                        fn($sc) => ucfirst($sc->day_of_week) . ' ' . $sc->time_range
                    )->join(', '),
                    'students_count' => $s->students_count,
                    'is_enrolled'    => in_array($s->id, $enrolledIds),
                ]);

            return Inertia::render('Students/Courses', [
                'subjects'  => $subjects,
                'studentId' => $student?->id,
            ]);
        })->name('courses');
        
        // My Classes (enrolled subjects with stats)
        Route::get('/classes', function () {
            $user    = auth()->user();
            $student = \App\Models\Student::where('email', $user->email)->first();

            if (!$student) {
                return Inertia::render('Students/Classes', [
                    'subjects'   => [],
                    'faceStatus' => $user->face_status ?? 'none',
                ]);
            }

            $subjects = $student->subjects()
                ->with(['lecturers:id,name', 'schedules', 'sessions'])
                ->get()
                ->values()
                ->map(function ($s, $idx) use ($student) {
                    $totalSessions  = $s->sessions->count();
                    $attended = \App\Models\Attendance::where('student_id', $student->id)
                        ->whereHas('session', fn ($q) => $q->where('subject_id', $s->id))
                        ->where('status', 'present')->count();
                    $late = \App\Models\Attendance::where('student_id', $student->id)
                        ->whereHas('session', fn ($q) => $q->where('subject_id', $s->id))
                        ->where('status', 'late')->count();

                    // Next upcoming session
                    $nextSession = $s->sessions()
                        ->whereDate('date', '>=', today())
                        ->where('status', '!=', 'cancelled')
                        ->orderBy('date')->orderBy('start_block')
                        ->first();

                    return [
                        'id'              => $s->id,
                        'code'            => $s->code,
                        'name'            => $s->name,
                        'description'     => $s->description,
                        'credit_hours'    => $s->credit_hours,
                        'status'          => $s->status,
                        'start_date'      => $s->start_date?->format('d M Y'),
                        'end_date'        => $s->end_date?->format('d M Y'),
                        'lecturer'        => $s->lecturers->first()?->name ?? 'TBA',
                        'sessions_total'  => $totalSessions,
                        'sessions_attended' => $attended,
                        'sessions_late'   => $late,
                        'rate'            => $totalSessions > 0 ? round(($attended / $totalSessions) * 100) : 0,
                        'subject_index'   => $idx,
                        'schedules'       => $s->schedules->map(fn ($sc) => [
                            'id'          => $sc->id,
                            'day_of_week' => $sc->day_of_week,
                            'start_block' => $sc->start_block,
                            'end_block'   => $sc->end_block,
                            'type'        => $sc->type,
                            'time_range'  => $sc->time_range,
                        ]),
                        'next_session'    => $nextSession ? [
                            'id'    => $nextSession->id,
                            'date'  => $nextSession->date->format('d M Y'),
                            'day'   => $nextSession->date->format('D'),
                            'time'  => \App\Models\Session::BLOCKS[$nextSession->start_block]['start'] . '–' . \App\Models\Session::BLOCKS[$nextSession->end_block]['end'],
                            'room'  => $nextSession->room,
                            'status'=> $nextSession->status,
                        ] : null,
                    ];
                });

            $enrolledIds = $student->subjects()->pluck('subjects.id');
            $subjectList = $student->subjects()->get()->values();
            $weeklySchedules = \App\Models\Schedule::with('subject:id,code')
                ->whereIn('subject_id', $enrolledIds)
                ->get()
                ->map(function ($sc) use ($subjectList) {
                    $idx = $subjectList->search(fn ($s) => $s->id === $sc->subject_id);
                    return [
                        'subject_id'    => $sc->subject_id,
                        'subject_code'  => $sc->subject->code,
                        'subject_index' => $idx !== false ? $idx : 0,
                        'day_of_week'   => $sc->day_of_week,
                        'start_block'   => $sc->start_block,
                        'end_block'     => $sc->end_block,
                        'type'          => $sc->type,
                        'time_range'    => $sc->time_range,
                    ];
                });

            return Inertia::render('Students/Classes', [
                'subjects'        => $subjects,
                'weeklySchedules' => $weeklySchedules->values(),
                'faceStatus'      => $user->face_status ?? 'none',
            ]);
        })->name('classes');

        // My Attendance
        Route::get('/attendance', function () {
            $user    = auth()->user();
            $student = \App\Models\Student::where('email', $user->email)->first();

            if (!$student) {
                return Inertia::render('Students/MyAttendance', [
                    'records'      => [],
                    'monthlyStats' => [],
                    'courseStats'  => [],
                    'overallStats' => ['total' => 0, 'present' => 0, 'absent' => 0, 'late' => 0, 'excused' => 0, 'rate' => 0, 'streak' => 0],
                ]);
            }

            // All attendance records for this student
            $attendances = \App\Models\Attendance::where('student_id', $student->id)
                ->with(['session.subject.lecturers:id,name', 'session'])
                ->whereHas('session')
                ->orderByDesc(
                    \App\Models\Session::select('date')
                        ->whereColumn('class_sessions.id', 'attendances.session_id')
                        ->limit(1)
                )
                ->get();

            $records = $attendances->map(fn ($a) => [
                'id'            => $a->id,
                'date'          => $a->session->date->format('Y-m-d'),
                'day'           => $a->session->date->format('D'),
                'time'          => $a->checked_in_at?->format('h:i A') ?? '—',
                'status'        => $a->status,
                'course'        => $a->session->subject->name ?? '—',
                'courseCode'    => $a->session->subject->code ?? '—',
                'checkInMethod' => $a->method ?? '—',
                'lecturer'      => $a->session->subject->lecturers->first()?->name ?? 'TBA',
            ]);

            // Monthly stats (last 3 months)
            $monthlyStats = $records
                ->groupBy(fn ($r) => \Carbon\Carbon::parse($r['date'])->format('M Y'))
                ->take(3)
                ->map(fn ($recs, $month) => [
                    'month'   => $month,
                    'present' => $recs->where('status', 'present')->count(),
                    'absent'  => $recs->where('status', 'absent')->count(),
                    'late'    => $recs->where('status', 'late')->count(),
                    'excused' => $recs->where('status', 'excused')->count(),
                    'total'   => $recs->count(),
                    'rate'    => round($recs->whereIn('status', ['present', 'late'])->count() / max($recs->count(), 1) * 100, 1),
                ])->values();

            // Course stats
            $courseStats = $records
                ->groupBy('courseCode')
                ->map(fn ($recs, $code) => [
                    'course'  => $recs->first()['course'],
                    'code'    => $code,
                    'present' => $recs->where('status', 'present')->count(),
                    'total'   => $recs->count(),
                    'rate'    => round($recs->where('status', 'present')->count() / max($recs->count(), 1) * 100, 1),
                    'trend'   => 'stable',
                ])->values();

            // Overall stats
            $total   = $records->count();
            $present = $records->where('status', 'present')->count();
            $late    = $records->where('status', 'late')->count();
            $absent  = $records->where('status', 'absent')->count();
            $excused = $records->where('status', 'excused')->count();

            // Current streak (consecutive present/late days)
            $streak = 0;
            foreach ($records as $r) {
                if (in_array($r['status'], ['present', 'late'])) $streak++;
                else break;
            }

            return Inertia::render('Students/MyAttendance', [
                'records'      => $records->values(),
                'monthlyStats' => $monthlyStats,
                'courseStats'  => $courseStats,
                'overallStats' => [
                    'total'   => $total,
                    'present' => $present,
                    'absent'  => $absent,
                    'late'    => $late,
                    'excused' => $excused,
                    'rate'    => $total > 0 ? round(($present + $late) / $total * 100, 1) : 0,
                    'streak'  => $streak,
                ],
            ]);
        })->name('attendance');
        
        Route::get('/attendance/today', function () {
            $user    = auth()->user();
            $student = \App\Models\Student::where('email', $user->email)->first();
            $today   = today()->toDateString();

            if (!$student) {
                return Inertia::render('Students/TodayStatus', [
                    'student'  => null,
                    'sessions' => [],
                    'summary'  => ['total' => 0, 'present' => 0, 'absent' => 0, 'late' => 0],
                    'date'     => today()->format('l, d F Y'),
                ]);
            }

            $subjectIds = $student->subjects()->pluck('subjects.id');

            $todaySessions = \App\Models\Session::with('subject')
                ->whereIn('subject_id', $subjectIds)
                ->whereDate('date', $today)
                ->where('status', '!=', 'cancelled')
                ->orderBy('start_block')
                ->get()
                ->map(function ($s) use ($student) {
                    $att = $s->attendances()->where('student_id', $student->id)->first();
                    return [
                        'id'           => $s->id,
                        'subject_id'   => $s->subject_id,
                        'subject_code' => $s->subject?->code ?? '—',
                        'subject_name' => $s->subject?->name ?? '—',
                        'time'         => \App\Models\Session::BLOCKS[$s->start_block]['start'] . '–' . \App\Models\Session::BLOCKS[$s->end_block]['end'],
                        'start_block'  => $s->start_block,
                        'end_block'    => $s->end_block,
                        'room'         => $s->room ?? '—',
                        'status'       => $s->status,
                        'my_status'    => $att?->status ?? null,
                        'checked_in_at' => $att?->checked_in_at?->format('H:i') ?? null,
                        'method'       => $att?->method ?? null,
                    ];
                });

            $summary = [
                'total'   => $todaySessions->count(),
                'present' => $todaySessions->where('my_status', 'present')->count(),
                'late'    => $todaySessions->where('my_status', 'late')->count(),
                'absent'  => $todaySessions->whereIn('my_status', [null, 'absent'])->where('status', 'completed')->count(),
            ];

            return Inertia::render('Students/TodayStatus', [
                'student'  => ['name' => $student->name, 'student_id' => $student->student_id],
                'sessions' => $todaySessions->values(),
                'summary'  => $summary,
                'date'     => today()->format('l, d F Y'),
            ]);
        })->name('attendance.today');
    });


    // Media Library Routes
    Route::get('/media', [MediaController::class, 'index'])->name('media.index');
    Route::post('/media', [MediaController::class, 'store'])->name('media.store');
    Route::delete('/media/{medium}', [MediaController::class, 'destroy'])->name('media.destroy');
    Route::post('/media/bulk-destroy', [MediaController::class, 'bulkDestroy'])->name('media.bulk-destroy');
    Route::get('/media/{medium}/download', [MediaController::class, 'download'])->name('media.download');
    
    // Legacy hidden upload test (now points to media system)
    Route::get('/uploadtest', function () {
        return Inertia::render('Media/Index', [
            'media' => \App\Models\Media::latest()->paginate(20),
            'collections' => \App\Models\Media::select('collection')->distinct()->pluck('collection'),
            'currentCollection' => 'default',
        ]);
    })->name('upload.test');

    // Profile face upload (3-photo: frontal + left + right)
    Route::post('/profile/upload-face', function (Request $request) {
        try {
            $request->validate([
                'face_frontal' => 'required|image|max:5120',
                'face_left'    => 'required|image|max:5120',
                'face_right'   => 'required|image|max:5120',
            ]);

            $user = auth()->user();

            // Delete old face images if they exist
            foreach (['face_image_path', 'face_left_path', 'face_right_path'] as $col) {
                if ($user->$col && Storage::disk('public')->exists($user->$col)) {
                    Storage::disk('public')->delete($user->$col);
                }
            }

            $frontalPath = $request->file('face_frontal')->store('student-faces', 'public');
            $leftPath    = $request->file('face_left')->store('student-faces', 'public');
            $rightPath   = $request->file('face_right')->store('student-faces', 'public');
            $frontalUrl  = asset('storage/' . $frontalPath);

            $user->update([
                'face_image_path' => $frontalPath,
                'face_image_url'  => $frontalUrl,
                'face_left_path'  => $leftPath,
                'face_right_path' => $rightPath,
                'face_status'     => 'pending',
            ]);

            $student = \App\Models\Student::where('email', $user->email)->first();
            if ($student) {
                $student->update([
                    'face_image_path' => $frontalPath,
                    'face_image_url'  => $frontalUrl,
                    'face_status'     => 'pending',
                    'face_registered' => false,
                ]);
            }

            return response()->json([
                'success' => true,
                'url'     => $frontalUrl,
                'message' => 'Face photos uploaded successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    })->name('profile.upload-face');

    Route::get('/camera', function () {
        $today = today()->toDateString();

        $recentCheckins = \App\Models\Attendance::with(['student', 'session.subject'])
            ->whereHas('session', fn ($q) => $q->whereDate('date', $today))
            ->whereNotNull('checked_in_at')
            ->orderByDesc('checked_in_at')
            ->limit(15)
            ->get()
            ->map(fn ($a) => [
                'id'           => $a->id,
                'student_name' => $a->student->name ?? '—',
                'student_id'   => $a->student->student_id ?? '—',
                'subject_code' => $a->session?->subject?->code ?? '—',
                'time'         => $a->checked_in_at->format('H:i:s'),
                'status'       => $a->status,
                'method'       => $a->method ?? 'manual',
            ])->values();

        $todayStats = [
            'total'   => \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereDate('date', $today))->count(),
            'present' => \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereDate('date', $today))->where('status', 'present')->count(),
            'late'    => \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereDate('date', $today))->where('status', 'late')->count(),
            'faceId'  => \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereDate('date', $today))->where('method', 'face_id')->count(),
        ];

        $now          = now();
        $currentBlock = null;
        foreach (\App\Models\Session::BLOCKS as $i => $b) {
            [$sh, $sm] = explode(':', $b['start']);
            [$eh, $em] = explode(':', $b['end']);
            $start = $now->copy()->setTime((int)$sh, (int)$sm);
            $end   = $now->copy()->setTime((int)$eh, (int)$em);
            if ($now->between($start, $end)) { $currentBlock = $i; break; }
        }

        $activeSession = $currentBlock !== null
            ? \App\Models\Session::with('subject')
                ->whereDate('date', $today)
                ->where('start_block', '<=', $currentBlock)
                ->where('end_block',   '>=', $currentBlock)
                ->where('status', '!=', 'cancelled')
                ->first()
            : null;

        return Inertia::render('System/LiveCamera', [
            'recentCheckins' => $recentCheckins,
            'todayStats'     => $todayStats,
            'activeSession'  => $activeSession ? [
                'subject_code' => $activeSession->subject->code ?? '—',
                'subject_name' => $activeSession->subject->name ?? '—',
                'room'         => $activeSession->room ?? '—',
                'time'         => \App\Models\Session::BLOCKS[$activeSession->start_block]['start'] . '–' . \App\Models\Session::BLOCKS[$activeSession->end_block]['end'],
            ] : null,
        ]);
    })->name('camera');

    // ── Raspberry Pi Monitor ──────────────────────────────────────────
    Route::prefix('system/pi-status')->name('system.pi.')->group(function () {

        Route::get('/', function () {
            $today = today()->toDateString();

            $sessions = \App\Models\Session::with('subject')
                ->whereDate('date', $today)
                ->where('status', '!=', 'cancelled')
                ->orderBy('start_block')
                ->get()
                ->map(fn ($s) => [
                    'id'             => $s->id,
                    'subject_id'     => $s->subject_id,
                    'subject_code'   => $s->subject->code ?? '—',
                    'subject_name'   => $s->subject->name ?? '—',
                    'time'           => \App\Models\Session::BLOCKS[$s->start_block]['start'] . '–' . \App\Models\Session::BLOCKS[$s->end_block]['end'],
                    'start_block'    => $s->start_block,
                    'end_block'      => $s->end_block,
                    'room'           => $s->room ?? '—',
                    'status'         => $s->status,
                    'face_ready'     => $s->subject?->students()->where('face_status', 'approved')->count() ?? 0,
                    'total_enrolled' => $s->subject?->students()->count() ?? 0,
                    'present'        => $s->attendances()->whereIn('status', ['present', 'late'])->count(),
                ]);

            return Inertia::render('System/PiStatus', [
                'todaySessions' => $sessions,
                'piUrl'         => config('pi.url'),
                'date'          => today()->format('l, d F Y'),
            ]);
        })->name('index');

        // Proxy Pi /status — keeps token server-side
        Route::get('/api', function () {
            try {
                $res = \Illuminate\Support\Facades\Http::withHeaders(['X-Pi-Token' => config('pi.token')])
                    ->timeout(5)
                    ->get(config('pi.url') . '/status');
                return response()->json($res->json());
            } catch (\Exception $e) {
                return response()->json([
                    'online' => false, 'camera_running' => false,
                    'faces_loaded' => 0, 'marked_students' => 0,
                    'session_id' => null, 'subject' => null,
                ]);
            }
        })->name('api');

        // Manually push a session to the Pi
        Route::post('/prepare/{session}', function (\App\Models\Session $session) {
            $session->load('subject');

            $students = $session->subject->students()
                ->where('face_status', 'approved')
                ->whereNotNull('face_image_url')
                ->select('students.id', 'students.name', 'students.student_id', 'students.face_image_url')
                ->get()
                ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'face_url' => $s->face_image_url]);

            if ($students->isEmpty()) {
                return back()->with('error', 'No students with approved faces for this session.');
            }

            try {
                $res = \Illuminate\Support\Facades\Http::withHeaders([
                    'X-Pi-Token' => config('pi.token'),
                    'Accept'     => 'application/json',
                ])->timeout(10)->post(config('pi.url') . '/prepare', [
                    'session_id'   => $session->id,
                    'subject'      => $session->subject->code,
                    'subject_name' => $session->subject->name,
                    'start_time'   => \App\Models\Session::BLOCKS[$session->start_block]['start'],
                    'end_time'     => \App\Models\Session::BLOCKS[$session->end_block]['end'],
                    'students'     => $students,
                ]);

                if ($res->successful()) {
                    return back()->with('success', "Session pushed to Pi — {$students->count()} face(s) loaded.");
                }
                return back()->with('error', "Pi responded with status {$res->status()}.");
            } catch (\Exception $e) {
                return back()->with('error', "Could not reach Pi: {$e->getMessage()}");
            }
        })->name('prepare');

        // Stop the Pi camera
        Route::post('/stop', function () {
            try {
                $res = \Illuminate\Support\Facades\Http::withHeaders(['X-Pi-Token' => config('pi.token')])
                    ->timeout(10)->post(config('pi.url') . '/stop');
                return $res->successful()
                    ? back()->with('success', 'Camera stopped.')
                    : back()->with('error', "Pi responded with {$res->status()}.");
            } catch (\Exception $e) {
                return back()->with('error', "Could not reach Pi: {$e->getMessage()}");
            }
        })->name('stop');
    });

    Route::prefix('system/face-approvals')->group(function () {
        Route::get('/',                [FaceApprovalController::class, 'index'])->name('face-approvals.index');
        Route::post('/{user}/approve', [FaceApprovalController::class, 'approve'])->name('face-approvals.approve');
        Route::post('/{user}/reject',  [FaceApprovalController::class, 'reject'])->name('face-approvals.reject');
    });
    
    // API endpoint for handling uploads
    Route::post('/api/upload-test', function (Request $request) {
        $request->validate([
            'image' => 'required|image|max:10240',
        ]);
        
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('test-uploads', 'public');
            
            return response()->json([
                'success' => true,
                'path' => $path,
                'url' => asset('storage/' . $path),
            ]);
        }
        
        return response()->json(['success' => false], 400);
    })->name('upload.test.store');

    // Admin: Attendance Records
    Route::get('/attendance', function (Request $request) {
        $query = \App\Models\Attendance::with(['student', 'session.subject'])
            ->whereHas('session')
            ->whereHas('student');

        if ($request->filled('subject')) {
            $query->whereHas('session', fn ($q) => $q->where('subject_id', $request->subject));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('method')) {
            $query->where('method', $request->method);
        }
        if ($request->filled('date_from')) {
            $query->whereHas('session', fn ($q) => $q->whereDate('date', '>=', $request->date_from));
        }
        if ($request->filled('date_to')) {
            $query->whereHas('session', fn ($q) => $q->whereDate('date', '<=', $request->date_to));
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('student', fn ($sq) => $sq->where('name', 'like', "%$search%")->orWhere('student_id', 'like', "%$search%"))
                  ->orWhereHas('session.subject', fn ($sq) => $sq->where('code', 'like', "%$search%")->orWhere('name', 'like', "%$search%"));
            });
        }

        $records = $query->orderByDesc('checked_in_at')->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString()
            ->through(fn ($a) => [
                'id'           => $a->id,
                'student_name' => $a->student->name,
                'student_id'   => $a->student->student_id,
                'subject_code' => $a->session?->subject?->code ?? '—',
                'subject_name' => $a->session?->subject?->name ?? '—',
                'date'         => $a->session?->date?->format('d M Y') ?? '—',
                'time'         => $a->checked_in_at?->format('H:i') ?? '—',
                'status'       => $a->status,
                'method'       => $a->method ?? 'manual',
            ]);

        $subjects = \App\Models\Subject::orderBy('code')->get(['id', 'code', 'name']);

        $stats = [
            'total'   => \App\Models\Attendance::count(),
            'present' => \App\Models\Attendance::where('status', 'present')->count(),
            'late'    => \App\Models\Attendance::where('status', 'late')->count(),
            'absent'  => \App\Models\Attendance::where('status', 'absent')->count(),
        ];

        return Inertia::render('Admin/AttendanceRecords', [
            'records'  => $records,
            'subjects' => $subjects,
            'filters'  => $request->only(['search', 'subject', 'status', 'method', 'date_from', 'date_to']),
            'stats'    => $stats,
        ]);
    })->name('attendance.records');

    // Admin: Today's Activity
    Route::get('/attendance/today', function () {
        $today = today()->toDateString();

        $sessions = \App\Models\Session::with('subject')
            ->whereDate('date', $today)
            ->where('status', '!=', 'cancelled')
            ->orderBy('start_block')
            ->get()
            ->map(fn ($s) => [
                'id'           => $s->id,
                'subject_code' => $s->subject->code ?? '—',
                'subject_name' => $s->subject->name ?? '—',
                'room'         => $s->room ?? '—',
                'time'         => \App\Models\Session::BLOCKS[$s->start_block]['start'] . '–' . \App\Models\Session::BLOCKS[$s->end_block]['end'],
                'start_block'  => $s->start_block,
                'end_block'    => $s->end_block,
                'status'       => $s->status,
                'enrolled'     => $s->subject?->students()->count() ?? 0,
                'present'      => $s->attendances()->where('status', 'present')->count(),
                'late'         => $s->attendances()->where('status', 'late')->count(),
                'absent'       => $s->attendances()->where('status', 'absent')->count(),
            ]);

        $feed = \App\Models\Attendance::with(['student', 'session.subject'])
            ->whereHas('session', fn ($q) => $q->whereDate('date', $today))
            ->whereNotNull('checked_in_at')
            ->orderByDesc('checked_in_at')
            ->limit(50)
            ->get()
            ->map(fn ($a) => [
                'id'           => $a->id,
                'student_name' => $a->student->name ?? '—',
                'student_id'   => $a->student->student_id ?? '—',
                'subject_code' => $a->session?->subject?->code ?? '—',
                'time'         => $a->checked_in_at->format('H:i:s'),
                'status'       => $a->status,
                'method'       => $a->method ?? 'manual',
            ])->values();

        $stats = [
            'total_sessions' => $sessions->count(),
            'total'          => \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereDate('date', $today))->count(),
            'present'        => \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereDate('date', $today))->where('status', 'present')->count(),
            'late'           => \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereDate('date', $today))->where('status', 'late')->count(),
            'absent'         => \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereDate('date', $today))->where('status', 'absent')->count(),
            'face_id'        => \App\Models\Attendance::whereHas('session', fn ($q) => $q->whereDate('date', $today))->where('method', 'face')->count(),
        ];

        return Inertia::render('Admin/TodayActivity', [
            'sessions' => $sessions,
            'feed'     => $feed,
            'stats'    => $stats,
            'date'     => today()->format('l, d F Y'),
        ]);
    })->name('attendance.today');

    // Admin: Classes overview
    Route::get('/admin/classes', function () {
        $subjects = \App\Models\Subject::with(['schedules', 'lecturers:id,name'])
            ->withCount(['students', 'sessions'])
            ->orderBy('code')
            ->get()
            ->map(fn ($s) => [
                'id'             => $s->id,
                'code'           => $s->code,
                'name'           => $s->name,
                'status'         => $s->status,
                'credit_hours'   => $s->credit_hours,
                'start_date'     => $s->start_date?->format('d M Y'),
                'end_date'       => $s->end_date?->format('d M Y'),
                'lecturer'       => $s->lecturers->first()?->name ?? 'TBA',
                'students_count' => $s->students_count,
                'sessions_count' => $s->sessions_count,
                'schedules'      => $s->schedules->map(fn ($sc) => [
                    'id'          => $sc->id,
                    'day_of_week' => $sc->day_of_week,
                    'start_block' => $sc->start_block,
                    'end_block'   => $sc->end_block,
                    'type'        => $sc->type,
                    'time_range'  => $sc->time_range,
                    'block_count' => $sc->block_count,
                ]),
            ]);

        return Inertia::render('Admin/Classes', ['subjects' => $subjects]);
    })->name('admin.classes');

    // Subjects Routes
    Route::resource('subjects', SubjectController::class);
    Route::post('/subjects/{subject}/enroll',             [SubjectController::class, 'enroll'])->name('subjects.enroll');
    Route::delete('/subjects/{subject}/enroll/{student}', [SubjectController::class, 'unenroll'])->name('subjects.unenroll');

    Route::prefix('subjects/{subject}/sessions')->group(function () {
        Route::get('/create',      [SessionController::class, 'create'])->name('sessions.create');
        Route::post('/',           [SessionController::class, 'store'])->name('sessions.store');
        Route::get('/{session}/edit',   [SessionController::class, 'edit'])->name('sessions.edit');
        Route::put('/{session}',        [SessionController::class, 'update'])->name('sessions.update');
        Route::delete('/{session}',     [SessionController::class, 'destroy'])->name('sessions.destroy');
    });

    Route::get(
        '/subjects/{subject}/sessions/{session}/attendance',
        [AttendanceController::class, 'show']
    )->name('attendance.show');

    Route::post(
        '/subjects/{subject}/sessions/{session}/attendance',
        [AttendanceController::class, 'store']
    )->name('attendance.store');

    Route::prefix('subjects/{subject}/schedules')->group(function () {
        Route::get('/',          [ScheduleController::class, 'index'])->name('schedules.index');
        Route::post('/',         [ScheduleController::class, 'store'])->name('schedules.store');
        Route::delete('/{schedule}', [ScheduleController::class, 'destroy'])->name('schedules.destroy');
        Route::post('/generate', [ScheduleController::class, 'generate'])->name('schedules.generate');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
