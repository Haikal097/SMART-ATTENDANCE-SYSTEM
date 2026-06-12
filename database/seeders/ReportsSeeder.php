<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use App\Models\Session;

class ReportsSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding Reports data...');

        // ── Lecturers ──────────────────────────────────────────────────────────
        $lecturerData = [
            ['name' => 'Dr. Ahmad Fadzil',  'email' => 'ahmad.fadzil@university.edu'],
            ['name' => 'Dr. Sarah Tan',     'email' => 'sarah.tan@university.edu'],
        ];

        $lecturerIds = [];
        foreach ($lecturerData as $l) {
            $user = \App\Models\User::updateOrCreate(
                ['email' => $l['email']],
                ['name' => $l['name'], 'password' => Hash::make('password'), 'role' => 'lecturer']
            );
            $lecturerIds[] = $user->id;
        }

        $this->command->info('Created ' . count($lecturerIds) . ' lecturers.');

        // ── Subjects ───────────────────────────────────────────────────────────
        $semStart = Carbon::today()->subWeeks(8)->startOfWeek(Carbon::MONDAY)->toDateString();
        $semEnd   = Carbon::today()->addWeeks(8)->endOfWeek(Carbon::FRIDAY)->toDateString();

        $subjectData = [
            ['code' => 'CS101', 'name' => 'Introduction to Programming',  'credit_hours' => 3, 'description' => 'Fundamentals of programming using Python'],
            ['code' => 'CS201', 'name' => 'Data Structures & Algorithms', 'credit_hours' => 3, 'description' => 'Core data structures and algorithmic thinking'],
            ['code' => 'CS301', 'name' => 'Database Systems',             'credit_hours' => 3, 'description' => 'Relational databases, SQL and data modelling'],
            ['code' => 'CS401', 'name' => 'Software Engineering',         'credit_hours' => 3, 'description' => 'SDLC, agile methods and project management'],
            ['code' => 'CS501', 'name' => 'Computer Networks',            'credit_hours' => 3, 'description' => 'TCP/IP, protocols and network security'],
        ];

        $subjects = [];
        foreach ($subjectData as $s) {
            $subjects[] = \App\Models\Subject::updateOrCreate(
                ['code' => $s['code']],
                array_merge($s, ['status' => 'active', 'start_date' => $semStart, 'end_date' => $semEnd])
            );
        }

        // ── Subject → Lecturer assignments ─────────────────────────────────────
        $assignments = [
            0 => 0, // CS101 → Dr. Ahmad
            1 => 0, // CS201 → Dr. Ahmad
            2 => 1, // CS301 → Dr. Sarah
            3 => 1, // CS401 → Dr. Sarah
            4 => 0, // CS501 → Dr. Ahmad
        ];

        foreach ($assignments as $subjectIdx => $lecturerIdx) {
            DB::table('subject_lecturer')->updateOrInsert(
                ['subject_id' => $subjects[$subjectIdx]->id, 'user_id' => $lecturerIds[$lecturerIdx]],
                ['role' => 'lecturer', 'created_at' => now(), 'updated_at' => now()]
            );
        }

        $this->command->info('Created ' . count($subjects) . ' subjects.');

        // ── Schedules ──────────────────────────────────────────────────────────
        // [subject_idx, day_of_week, start_block, end_block, type]
        $scheduleData = [
            [0, 'monday',    1, 2, 'lecture'],   // CS101 Mon 08:00–10:00
            [0, 'wednesday', 3, 3, 'tutorial'],  // CS101 Wed 10:00–11:00
            [1, 'tuesday',   3, 4, 'lecture'],   // CS201 Tue 10:00–12:00
            [1, 'thursday',  6, 6, 'tutorial'],  // CS201 Thu 13:00–14:00
            [2, 'monday',    6, 7, 'lecture'],   // CS301 Mon 13:00–15:00
            [2, 'friday',    2, 2, 'lab'],       // CS301 Fri 09:00–10:00
            [3, 'wednesday', 6, 7, 'lecture'],   // CS401 Wed 13:00–15:00
            [3, 'friday',    4, 4, 'tutorial'],  // CS401 Fri 11:00–12:00
            [4, 'tuesday',   1, 2, 'lecture'],   // CS501 Tue 08:00–10:00
            [4, 'thursday',  8, 8, 'lab'],       // CS501 Thu 15:00–16:00
        ];

        $schedules = [];
        foreach ($scheduleData as $sc) {
            $schedules[] = \App\Models\Schedule::updateOrCreate(
                ['subject_id' => $subjects[$sc[0]]->id, 'day_of_week' => $sc[1], 'type' => $sc[4]],
                ['start_block' => $sc[2], 'end_block' => $sc[3]]
            );
        }

        $this->command->info('Created ' . count($schedules) . ' schedules.');

        // ── Students ───────────────────────────────────────────────────────────
        $studentNames = [
            'Amirul Hakim',     'Nurul Ain',       'Muhammad Hafiz',   'Siti Nabilah',
            'Haziq Danial',     'Farhana Razak',   'Adam Syafiq',      'Nur Izzatul',
            'Izzuddin Zaki',    'Najwa Batrisyia', 'Irfan Fakhri',     'Amira Husna',
            'Zikri Azwan',      'Darwisyah',       'Luqmanul Hakim',   'Qistina Maisarah',
            'Aliff Syahmi',     'Nurulfateha',     'Arif Azim',        'Syarifah Alia',
        ];

        $students = [];
        foreach ($studentNames as $i => $name) {
            $sid = 'A22EC' . str_pad($i + 1001, 4, '0', STR_PAD_LEFT);
            $students[] = \App\Models\Student::updateOrCreate(
                ['student_id' => $sid],
                [
                    'name'            => $name,
                    'email'           => strtolower(str_replace([' ', "'"], ['.', ''], $name)) . '@student.edu',
                    'status'          => 'active',
                    'enrollment_date' => $semStart,
                ]
            );
        }

        $this->command->info('Created ' . count($students) . ' students.');

        // ── Enrol students in subjects ─────────────────────────────────────────
        // Each student gets 3 subjects from a rotating pool
        $enrolmentMap = [
            //  student idx  => [subject indices]
            0  => [0, 1, 2],
            1  => [0, 1, 3],
            2  => [0, 2, 4],
            3  => [1, 2, 3],
            4  => [1, 3, 4],
            5  => [0, 2, 3],
            6  => [0, 1, 4],
            7  => [2, 3, 4],
            8  => [0, 3, 4],
            9  => [1, 2, 4],
            10 => [0, 1, 2],
            11 => [0, 3, 4],
            12 => [1, 2, 3],
            13 => [0, 2, 4],
            14 => [1, 3, 4],
            // at-risk students (indices 15-19)
            15 => [0, 1, 2],
            16 => [0, 2, 3],
            17 => [1, 3, 4],
            18 => [0, 1, 4],
            19 => [2, 3, 4],
        ];

        foreach ($students as $i => $student) {
            foreach ($enrolmentMap[$i] as $subjectIdx) {
                DB::table('student_subject')->updateOrInsert(
                    ['student_id' => $student->id, 'subject_id' => $subjects[$subjectIdx]->id],
                    ['enrolled_at' => $semStart, 'created_at' => now(), 'updated_at' => now()]
                );
            }
        }

        $this->command->info('Enrolled students in subjects.');

        // ── Class sessions (past 30 days, based on schedules) ─────────────────
        $carbonDayMap = [
            'monday'    => Carbon::MONDAY,
            'tuesday'   => Carbon::TUESDAY,
            'wednesday' => Carbon::WEDNESDAY,
            'thursday'  => Carbon::THURSDAY,
            'friday'    => Carbon::FRIDAY,
        ];

        $roomNames = ['A101', 'B203', 'C305', 'D102', 'E201', 'F304', 'G108', 'H210'];

        // schedule_id → [Session, ...]  (past sessions only)
        $sessionsBySchedule = [];

        foreach ($schedules as $schIdx => $schedule) {
            $sessionsBySchedule[$schedule->id] = [];
            $targetDay = $carbonDayMap[$schedule->day_of_week];

            for ($daysAgo = 30; $daysAgo >= 0; $daysAgo--) {
                $date = Carbon::today()->subDays($daysAgo);
                if ($date->dayOfWeek !== $targetDay) continue;
                if ($date->lt(Carbon::parse($semStart))) continue;

                $isPast  = $daysAgo > 0;
                $status  = $isPast ? 'completed' : 'scheduled';
                $room    = $roomNames[$schIdx % count($roomNames)];

                $session = Session::updateOrCreate(
                    [
                        'subject_id'  => $schedule->subject_id,
                        'schedule_id' => $schedule->id,
                        'date'        => $date->toDateString(),
                        'start_block' => $schedule->start_block,
                        'end_block'   => $schedule->end_block,
                    ],
                    ['room' => $room, 'status' => $status]
                );

                if ($isPast) {
                    $sessionsBySchedule[$schedule->id][] = $session;
                }
            }
        }

        $this->command->info('Created class sessions.');

        // ── Attendance records ─────────────────────────────────────────────────
        // Students 0-14 : good attendance 78–95%
        // Students 15-19: at-risk       40–65%
        $atRiskIds = collect($students)->slice(15)->pluck('id')->flip()->toArray();
        $methodPool = ['face', 'face', 'face', 'manual']; // 75% face, 25% manual

        $attCount = 0;

        foreach ($schedules as $schedule) {
            $sessions = $sessionsBySchedule[$schedule->id] ?? [];
            if (empty($sessions)) continue;

            $enrolledIds = DB::table('student_subject')
                ->where('subject_id', $schedule->subject_id)
                ->pluck('student_id')
                ->toArray();

            foreach ($enrolledIds as $studentId) {
                $isAtRisk    = isset($atRiskIds[$studentId]);
                $presentRate = $isAtRisk ? rand(40, 65) : rand(78, 95);

                foreach ($sessions as $session) {
                    $roll = rand(1, 100);

                    if ($roll > $presentRate) {
                        // absent — record still inserted to track the miss
                        DB::table('attendances')->updateOrInsert(
                            ['student_id' => $studentId, 'session_id' => $session->id],
                            ['status' => 'absent', 'checked_in_at' => null, 'method' => 'face', 'created_at' => now(), 'updated_at' => now()]
                        );
                    } else {
                        $isLate  = rand(1, 10) === 1; // ~10% late
                        $status  = $isLate ? 'late' : 'present';
                        $method  = $methodPool[array_rand($methodPool)];

                        [$startHour]  = explode(':', Session::BLOCKS[$session->start_block]['start']);
                        $minuteOffset = $isLate ? rand(10, 29) : rand(0, 5);
                        $checkedInAt  = Carbon::parse($session->date)
                            ->setHour((int) $startHour)
                            ->setMinute($minuteOffset)
                            ->setSecond(rand(0, 59));

                        DB::table('attendances')->updateOrInsert(
                            ['student_id' => $studentId, 'session_id' => $session->id],
                            ['status' => $status, 'checked_in_at' => $checkedInAt, 'method' => $method, 'created_at' => now(), 'updated_at' => now()]
                        );
                        $attCount++;
                    }
                }
            }
        }

        $this->command->info("Created ~{$attCount} attendance records.");
        $this->command->info('Done! Visit /reports to see the analytics.');
    }
}
