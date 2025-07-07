<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserPomodoroSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'work_duration',
        'short_break_duration',
        'long_break_duration',
        'sessions_before_long_break',
        'auto_start_breaks',
        'notifications_enabled'
    ];

    protected $casts = [
        'work_duration' => 'integer',
        'short_break_duration' => 'integer',
        'long_break_duration' => 'integer',
        'sessions_before_long_break' => 'integer',
        'auto_start_breaks' => 'boolean',
        'notifications_enabled' => 'boolean',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Static method to get default settings
    public static function getDefaults(): array
    {
        return [
            'work_duration' => 25,
            'short_break_duration' => 5,
            'long_break_duration' => 15,
            'sessions_before_long_break' => 4,
            'auto_start_breaks' => false,
            'notifications_enabled' => true,
        ];
    }

    // Get user settings or create with defaults
    public static function getOrCreateForUser(int $userId): self
    {
        return static::firstOrCreate(
            ['user_id' => $userId],
            static::getDefaults()
        );
    }
}