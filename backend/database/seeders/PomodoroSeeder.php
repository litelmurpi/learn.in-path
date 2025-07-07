<?php

namespace Database\Seeders;

use App\Models\PomodoroSession;
use App\Models\StudyLog;
use App\Models\User;
use App\Models\UserPomodoroSettings;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PomodoroSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder creates comprehensive test data for Pomodoro API endpoints including:
     * - Multiple users with different usage patterns
     * - Various pomodoro session states (active, completed, cancelled, paused)
     * - User settings with different configurations
     * - Historical data spanning 30 days
     * - Integration with study logs
     */
    public function run(): void
    {
        // Clear existing data to allow re-running the seeder
        PomodoroSession::truncate();
        UserPomodoroSettings::truncate();
        
        echo "🍅 Starting Pomodoro Seeder...\n";
        
        // Create test users with different patterns
        $users = $this->createTestUsers();
        
        // Create user settings for each user
        $this->createUserSettings($users);
        
        // Create pomodoro sessions with various patterns
        $this->createPomodoroSessions($users);
        
        echo "✅ Pomodoro test data seeded successfully!\n";
        echo "📊 Summary:\n";
        echo "   - Users: " . count($users) . "\n";
        echo "   - Pomodoro Sessions: " . PomodoroSession::count() . "\n";
        echo "   - Active Sessions: " . PomodoroSession::where('status', 'active')->count() . "\n";
        echo "   - Completed Sessions: " . PomodoroSession::where('status', 'completed')->count() . "\n";
        echo "   - User Settings: " . UserPomodoroSettings::count() . "\n";
    }

    /**
     * Create test users with different characteristics
     */
    private function createTestUsers(): array
    {
        $users = [];

        // User 1: Morning person with high completion rate
        $users['morning_person'] = User::firstOrCreate([
            'email' => 'morning.person@example.com'
        ], [
            'name' => 'Alex Morning',
            'password' => bcrypt('password123')
        ]);

        // User 2: Night owl with custom durations
        $users['night_owl'] = User::firstOrCreate([
            'email' => 'night.owl@example.com'
        ], [
            'name' => 'Sam Night',
            'password' => bcrypt('password123')
        ]);

        // User 3: Consistent user with regular patterns
        $users['consistent'] = User::firstOrCreate([
            'email' => 'consistent.user@example.com'
        ], [
            'name' => 'Jordan Steady',
            'password' => bcrypt('password123')
        ]);

        // User 4: Sporadic user with irregular patterns
        $users['sporadic'] = User::firstOrCreate([
            'email' => 'sporadic.user@example.com'
        ], [
            'name' => 'Casey Random',
            'password' => bcrypt('password123')
        ]);

        // User 5: Struggling user with more cancelled sessions
        $users['struggling'] = User::firstOrCreate([
            'email' => 'struggling.user@example.com'
        ], [
            'name' => 'Robin Trying',
            'password' => bcrypt('password123')
        ]);

        return $users;
    }

    /**
     * Create user pomodoro settings with different configurations
     */
    private function createUserSettings(array $users): void
    {
        // Morning person: Default settings
        UserPomodoroSettings::create([
            'user_id' => $users['morning_person']->id,
            'work_duration' => 25,
            'short_break_duration' => 5,
            'long_break_duration' => 15,
            'long_break_interval' => 4,
            'auto_start_breaks' => true,
            'auto_start_work' => false,
            'notification_sound' => true,
            'notification_enabled' => true,
            'timezone' => 'America/New_York'
        ]);

        // Night owl: Custom longer durations
        UserPomodoroSettings::create([
            'user_id' => $users['night_owl']->id,
            'work_duration' => 45,
            'short_break_duration' => 10,
            'long_break_duration' => 30,
            'long_break_interval' => 3,
            'auto_start_breaks' => false,
            'auto_start_work' => true,
            'notification_sound' => false,
            'notification_enabled' => true,
            'timezone' => 'America/Los_Angeles'
        ]);

        // Consistent user: Medium durations
        UserPomodoroSettings::create([
            'user_id' => $users['consistent']->id,
            'work_duration' => 30,
            'short_break_duration' => 7,
            'long_break_duration' => 20,
            'long_break_interval' => 4,
            'auto_start_breaks' => true,
            'auto_start_work' => true,
            'notification_sound' => true,
            'notification_enabled' => true,
            'timezone' => 'UTC'
        ]);

        // Sporadic user: Default with notifications off
        UserPomodoroSettings::create([
            'user_id' => $users['sporadic']->id,
            'work_duration' => 25,
            'short_break_duration' => 5,
            'long_break_duration' => 15,
            'long_break_interval' => 4,
            'auto_start_breaks' => false,
            'auto_start_work' => false,
            'notification_sound' => false,
            'notification_enabled' => false,
            'timezone' => 'Europe/London'
        ]);

        // Struggling user: Shorter durations
        UserPomodoroSettings::create([
            'user_id' => $users['struggling']->id,
            'work_duration' => 15,
            'short_break_duration' => 5,
            'long_break_duration' => 10,
            'long_break_interval' => 3,
            'auto_start_breaks' => false,
            'auto_start_work' => false,
            'notification_sound' => true,
            'notification_enabled' => true,
            'timezone' => 'Asia/Tokyo'
        ]);
    }

    /**
     * Create pomodoro sessions with various patterns and states
     */
    private function createPomodoroSessions(array $users): void
    {
        $now = Carbon::now();
        $startDate = $now->copy()->subDays(30);

        foreach ($users as $userType => $user) {
            $this->createSessionsForUser($user, $userType, $startDate, $now);
        }

        // Create some active sessions for real-time testing
        $this->createActiveSessions($users);
    }

    /**
     * Create sessions for a specific user based on their pattern
     */
    private function createSessionsForUser(User $user, string $userType, Carbon $startDate, Carbon $now): void
    {
        $currentDate = $startDate->copy();
        $settings = $user->pomodoroSettings;
        
        while ($currentDate <= $now->copy()->subDay()) {
            $sessionsToday = $this->getSessionsCountForUserType($userType, $currentDate);
            
            if ($sessionsToday > 0) {
                $this->createDaySessionsForUser($user, $userType, $currentDate, $sessionsToday, $settings);
            }
            
            $currentDate->addDay();
        }
    }

    /**
     * Get number of sessions for user type on given date
     */
    private function getSessionsCountForUserType(string $userType, Carbon $date): int
    {
        switch ($userType) {
            case 'morning_person':
                return $date->isWeekday() ? rand(8, 12) : rand(3, 6);
            case 'night_owl':
                return $date->isWeekend() ? rand(10, 15) : rand(4, 8);
            case 'consistent':
                return rand(6, 10);
            case 'sporadic':
                return rand(0, 100) < 70 ? rand(2, 8) : 0; // 70% chance of studying
            case 'struggling':
                return rand(0, 100) < 60 ? rand(1, 4) : 0; // 60% chance of studying
            default:
                return rand(2, 6);
        }
    }

    /**
     * Create sessions for a user on a specific day
     */
    private function createDaySessionsForUser(User $user, string $userType, Carbon $date, int $sessionCount, UserPomodoroSettings $settings): void
    {
        $sessionTimes = $this->generateSessionTimes($userType, $date, $sessionCount);
        $studyLogId = $this->createStudyLogForDay($user, $date);
        
        foreach ($sessionTimes as $index => $sessionTime) {
            $sessionType = $this->determineSessionType($index);
            $duration = $this->getSessionDuration($sessionType, $settings);
            $status = $this->determineSessionStatus($userType, $sessionType);
            
            $session = $this->createSingleSession([
                'user_id' => $user->id,
                'session_type' => $sessionType,
                'duration_minutes' => $duration,
                'status' => $status,
                'started_at' => $sessionTime,
                'study_log_id' => $sessionType === 'work' ? $studyLogId : null,
            ]);
            
            $this->completeSessionBasedOnStatus($session, $sessionTime, $duration, $userType);
        }
    }

    /**
     * Generate realistic session times for a user type on a given day
     */
    private function generateSessionTimes(string $userType, Carbon $date, int $sessionCount): array
    {
        $times = [];
        
        switch ($userType) {
            case 'morning_person':
                $startHour = rand(6, 8);
                $endHour = rand(16, 18);
                break;
            case 'night_owl':
                $startHour = rand(14, 16);
                $endHour = rand(22, 23);
                break;
            case 'consistent':
                $startHour = rand(9, 11);
                $endHour = rand(17, 19);
                break;
            default:
                $startHour = rand(8, 12);
                $endHour = rand(16, 22);
        }
        
        for ($i = 0; $i < $sessionCount; $i++) {
            $hour = $startHour + (($endHour - $startHour) / $sessionCount) * $i + rand(-1, 1);
            $hour = max($startHour, min($endHour, $hour));
            $minute = rand(0, 59);
            
            $sessionTime = $date->copy()->hour($hour)->minute($minute)->second(0);
            $times[] = $sessionTime;
        }
        
        return $times;
    }

    /**
     * Create a study log entry for the day
     */
    private function createStudyLogForDay(User $user, Carbon $date): int
    {
        $topics = [
            'JavaScript Programming',
            'Database Design',
            'API Development',
            'Frontend Development',
            'System Architecture',
            'Testing Strategies',
            'Code Review',
            'Documentation Writing'
        ];
        
        $studyLog = StudyLog::create([
            'user_id' => $user->id,
            'topic' => $topics[array_rand($topics)] . ' - ' . $date->format('M d'),
            'duration_minutes' => 0, // Will be calculated from completed pomodoro sessions
            'log_date' => $date->format('Y-m-d'),
            'notes' => 'Generated from Pomodoro sessions'
        ]);
        
        return $studyLog->id;
    }

    /**
     * Determine session type based on index (work/break pattern)
     */
    private function determineSessionType(int $index): string
    {
        // Typical pattern: work, short break, work, short break, work, long break
        $pattern = ['work', 'short_break', 'work', 'short_break', 'work', 'short_break', 'work', 'long_break'];
        return $pattern[$index % count($pattern)];
    }

    /**
     * Get session duration based on type and user settings
     */
    private function getSessionDuration(string $sessionType, UserPomodoroSettings $settings): int
    {
        switch ($sessionType) {
            case 'work':
                return $settings->work_duration;
            case 'short_break':
                return $settings->short_break_duration;
            case 'long_break':
                return $settings->long_break_duration;
            default:
                return 25;
        }
    }

    /**
     * Determine session status based on user type and session type
     */
    private function determineSessionStatus(string $userType, string $sessionType): string
    {
        $completionRates = [
            'morning_person' => ['completed' => 85, 'cancelled' => 10, 'paused' => 5],
            'night_owl' => ['completed' => 75, 'cancelled' => 15, 'paused' => 10],
            'consistent' => ['completed' => 80, 'cancelled' => 12, 'paused' => 8],
            'sporadic' => ['completed' => 65, 'cancelled' => 25, 'paused' => 10],
            'struggling' => ['completed' => 50, 'cancelled' => 35, 'paused' => 15],
        ];
        
        $rates = $completionRates[$userType] ?? $completionRates['consistent'];
        $rand = rand(1, 100);
        
        if ($rand <= $rates['completed']) {
            return 'completed';
        } elseif ($rand <= $rates['completed'] + $rates['cancelled']) {
            return 'cancelled';
        } else {
            return 'paused';
        }
    }

    /**
     * Create a single pomodoro session
     */
    private function createSingleSession(array $data): PomodoroSession
    {
        return PomodoroSession::create($data);
    }

    /**
     * Complete session details based on status
     */
    private function completeSessionBasedOnStatus(PomodoroSession $session, Carbon $startTime, int $duration, string $userType): void
    {
        switch ($session->status) {
            case 'completed':
                $actualDuration = $this->getActualDuration($duration, $userType);
                $session->update([
                    'completed_at' => $startTime->copy()->addMinutes($actualDuration),
                    'actual_duration_minutes' => $actualDuration
                ]);
                break;
                
            case 'cancelled':
                $cancelTime = rand(1, $duration - 1);
                $session->update([
                    'cancelled_at' => $startTime->copy()->addMinutes($cancelTime),
                    'actual_duration_minutes' => $cancelTime
                ]);
                break;
                
            case 'paused':
                $pauseTime = rand(1, $duration - 5);
                $session->update([
                    'paused_at' => $startTime->copy()->addMinutes($pauseTime),
                    'actual_duration_minutes' => $pauseTime
                ]);
                break;
        }
    }

    /**
     * Get actual duration with some variance from planned duration
     */
    private function getActualDuration(int $plannedDuration, string $userType): int
    {
        $variance = match($userType) {
            'morning_person' => rand(-2, 3), // Very consistent
            'night_owl' => rand(-5, 10), // Sometimes goes over
            'consistent' => rand(-3, 3), // Pretty consistent
            'sporadic' => rand(-8, 5), // Often under
            'struggling' => rand(-10, 2), // Usually under
            default => rand(-3, 3)
        };
        
        return max(1, $plannedDuration + $variance);
    }

    /**
     * Create active sessions for real-time API testing
     */
    private function createActiveSessions(array $users): void
    {
        $now = Carbon::now();
        
        // Active work session for morning person
        PomodoroSession::create([
            'user_id' => $users['morning_person']->id,
            'session_type' => 'work',
            'duration_minutes' => 25,
            'status' => 'active',
            'started_at' => $now->copy()->subMinutes(10),
            'study_log_id' => $this->createTodayStudyLog($users['morning_person']),
        ]);
        
        // Paused session for night owl
        $pausedSession = PomodoroSession::create([
            'user_id' => $users['night_owl']->id,
            'session_type' => 'work',
            'duration_minutes' => 45,
            'status' => 'paused',
            'started_at' => $now->copy()->subMinutes(30),
            'paused_at' => $now->copy()->subMinutes(15),
            'actual_duration_minutes' => 15,
            'study_log_id' => $this->createTodayStudyLog($users['night_owl']),
        ]);
        
        // Active break session for consistent user
        PomodoroSession::create([
            'user_id' => $users['consistent']->id,
            'session_type' => 'short_break',
            'duration_minutes' => 7,
            'status' => 'active',
            'started_at' => $now->copy()->subMinutes(3),
        ]);
    }

    /**
     * Create a study log for today
     */
    private function createTodayStudyLog(User $user): int
    {
        $studyLog = StudyLog::firstOrCreate([
            'user_id' => $user->id,
            'log_date' => Carbon::today()->format('Y-m-d')
        ], [
            'topic' => 'Today\'s Focus Session',
            'duration_minutes' => 0,
            'notes' => 'Active session study log'
        ]);
        
        return $studyLog->id;
    }
}