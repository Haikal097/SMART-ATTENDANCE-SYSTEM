<?php
// ─── app/Models/Subject.php ───────────────────────────────────────────────────
namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
 
class Subject extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'credit_hours',
        'status',
        'start_date',
        'end_date',
    ];
 
    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
    ];
 
    // ── Relationships ─────────────────────────────────────────────────────────
 
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
 
    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }
 
    public function students()
    {
        return $this->belongsToMany(Student::class, 'student_subject')
                    ->withPivot('enrolled_at')
                    ->withTimestamps();
    }
 
    // ── Helpers ───────────────────────────────────────────────────────────────
 
    public function getSemesterDurationAttribute(): ?string
    {
        if (!$this->start_date || !$this->end_date) return null;
        return $this->start_date->format('d M Y') . ' – ' . $this->end_date->format('d M Y');
    }
 
    public function getWeeksCountAttribute(): ?int
    {
        if (!$this->start_date || !$this->end_date) return null;
        return (int) ceil($this->start_date->diffInDays($this->end_date) / 7);
    }
 
    // Has all required info to generate sessions
    public function isReadyToSchedule(): bool
    {
        return $this->start_date
            && $this->end_date
            && $this->schedules()->exists();
    }
}