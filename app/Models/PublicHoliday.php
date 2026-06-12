<?php
// ─── app/Models/PublicHoliday.php ─────────────────────────────────────────────
namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
 
class PublicHoliday extends Model
{
    protected $fillable = ['date', 'name'];
 
    protected $casts = [
        'date' => 'date',
    ];
 
    // Check if a given date is a public holiday
    public static function isHoliday(string $date): bool
    {
        return static::whereDate('date', $date)->exists();
    }
 
    // Get holiday name for a date (or null)
    public static function nameFor(string $date): ?string
    {
        return static::whereDate('date', $date)->value('name');
    }
}