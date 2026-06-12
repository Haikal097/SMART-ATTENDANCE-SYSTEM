<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'face_image_path',
        'face_image_url',
        'face_left_path',
        'face_right_path',
        'face_status',
        'face_rejection_reason',
    ];

    protected $appends = ['face_left_url', 'face_right_url'];

    public function getFaceLeftUrlAttribute(): ?string
    {
        return $this->face_left_path ? asset('storage/' . $this->face_left_path) : null;
    }

    public function getFaceRightUrlAttribute(): ?string
    {
        return $this->face_right_path ? asset('storage/' . $this->face_right_path) : null;
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'subject_lecturer', 'user_id', 'subject_id')
                    ->withPivot('role')
                    ->withTimestamps();
    }

    public function isLecturer(): bool
    {
        return $this->role === 'lecturer';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
