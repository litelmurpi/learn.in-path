<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class PomodoroSession extends Model
{
    use HasFactory;

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
        'planned_duration' => 'integer',
        'actual_duration' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    protected $appends = [
        'formatted_planned_duration',
        'formatted_actual_duration',
        'time_remaining',
        'is_active'
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function studyLog()
    {
        return $this->belongsTo(StudyLog::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePaused($query)
    {
        return $query->where('status', 'paused');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('session_type', $type);
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

    // Accessors
    public function getFormattedPlannedDurationAttribute(): string
    {
        return $this->formatDuration($this->planned_duration);
    }

    public function getFormattedActualDurationAttribute(): string
    {
        return $this->formatDuration($this->actual_duration ?? 0);
    }

    public function getTimeRemainingAttribute(): int
    {
        if (!$this->isActive()) {
            return 0;
        }

        $elapsed = Carbon::parse($this->started_at)->diffInMinutes(Carbon::now());
        $remaining = $this->planned_duration - $elapsed;
        
        return max(0, $remaining * 60); // Return in seconds
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->status === 'active';
    }

    // Methods
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isPaused(): bool
    {
        return $this->status === 'paused';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function pause(): bool
    {
        if ($this->isActive()) {
            $this->status = 'paused';
            return $this->save();
        }
        return false;
    }

    public function resume(): bool
    {
        if ($this->isPaused()) {
            $this->status = 'active';
            return $this->save();
        }
        return false;
    }

    public function complete(): bool
    {
        if ($this->isActive() || $this->isPaused()) {
            $this->status = 'completed';
            $this->completed_at = Carbon::now();
            $this->actual_duration = Carbon::parse($this->started_at)->diffInMinutes(Carbon::now());
            return $this->save();
        }
        return false;
    }

    public function cancel(): bool
    {
        if ($this->isActive() || $this->isPaused()) {
            $this->status = 'cancelled';
            $this->completed_at = Carbon::now();
            $this->actual_duration = Carbon::parse($this->started_at)->diffInMinutes(Carbon::now());
            return $this->save();
        }
        return false;
    }

    public function calculateEfficiency(): float
    {
        if (!$this->actual_duration || !$this->planned_duration) {
            return 0;
        }

        return min(100, ($this->actual_duration / $this->planned_duration) * 100);
    }

    private function formatDuration(int $minutes): string
    {
        if ($minutes < 60) {
            return "{$minutes} menit";
        }
        
        $hours = floor($minutes / 60);
        $remainingMinutes = $minutes % 60;
        
        if ($remainingMinutes == 0) {
            return "{$hours} jam";
        }
        
        return "{$hours} jam {$remainingMinutes} menit";
    }
}