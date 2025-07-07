<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function studyLogs() {
        return $this->hasMany(StudyLog::class);
    }

    public function pomodoroSessions()
    {
        return $this->hasMany(PomodoroSession::class);
    }

    public function pomodoroSettings()
    {
        return $this->hasOne(UserPomodoroSetting::class);
    }

    // Helper method to get pomodoro statistics
    public function getPomodoroStatistics(): array
    {
        $sessions = $this->pomodoroSessions()->completed()->get();
        
        return [
            'total_sessions' => $sessions->count(),
            'total_focus_time' => $sessions->where('session_type', 'work')->sum('actual_duration'),
            'average_session_length' => $sessions->where('session_type', 'work')->avg('actual_duration') ?? 0,
            'completion_rate' => $this->calculateCompletionRate(),
            'current_streak' => $this->calculateCurrentStreak(),
        ];
    }

    private function calculateCompletionRate(): float
    {
        $totalSessions = $this->pomodoroSessions()->whereIn('status', ['completed', 'cancelled'])->count();
        $completedSessions = $this->pomodoroSessions()->completed()->count();
        
        if ($totalSessions === 0) {
            return 0;
        }
        
        return ($completedSessions / $totalSessions) * 100;
    }

    private function calculateCurrentStreak(): int
    {
        $recentSessions = $this->pomodoroSessions()
            ->where('session_type', 'work')
            ->orderBy('started_at', 'desc')
            ->limit(10)
            ->get();
        
        $streak = 0;
        foreach ($recentSessions as $session) {
            if ($session->status === 'completed') {
                $streak++;
            } else {
                break;
            }
        }
        
        return $streak;
    }
}
