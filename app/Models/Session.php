<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    protected $table = 'class_sessions';
    
    protected $fillable = [
        'subject_id', 'date', 'start_time', 'end_time', 'room', 'status', 'notes'
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function presentStudents()
    {
        return $this->hasMany(Attendance::class)->where('status', 'present');
    }
}