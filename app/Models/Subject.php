<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    protected $fillable = ['code', 'name', 'description', 'credit_hours', 'status'];

    public function lecturers()
    {
        return $this->belongsToMany(User::class, 'subject_lecturer', 'subject_id', 'user_id')
                    ->withPivot('role')
                    ->withTimestamps();
    }

    public function sessions()
    {
        return $this->hasMany(Session::class);
    }

    public function students()
    {
        return $this->belongsToMany(Student::class, 'student_subject')
                    ->withPivot('enrolled_at')
                    ->withTimestamps();
    }
}