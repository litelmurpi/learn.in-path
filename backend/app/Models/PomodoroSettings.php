<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PomodoroSettings extends Model
{
    use HasFactory;

    protected $table = 'pomodoro_settings';

    protected $fillable = [
        'user_id',
        'work_duration',
        'short_break_duration',
        'long_break_duration',
        'long_break_interval',
        'auto_start_breaks',
        'auto_start_work',
        'sound_enabled',
        'notification_sound'
    ];

    protected $casts = [
        'work_duration' => 'integer',
        'short_break_duration' => 'integer',
        'long_break_duration' => 'integer',
        'long_break_interval' => 'integer',
        'auto_start_breaks' => 'boolean',
        'auto_start_work' => 'boolean',
        'sound_enabled' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Default values
    const DEFAULT_WORK_DURATION = 25;
    const DEFAULT_SHORT_BREAK_DURATION = 5;
    const DEFAULT_LONG_BREAK_DURATION = 15;
    const DEFAULT_LONG_BREAK_INTERVAL = 4;

    // Available notification sounds
    const NOTIFICATION_SOUNDS = [
        'bell' => 'Bell',
        'chime' => 'Chime',
        'ding' => 'Ding',
        'buzz' => 'Buzz',
        'gentle' => 'Gentle',
        'none' => 'No Sound'
    ];

    /**
     * Relationships
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Accessors
     */
    public function getWorkDurationInSecondsAttribute()
    {
        return $this->work_duration * 60;
    }

    public function getShortBreakDurationInSecondsAttribute()
    {
        return $this->short_break_duration * 60;
    }

    public function getLongBreakDurationInSecondsAttribute()
    {
        return $this->long_break_duration * 60;
    }

    public function getNotificationSoundNameAttribute()
    {
        return self::NOTIFICATION_SOUNDS[$this->notification_sound] ?? 'Bell';
    }

    /**
     * Business Logic Methods
     */
    public function getNextBreakType($completedWorkSessions)
    {
        return ($completedWorkSessions % $this->long_break_interval === 0) 
            ? PomodoroSession::TYPE_LONG_BREAK 
            : PomodoroSession::TYPE_SHORT_BREAK;
    }

    public function getBreakDuration($breakType)
    {
        return $breakType === PomodoroSession::TYPE_LONG_BREAK 
            ? $this->long_break_duration 
            : $this->short_break_duration;
    }

    public function getDurationForSessionType($sessionType)
    {
        switch ($sessionType) {
            case PomodoroSession::TYPE_WORK:
                return $this->work_duration;
            case PomodoroSession::TYPE_SHORT_BREAK:
                return $this->short_break_duration;
            case PomodoroSession::TYPE_LONG_BREAK:
                return $this->long_break_duration;
            default:
                return $this->work_duration;
        }
    }

    /**
     * Static Methods
     */
    public static function getOrCreateForUser($userId)
    {
        return self::firstOrCreate(
            ['user_id' => $userId],
            [
                'work_duration' => self::DEFAULT_WORK_DURATION,
                'short_break_duration' => self::DEFAULT_SHORT_BREAK_DURATION,
                'long_break_duration' => self::DEFAULT_LONG_BREAK_DURATION,
                'long_break_interval' => self::DEFAULT_LONG_BREAK_INTERVAL,
                'auto_start_breaks' => false,
                'auto_start_work' => false,
                'sound_enabled' => true,
                'notification_sound' => 'bell'
            ]
        );
    }

    public static function getDefaultSettings()
    {
        return [
            'work_duration' => self::DEFAULT_WORK_DURATION,
            'short_break_duration' => self::DEFAULT_SHORT_BREAK_DURATION,
            'long_break_duration' => self::DEFAULT_LONG_BREAK_DURATION,
            'long_break_interval' => self::DEFAULT_LONG_BREAK_INTERVAL,
            'auto_start_breaks' => false,
            'auto_start_work' => false,
            'sound_enabled' => true,
            'notification_sound' => 'bell'
        ];
    }

    /**
     * Validation Rules
     */
    public static function validationRules()
    {
        return [
            'work_duration' => 'required|integer|min:1|max:180',
            'short_break_duration' => 'required|integer|min:1|max:60',
            'long_break_duration' => 'required|integer|min:1|max:120',
            'long_break_interval' => 'required|integer|min:2|max:10',
            'auto_start_breaks' => 'boolean',
            'auto_start_work' => 'boolean',
            'sound_enabled' => 'boolean',
            'notification_sound' => 'required|string|in:' . implode(',', array_keys(self::NOTIFICATION_SOUNDS))
        ];
    }

    /**
     * Custom validation messages
     */
    public static function validationMessages()
    {
        return [
            'work_duration.min' => 'Work duration must be at least 1 minute',
            'work_duration.max' => 'Work duration cannot exceed 180 minutes',
            'short_break_duration.max' => 'Short break cannot exceed 60 minutes',
            'long_break_duration.max' => 'Long break cannot exceed 120 minutes',
            'long_break_interval.min' => 'Long break interval must be at least 2 work sessions',
            'long_break_interval.max' => 'Long break interval cannot exceed 10 work sessions',
        ];
    }
}