<?php
// ─── app/Models/Schedule.php ──────────────────────────────────────────────────
namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
 
class Schedule extends Model
{
    protected $fillable = [
        'subject_id',
        'day_of_week',
        'start_block',
        'end_block',
        'type',
    ];
 
    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }
 
    public function sessions()
    {
        return $this->hasMany(Session::class);
    }
 
    // Human-readable time range e.g. "08:00 – 10:00"
    public function getTimeRangeAttribute(): string
    {
        $start = Session::BLOCKS[$this->start_block]['start'];
        $end   = Session::BLOCKS[$this->end_block]['end'];
        return "{$start} – {$end}";
    }
 
    // Number of blocks e.g. Block 1-2 = 2 blocks
    public function getBlockCountAttribute(): int
    {
        return $this->end_block - $this->start_block + 1;
    }
 
    // Check if this schedule overlaps with another on the same day
    public function overlapsWith(int $startBlock, int $endBlock, string $dayOfWeek, ?int $excludeId = null): bool
    {
        $query = static::where('day_of_week', $dayOfWeek)
            ->where('start_block', '<=', $endBlock)
            ->where('end_block',   '>=', $startBlock);
 
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
 
        return $query->exists();
    }
}