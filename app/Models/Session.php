<?php
// ─── app/Models/Session.php ───────────────────────────────────────────────────
namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
 
class Session extends Model
{
    protected $table = 'class_sessions';
 
    protected $fillable = [
        'subject_id',
        'schedule_id',
        'date',
        'start_block',
        'end_block',
        'room',
        'status',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
    ];
 
    const BLOCKS = [
        1  => ['start' => '08:00', 'end' => '09:00'],
        2  => ['start' => '09:00', 'end' => '10:00'],
        3  => ['start' => '10:00', 'end' => '11:00'],
        4  => ['start' => '11:00', 'end' => '12:00'],
        5  => ['start' => '12:00', 'end' => '13:00'],
        6  => ['start' => '13:00', 'end' => '14:00'],
        7  => ['start' => '14:00', 'end' => '15:00'],
        8  => ['start' => '15:00', 'end' => '16:00'],
        9  => ['start' => '16:00', 'end' => '17:00'],
        10 => ['start' => '17:00', 'end' => '18:00'],
        11 => ['start' => '18:00', 'end' => '19:00'],
        12 => ['start' => '19:00', 'end' => '20:00'],
        13 => ['start' => '20:00', 'end' => '21:00'],
        14 => ['start' => '21:00', 'end' => '22:00'],
        15 => ['start' => '22:00', 'end' => '23:00'],
    ];
 
    // ── Relationships ─────────────────────────────────────────────────────────
 
    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }
 
    public function schedule()
    {
        return $this->belongsTo(Schedule::class);
    }
 
    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }
 
    public function presentStudents()
    {
        return $this->hasMany(Attendance::class)->where('status', 'present');
    }
 
    // ── Accessors ─────────────────────────────────────────────────────────────
 
    public function getTimeRangeAttribute(): string
    {
        $start = self::BLOCKS[$this->start_block]['start'];
        $end   = self::BLOCKS[$this->end_block]['end'];
        return "Block {$this->start_block} – Block {$this->end_block} ({$start} – {$end})";
    }
 
    public function getBlockCountAttribute(): int
    {
        return $this->end_block - $this->start_block + 1;
    }
 
    public function getStartTimeAttribute(): string
    {
        return self::BLOCKS[$this->start_block]['start'];
    }
 
    public function getEndTimeAttribute(): string
    {
        return self::BLOCKS[$this->end_block]['end'];
    }
 
    // ── Scopes ────────────────────────────────────────────────────────────────
 
    public function scopeToday($query)
    {
        return $query->whereDate('date', today());
    }
 
    // ── Helpers ───────────────────────────────────────────────────────────────
 
    // Get the session happening RIGHT NOW in the Pi room
    public static function currentSession(): ?self
    {
        $now          = now();
        $currentHour  = (int) $now->format('H');
        $currentBlock = null;
 
        foreach (self::BLOCKS as $block => $times) {
            [$startH] = explode(':', $times['start']);
            [$endH]   = explode(':', $times['end']);
            if ($currentHour >= (int)$startH && $currentHour < (int)$endH) {
                $currentBlock = $block;
                break;
            }
        }
 
        if (!$currentBlock) return null;
 
        return static::whereDate('date', today())
            ->where('start_block', '<=', $currentBlock)
            ->where('end_block',   '>=', $currentBlock)
            ->where('status', 'ongoing')
            ->first();
    }
}
 