<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PomodoroSession extends Model
{
    use HasFactory;

    protected $table = 'pomodoro_sessions';

    protected $fillable = [
        'user_id',
        'session_type',
        'duration_minutes',
        'status',
        'started_at',
        'completed_at',
        'paused_at',
        'cancelled_at',
        'study_log_id',
        'actual_duration_minutes',
        'notes'
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'paused_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'duration_minutes' => 'integer',
        'actual_duration_minutes' => 'integer',
    ];

    // Session types
    const TYPE_WORK = 'work';
    const TYPE_SHORT_BREAK = 'short_break';
    const TYPE_LONG_BREAK = 'long_break';

    // Session statuses
    const STATUS_ACTIVE = 'active';
    const STATUS_PAUSED = 'paused';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function studyLog()
    {
        return $this->belongsTo(StudyLog::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopeWorkSessions($query)
    {
        return $query->where('session_type', self::TYPE_WORK);
    }

    public function scopeBreakSessions($query)
    {
        return $query->whereIn('session_type', [self::TYPE_SHORT_BREAK, self::TYPE_LONG_BREAK]);
    }
}