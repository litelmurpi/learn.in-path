<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\PomodoroSession;
use App\Models\UserPomodoroSetting;
use App\Models\StudyLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Carbon\Carbon;

class PomodoroApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a user and authenticate
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_can_start_pomodoro_session()
    {
        $response = $this->postJson('/api/pomodoro/start', [
            'session_type' => 'work',
            'planned_duration' => 25,
            'notes' => 'Test session'
        ]);

        $response->assertStatus(201)
                ->assertJson([
                    'success' => true,
                    'message' => 'Session started successfully'
                ])
                ->assertJsonStructure([
                    'data' => [
                        'session' => [
                            'id',
                            'session_type',
                            'planned_duration',
                            'status',
                            'started_at'
                        ]
                    ]
                ]);

        $this->assertDatabaseHas('pomodoro_sessions', [
            'user_id' => $this->user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'status' => 'active'
        ]);
    }

    public function test_cannot_start_session_when_one_is_active()
    {
        // Create an active session
        PomodoroSession::create([
            'user_id' => $this->user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'status' => 'active',
            'started_at' => Carbon::now()
        ]);

        $response = $this->postJson('/api/pomodoro/start', [
            'session_type' => 'work',
            'planned_duration' => 25
        ]);

        $response->assertStatus(409)
                ->assertJson([
                    'success' => false,
                    'message' => 'You already have an active session. Please complete or cancel it first.'
                ]);
    }

    public function test_can_pause_active_session()
    {
        $session = PomodoroSession::create([
            'user_id' => $this->user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'status' => 'active',
            'started_at' => Carbon::now()
        ]);

        $response = $this->putJson("/api/pomodoro/{$session->id}/pause");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Session paused successfully'
                ]);

        $this->assertDatabaseHas('pomodoro_sessions', [
            'id' => $session->id,
            'status' => 'paused'
        ]);
    }

    public function test_can_resume_paused_session()
    {
        $session = PomodoroSession::create([
            'user_id' => $this->user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'status' => 'paused',
            'started_at' => Carbon::now()
        ]);

        $response = $this->putJson("/api/pomodoro/{$session->id}/resume");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Session resumed successfully'
                ]);

        $this->assertDatabaseHas('pomodoro_sessions', [
            'id' => $session->id,
            'status' => 'active'
        ]);
    }

    public function test_can_complete_session()
    {
        $session = PomodoroSession::create([
            'user_id' => $this->user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'status' => 'active',
            'started_at' => Carbon::now()->subMinutes(20)
        ]);

        $response = $this->putJson("/api/pomodoro/{$session->id}/complete", [
            'notes' => 'Completed successfully',
            'create_study_log' => true,
            'study_topic' => 'Mathematics'
        ]);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Session completed successfully'
                ]);

        $this->assertDatabaseHas('pomodoro_sessions', [
            'id' => $session->id,
            'status' => 'completed'
        ]);

        // Check if study log was created
        $this->assertDatabaseHas('study_logs', [
            'user_id' => $this->user->id,
            'topic' => 'Mathematics'
        ]);
    }

    public function test_can_cancel_session()
    {
        $session = PomodoroSession::create([
            'user_id' => $this->user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'status' => 'active',
            'started_at' => Carbon::now()->subMinutes(10)
        ]);

        $response = $this->putJson("/api/pomodoro/{$session->id}/cancel");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Session cancelled successfully'
                ]);

        $this->assertDatabaseHas('pomodoro_sessions', [
            'id' => $session->id,
            'status' => 'cancelled'
        ]);
    }

    public function test_can_get_active_session()
    {
        $session = PomodoroSession::create([
            'user_id' => $this->user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'status' => 'active',
            'started_at' => Carbon::now()
        ]);

        $response = $this->getJson('/api/pomodoro/active');

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true
                ])
                ->assertJsonStructure([
                    'data' => [
                        'session' => [
                            'id',
                            'session_type',
                            'status'
                        ]
                    ]
                ]);
    }

    public function test_can_get_session_history()
    {
        // Create multiple sessions
        PomodoroSession::create([
            'user_id' => $this->user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'status' => 'completed',
            'started_at' => Carbon::now()->subDay()
        ]);

        PomodoroSession::create([
            'user_id' => $this->user->id,
            'session_type' => 'short_break',
            'planned_duration' => 5,
            'status' => 'completed',
            'started_at' => Carbon::now()->subHours(2)
        ]);

        $response = $this->getJson('/api/pomodoro/history');

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true
                ])
                ->assertJsonStructure([
                    'data' => [
                        'data' => [
                            '*' => [
                                'id',
                                'session_type',
                                'status',
                                'started_at'
                            ]
                        ],
                        'current_page',
                        'total'
                    ]
                ]);
    }

    public function test_can_get_statistics()
    {
        // Create some completed sessions
        PomodoroSession::create([
            'user_id' => $this->user->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'actual_duration' => 25,
            'status' => 'completed',
            'started_at' => Carbon::today()
        ]);

        $response = $this->getJson('/api/pomodoro/statistics');

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true
                ])
                ->assertJsonStructure([
                    'data' => [
                        'overview' => [
                            'total_sessions',
                            'total_focus_time',
                            'completion_rate'
                        ],
                        'today' => [
                            'total_sessions',
                            'completed_sessions',
                            'focus_time'
                        ],
                        'this_week',
                        'this_month'
                    ]
                ]);
    }

    public function test_can_get_user_settings()
    {
        $response = $this->getJson('/api/pomodoro/settings');

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true
                ])
                ->assertJsonStructure([
                    'data' => [
                        'settings' => [
                            'work_duration',
                            'short_break_duration',
                            'long_break_duration',
                            'sessions_before_long_break',
                            'auto_start_breaks',
                            'notifications_enabled'
                        ]
                    ]
                ]);
    }

    public function test_can_save_user_settings()
    {
        $settings = [
            'work_duration' => 30,
            'short_break_duration' => 10,
            'long_break_duration' => 20,
            'sessions_before_long_break' => 3,
            'auto_start_breaks' => true,
            'notifications_enabled' => false
        ];

        $response = $this->postJson('/api/pomodoro/settings', $settings);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Settings saved successfully'
                ]);

        $this->assertDatabaseHas('user_pomodoro_settings', [
            'user_id' => $this->user->id,
            'work_duration' => 30,
            'short_break_duration' => 10
        ]);
    }

    public function test_validates_session_start_request()
    {
        $response = $this->postJson('/api/pomodoro/start', [
            'session_type' => 'invalid_type',
            'planned_duration' => 200 // too long
        ]);

        $response->assertStatus(422)
                ->assertJson([
                    'success' => false,
                    'message' => 'Validation failed'
                ])
                ->assertJsonValidationErrors(['session_type', 'planned_duration']);
    }

    public function test_validates_settings_request()
    {
        $response = $this->postJson('/api/pomodoro/settings', [
            'work_duration' => 0, // too short
            'short_break_duration' => 200, // too long
            'auto_start_breaks' => 'not_boolean'
        ]);

        $response->assertStatus(422)
                ->assertJson([
                    'success' => false,
                    'message' => 'Validation failed'
                ])
                ->assertJsonValidationErrors(['work_duration', 'short_break_duration', 'auto_start_breaks']);
    }

    public function test_cannot_access_other_users_sessions()
    {
        $otherUser = User::factory()->create();
        
        $session = PomodoroSession::create([
            'user_id' => $otherUser->id,
            'session_type' => 'work',
            'planned_duration' => 25,
            'status' => 'active',
            'started_at' => Carbon::now()
        ]);

        $response = $this->putJson("/api/pomodoro/{$session->id}/pause");

        $response->assertStatus(404)
                ->assertJson([
                    'success' => false,
                    'message' => 'Session not found'
                ]);
    }
}