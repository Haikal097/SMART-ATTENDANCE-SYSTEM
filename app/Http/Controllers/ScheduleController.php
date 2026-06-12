<?php

namespace App\Http\Controllers;

use App\Models\PublicHoliday;
use App\Models\Schedule;
use App\Models\Session;
use App\Models\Subject;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScheduleController extends Controller
{
    // ── Timetable page ────────────────────────────────────────────────────────
    public function index(Subject $subject)
    {
        $schedules = $subject->schedules()->orderBy('day_of_week')->orderBy('start_block')->get();

        // Check for conflicts with OTHER subjects on same day/blocks
        $conflicts = [];
        foreach ($schedules as $sched) {
            $conflicting = Schedule::where('id', '!=', $sched->id)
                ->where('day_of_week', $sched->day_of_week)
                ->where('start_block', '<=', $sched->end_block)
                ->where('end_block',   '>=', $sched->start_block)
                ->with('subject:id,code,name')
                ->get();

            foreach ($conflicting as $c) {
                $conflicts[] = [
                    'day'                  => $sched->day_of_week,
                    'start_block'          => $sched->start_block,
                    'end_block'            => $sched->end_block,
                    'conflicting_subject'  => $c->subject->code,
                    'conflicting_type'     => $c->type,
                    'conflicting_time'     => Session::BLOCKS[$c->start_block]['start'] . '–' . Session::BLOCKS[$c->end_block]['end'],
                ];
            }
        }

        return Inertia::render('Subjects/Timetable', [
            'subject' => [
                'id'         => $subject->id,
                'code'       => $subject->code,
                'name'       => $subject->name,
                'start_date' => $subject->start_date?->format('Y-m-d'),
                'end_date'   => $subject->end_date?->format('Y-m-d'),
                'status'     => $subject->status,
            ],
            'schedules' => $schedules->map(fn($s) => [
                'id'          => $s->id,
                'subject_id'  => $s->subject_id,
                'day_of_week' => $s->day_of_week,
                'start_block' => $s->start_block,
                'end_block'   => $s->end_block,
                'type'        => $s->type,
                'time_range'  => $s->time_range,
                'block_count' => $s->block_count,
            ]),
            'otherSchedules' => Schedule::where('subject_id', '!=', $subject->id)
                ->with('subject:id,code')
                ->get()
                ->map(fn($s) => [
                    'id'           => $s->id,
                    'subject_code' => $s->subject->code,
                    'day_of_week'  => $s->day_of_week,
                    'start_block'  => $s->start_block,
                    'end_block'    => $s->end_block,
                    'type'         => $s->type,
                    'time_range'   => $s->time_range,
                ]),
            'conflicts'       => $conflicts,
            'generatedCount'  => $subject->sessions()->whereNotNull('schedule_id')->count() ?: null,
            'pendingHolidays' => $subject->sessions()->where('is_holiday', true)->where('holiday_action', 'pending')->count(),
        ]);
    }

    // ── Store new schedule ────────────────────────────────────────────────────
    public function store(Request $request, Subject $subject)
    {
        $validated = $request->validate([
            'day_of_week' => 'required|in:monday,tuesday,wednesday,thursday,friday',
            'start_block' => 'required|integer|between:1,10',
            'end_block'   => 'required|integer|between:1,10|gte:start_block',
            'type'        => 'required|in:lecture,lab,tutorial',
        ]);

        // Overlap check across ALL subjects (single room)
        $overlap = Schedule::where('day_of_week', $validated['day_of_week'])
            ->where('start_block', '<=', $validated['end_block'])
            ->where('end_block',   '>=', $validated['start_block'])
            ->with('subject:id,code')
            ->first();

        if ($overlap) {
            $startTime = Session::BLOCKS[$overlap->start_block]['start'];
            $endTime   = Session::BLOCKS[$overlap->end_block]['end'];
            return back()->withErrors([
                'start_block' => "Conflicts with {$overlap->subject->code} ({$overlap->type}) on " .
                    ucfirst($validated['day_of_week']) . " {$startTime}–{$endTime}.",
            ]);
        }

        $subject->schedules()->create($validated);

        return back()->with('success', 'Schedule added.');
    }

    // ── Delete schedule ───────────────────────────────────────────────────────
    public function destroy(Subject $subject, Schedule $schedule)
    {
        $schedule->delete();
        return back()->with('success', 'Schedule removed.');
    }

    // ── Generate sessions from schedules ──────────────────────────────────────
    public function generate(Subject $subject)
    {
        if (!$subject->start_date || !$subject->end_date) {
            return back()->withErrors(['generate' => 'Semester dates are not set.']);
        }

        $schedules = $subject->schedules()->get();

        if ($schedules->isEmpty()) {
            return back()->withErrors(['generate' => 'No schedules defined yet.']);
        }

        // Delete previously auto-generated sessions (keep manually created ones)
        $subject->sessions()->whereNotNull('schedule_id')->delete();

        $dayMap = [
            'monday'    => Carbon::MONDAY,
            'tuesday'   => Carbon::TUESDAY,
            'wednesday' => Carbon::WEDNESDAY,
            'thursday'  => Carbon::THURSDAY,
            'friday'    => Carbon::FRIDAY,
        ];

        $generated = 0;

        foreach ($schedules as $schedule) {
            $dayOfWeek = $dayMap[$schedule->day_of_week];
            $current   = $subject->start_date->copy()->next($dayOfWeek);

            // If start_date itself is the right day
            if ($subject->start_date->dayOfWeek === $dayOfWeek) {
                $current = $subject->start_date->copy();
            }

            while ($current->lte($subject->end_date)) {
                $dateStr    = $current->format('Y-m-d');
                $isHoliday  = PublicHoliday::isHoliday($dateStr);
                $holidayName = $isHoliday ? PublicHoliday::nameFor($dateStr) : null;

            Session::create([
                'subject_id'     => $subject->id,
                'schedule_id'    => $schedule->id,
                'date'           => $dateStr,
                'start_block'    => $schedule->start_block,
                'end_block'      => $schedule->end_block,
                'room'           => 'Pi Room',
                'status'         => $isHoliday ? 'cancelled' : 'scheduled',
                'is_holiday'     => $isHoliday,
                'holiday_note'   => $holidayName,
                'holiday_action' => $isHoliday ? 'pending' : null,  // ← null for normal sessions
                'notes'          => $isHoliday ? "Public holiday: {$holidayName}" : null,
            ]);

                $generated++;
                $current->addWeek();
            }
        }

        return back()->with('success', "{$generated} sessions generated successfully.");
    }
}