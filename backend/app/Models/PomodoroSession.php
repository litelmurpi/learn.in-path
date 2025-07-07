<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class PomodoroSession extends Model
{
    use HasFactory;

    protected $table = 'pomodoro_sessions';

    protected $fillable = [
        'user_id',
        'study_log_id',
        'session_type',
        'planned_duration',
        'actual_duration',
        'status',
        'started_at',
        'completed_at',
        'notes'
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'planned_duration' => 'integer',
        'actual_duration' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Session Types
    const TYPE_WORK = 'work';
    const TYPE_SHORT_BREAK = 'short_break';
    const TYPE_LONG_BREAK = 'long_break';

    // Session Status
    const STATUS_ACTIVE = 'active';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_PAUSED = 'paused';

    /**
     * Relationships
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function studyLog()
    {
        return $this->belongsTo(StudyLog::class);
    }

    /**
     * Scopes
     */
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

    public function scopeToday($query)
    {
        return $query->whereDate('started_at', Carbon::today());
    }

    public function scopeThisWeek($query)
    {
        return $query->whereBetween('started_at', [
            Carbon::now()->startOfWeek(),
            Carbon::now()->endOfWeek()
        ]);
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('started_at', Carbon::now()->month)
                    ->whereYear('started_at', Carbon::now()->year);
    }

    /**
     * Accessors & Mutators
     */
    public function getIsActiveAttribute()
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function getIsCompletedAttribute()
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function getIsPausedAttribute()
    {
        return $this->status === self::STATUS_PAUSED;
    }

    public function getIsWorkSessionAttribute()
    {
        return $this->session_type === self::TYPE_WORK;
    }

    public function getIsBreakSessionAttribute()
    {
        return in_array($this->session_type, [self::TYPE_SHORT_BREAK, self::TYPE_LONG_BREAK]);
    }

    public function getDurationInSecondsAttribute()
    {
        return $this->planned_duration * 60;
    }

    public function getActualDurationInSecondsAttribute()
    {
        return $this->actual_duration ? $this->actual_duration * 60 : 0;
    }

    public function getRemainingTimeAttribute()
    {
        if (!$this->is_active) {
            return 0;
        }

        $elapsed = Carbon::now()->diffInSeconds($this->started_at);
        $remaining = $this->duration_in_seconds - $elapsed;
        
        return max(0, $remaining);
    }

    public function getElapsedTimeAttribute()
    {
        if (!$this->started_at) {
            return 0;
        }

        $endTime = $this->completed_at ?? Carbon::now();
        return $this->started_at->diffInSeconds($endTime);
    }

    public function getProgressPercentageAttribute()
    {
        if ($this->planned_duration <= 0) {
            return 0;
        }

        $elapsed = $this->elapsed_time / 60; // Convert to minutes
        return min(100, ($elapsed / $this->planned_duration) * 100);
    }

    /**
     * Business Logic Methods
     */
    public function start()
    {
        $this->update([
            'status' => self::STATUS_ACTIVE,
            'started_at' => Carbon::now()
        ]);

        return $this;
    }

    public function pause()
    {
        if ($this->is_active) {
            $this->update([
                'status' => self::STATUS_PAUSED,
                'actual_duration' => $this->elapsed_time / 60 // Convert to minutes
            ]);
        }

        return $this;
    }

    public function resume()
    {
        if ($this->is_paused) {
            // Adjust started_at to account for paused time
            $pausedDuration = $this->actual_duration ?? 0;
            $adjustedStartTime = Carbon::now()->subMinutes($pausedDuration);
            
            $this->update([
                'status' => self::STATUS_ACTIVE,
                'started_at' => $adjustedStartTime
            ]);
        }

        return $this;
    }

    public function complete()
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'completed_at' => Carbon::now(),
            'actual_duration' => $this->elapsed_time / 60 // Convert to minutes
        ]);

        return $this;
    }

    public function cancel()
    {
        $this->update([
            'status' => self::STATUS_CANCELLED,
            'completed_at' => Carbon::now(),
            'actual_duration' => $this->elapsed_time / 60 // Convert to minutes
        ]);

        return $this;
    }

    /**
     * Static Methods
     */
    public static function getActiveSession($userId)
    {
        return self::where('user_id', $userId)
                   ->active()
                   ->first();
    }

    public static function getTodayStats($userId)
    {
        $sessions = self::where('user_id', $userId)
                       ->today()
                       ->completed()
                       ->get();

        return [
            'total_sessions' => $sessions->count(),
            'work_sessions' => $sessions->where('session_type', self::TYPE_WORK)->count(),
            'break_sessions' => $sessions->whereIn('session_type', [self::TYPE_SHORT_BREAK, self::TYPE_LONG_BREAK])->count(),
            'total_time' => $sessions->sum('actual_duration'),
            'work_time' => $sessions->where('session_type', self::TYPE_WORK)->sum('actual_duration'),
            'break_time' => $sessions->whereIn('session_type', [self::TYPE_SHORT_BREAK, self::TYPE_LONG_BREAK])->sum('actual_duration'),
        ];
    }

    public static function getWeeklyStats($userId)
    {
        $sessions = self::where('user_id', $userId)
                       ->thisWeek()
                       ->completed()
                       ->get();

        return [
            'total_sessions' => $sessions->count(),
            'work_sessions' => $sessions->where('session_type', self::TYPE_WORK)->count(),
            'total_time' => $sessions->sum('actual_duration'),
            'work_time' => $sessions->where('session_type', self::TYPE_WORK)->sum('actual_duration'),
            'daily_breakdown' => $sessions->groupBy(function($session) {
                return $session->started_at->format('Y-m-d');
            })->map(function($daySessions) {
                return [
                    'sessions' => $daySessions->count(),
                    'work_time' => $daySessions->where('session_type', self::TYPE_WORK)->sum('actual_duration'),
                    'total_time' => $daySessions->sum('actual_duration'),
                ];
            }),
        ];
    }
}