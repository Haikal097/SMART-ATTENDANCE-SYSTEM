<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $fillable = [
        'student_id', 'name', 'email', 'phone',
        'enrollment_date', 'status', 'face_registered',
        'face_encoding_path', 'avatar_url', 'attendance_rate',
        'face_image_path', 'face_image_url', 'face_status', 'face_rejection_reason',
    ];

    // Relationship: Student belongs to a User
    public function getFaceImageUrlAttribute(): ?string
    {
        $user = $this->user;
        if ($user?->face_image_path) {
            return config('app.url') . '/storage/' . $user->face_image_path;
        }
        return $user?->face_image_url ?? $this->attributes['face_image_url'] ?? null;
    }

    public function getFaceLeftPathAttribute(): ?string
    {
        return $this->user?->face_left_path;
    }

    public function getFaceRightPathAttribute(): ?string
    {
        return $this->user?->face_right_path;
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'email', 'email');
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