<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Student;

class RoleSeeder extends Seeder
{
    public function run()
    {
        // 1. Admin Account
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@school.edu',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        // 2. Lecturer Account
        User::create([
            'name' => 'Lecturer User',
            'email' => 'lecturer@school.edu',
            'password' => bcrypt('password'),
            'role' => 'lecturer',
        ]);

        // 3. Student Account (User + Student profile)
        $user = User::create([
            'name' => 'Afiq Student',
            'email' => 'student@school.edu',
            'password' => bcrypt('password'),
            'role' => 'student',
        ]);

        Student::create([
            'student_id' => 'STU001',
            'name' => 'Afiq Student',
            'email' => 'student@school.edu',
            'phone' => '+60123456789',
            'class_id' => null,
            'enrollment_date' => now(),
            'status' => 'active',
            'face_registered' => false,
            'attendance_rate' => 92.5,
        ]);

        echo "✅ Created 3 test accounts:\n";
        echo "   Admin:         / password\n";
        echo "   Lecturer: lecturer@school.edu / password\n";
        echo "   Student:  student@school.edu  / password\n";
    }
}