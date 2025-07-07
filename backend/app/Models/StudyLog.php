<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudyLog extends Model
{
    use HasFactory;

    protected $table = 'study_logs';

    protected $fillable = [
        'user_id',
        'topic',
        'duration_minutes',
        'log_date',
        'notes'
    ];

    protected $casts = [
        'log_date' => 'date',
        'duration_minutes' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function pomodoroSessions()
    {
        return $this->hasMany(PomodoroSession::class);
    }

    // Calculate total focus time from pomodoro sessions
    public function getTotalFocusTimeFromPomodoro(): int
    {
        return $this->pomodoroSessions()
            ->completed()
            ->where('session_type', 'work')
            ->sum('actual_duration');
    }
}
