<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $fillable = [
        'student_id', 'name', 'email', 'phone', 'class_id',
        'enrollment_date', 'status', 'face_registered',
        'face_encoding_path', 'avatar_url', 'attendance_rate',
        'face_image_path', 'face_image_url', 'face_status', 'face_rejection_reason',
    ];

    // Relationship: Student belongs to a User
    public function user()
    {
        return $this->belongsTo(User::class, 'student_id', 'student_id');
    }

    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'student_subject')
                    ->withPivot('enrolled_at')
                    ->withTimestamps();
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }
}