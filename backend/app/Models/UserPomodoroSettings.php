<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserPomodoroSettings extends Model
{
    use HasFactory;

    protected $table = 'user_pomodoro_settings';

    protected $fillable = [
        'user_id',
        'work_duration',
        'short_break_duration',
        'long_break_duration',
        'long_break_interval',
        'auto_start_breaks',
        'auto_start_work',
        'notification_sound',
        'notification_enabled',
        'timezone'
    ];

    protected $casts = [
        'work_duration' => 'integer',
        'short_break_duration' => 'integer',
        'long_break_duration' => 'integer',
        'long_break_interval' => 'integer',
        'auto_start_breaks' => 'boolean',
        'auto_start_work' => 'boolean',
        'notification_sound' => 'boolean',
        'notification_enabled' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function getDefaultSettings()
    {
        return [
            'work_duration' => 25,
            'short_break_duration' => 5,
            'long_break_duration' => 15,
            'long_break_interval' => 4,
            'auto_start_breaks' => false,
            'auto_start_work' => false,
            'notification_sound' => true,
            'notification_enabled' => true,
            'timezone' => 'UTC'
        ];
    }
}