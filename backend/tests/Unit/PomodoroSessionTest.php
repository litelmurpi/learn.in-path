<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\PomodoroSession;
use App\Models\User;
use App\Models\StudyLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

class PomodoroSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_pomodoro_session()
    {
        $user = User::factory()->create();
        
        $session = PomodoroSession::create([
            'user_id' => $user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'status' => 'active',
            'started_at' => Carbon::now()
        ]);

        $this->assertInstanceOf(PomodoroSession::class, $session);
        $this->assertEquals('work', $session->session_type);
        $this->assertEquals(25, $session->planned_duration);
        $this->assertEquals('active', $session->status);
    }

    public function test_can_pause_active_session()
    {
        $user = User::factory()->create();
        
        $session = PomodoroSession::create([
            'user_id' => $user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'status' => 'active',
            'started_at' => Carbon::now()
        ]);

        $result = $session->pause();
        
        $this->assertTrue($result);
        $this->assertEquals('paused', $session->fresh()->status);
    }

    public function test_cannot_pause_non_active_session()
    {
        $user = User::factory()->create();
        
        $session = PomodoroSession::create([
            'user_id' => $user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'status' => 'completed',
            'started_at' => Carbon::now()
        ]);

        $result = $session->pause();
        
        $this->assertFalse($result);
        $this->assertEquals('completed', $session->fresh()->status);
    }

    public function test_can_resume_paused_session()
    {
        $user = User::factory()->create();
        
        $session = PomodoroSession::create([
            'user_id' => $user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'status' => 'paused',
            'started_at' => Carbon::now()
        ]);

        $result = $session->resume();
        
        $this->assertTrue($result);
        $this->assertEquals('active', $session->fresh()->status);
    }

    public function test_can_complete_session()
    {
        $user = User::factory()->create();
        
        $session = PomodoroSession::create([
            'user_id' => $user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'status' => 'active',
            'started_at' => Carbon::now()->subMinutes(20)
        ]);

        $result = $session->complete();
        
        $this->assertTrue($result);
        $this->assertEquals('completed', $session->fresh()->status);
        $this->assertNotNull($session->fresh()->completed_at);
        $this->assertNotNull($session->fresh()->actual_duration);
    }

    public function test_can_cancel_session()
    {
        $user = User::factory()->create();
        
        $session = PomodoroSession::create([
            'user_id' => $user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'status' => 'active',
            'started_at' => Carbon::now()->subMinutes(10)
        ]);

        $result = $session->cancel();
        
        $this->assertTrue($result);
        $this->assertEquals('cancelled', $session->fresh()->status);
        $this->assertNotNull($session->fresh()->completed_at);
        $this->assertNotNull($session->fresh()->actual_duration);
    }

    public function test_calculates_efficiency_correctly()
    {
        $user = User::factory()->create();
        
        $session = PomodoroSession::create([
            'user_id' => $user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'actual_duration' => 20,
            'status' => 'completed',
            'started_at' => Carbon::now()
        ]);

        $efficiency = $session->calculateEfficiency();
        
        $this->assertEquals(80.0, $efficiency);
    }

    public function test_formats_duration_correctly()
    {
        $user = User::factory()->create();
        
        $session = PomodoroSession::create([
            'user_id' => $user->id,
            'session_type' => 'work',
            'planned_duration' => 65,
            'status' => 'active',
            'started_at' => Carbon::now()
        ]);

        $formatted = $session->formatted_planned_duration;
        
        $this->assertEquals('1 jam 5 menit', $formatted);
    }

    public function test_session_has_user_relationship()
    {
        $user = User::factory()->create();
        
        $session = PomodoroSession::create([
            'user_id' => $user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'status' => 'active',
            'started_at' => Carbon::now()
        ]);

        $this->assertInstanceOf(User::class, $session->user);
        $this->assertEquals($user->id, $session->user->id);
    }

    public function test_active_scope_works()
    {
        $user = User::factory()->create();
        
        PomodoroSession::create([
            'user_id' => $user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'status' => 'active',
            'started_at' => Carbon::now()
        ]);
        
        PomodoroSession::create([
            'user_id' => $user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'status' => 'completed',
            'started_at' => Carbon::now()
        ]);

        $activeSessions = PomodoroSession::active()->count();
        
        $this->assertEquals(1, $activeSessions);
    }

    public function test_today_scope_works()
    {
        $user = User::factory()->create();
        
        PomodoroSession::create([
            'user_id' => $user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'status' => 'active',
            'started_at' => Carbon::today()
        ]);
        
        PomodoroSession::create([
            'user_id' => $user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'status' => 'completed',
            'started_at' => Carbon::yesterday()
        ]);

        $todaySessions = PomodoroSession::today()->count();
        
        $this->assertEquals(1, $todaySessions);
    }
}