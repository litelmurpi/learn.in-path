<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PomodoroSession;
use App\Models\UserPomodoroSetting;
use App\Models\StudyLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class PomodoroController extends Controller
{
    /**
     * Start a new pomodoro session
     */
    public function start(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'session_type' => 'required|in:work,short_break,long_break',
                'planned_duration' => 'nullable|integer|min:1|max:120',
                'study_log_id' => 'nullable|integer|exists:study_logs,id',
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $userId = auth()->id();

            // Check if user already has an active session
            $activeSession = PomodoroSession::where('user_id', $userId)
                ->whereIn('status', ['active', 'paused'])
                ->first();

            if ($activeSession) {
                return response()->json([
                    'success' => false,
                    'message' => 'You already have an active session. Please complete or cancel it first.',
                    'data' => ['active_session' => $activeSession]
                ], 409);
            }

            // Get user's pomodoro settings
            $settings = UserPomodoroSetting::getOrCreateForUser($userId);
            
            // Determine planned duration based on session type and user settings
            $sessionType = $request->session_type;
            $plannedDuration = $request->planned_duration;
            
            if (!$plannedDuration) {
                switch ($sessionType) {
                    case 'work':
                        $plannedDuration = $settings->work_duration;
                        break;
                    case 'short_break':
                        $plannedDuration = $settings->short_break_duration;
                        break;
                    case 'long_break':
                        $plannedDuration = $settings->long_break_duration;
                        break;
                }
            }

            // Validate study_log ownership if provided
            if ($request->study_log_id) {
                $studyLog = StudyLog::where('id', $request->study_log_id)
                    ->where('user_id', $userId)
                    ->first();
                
                if (!$studyLog) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Study log not found or not owned by user'
                    ], 404);
                }
            }

            // Create new session
            $session = PomodoroSession::create([
                'user_id' => $userId,
                'study_log_id' => $request->study_log_id,
                'session_type' => $sessionType,
                'planned_duration' => $plannedDuration,
                'status' => 'active',
                'started_at' => Carbon::now(),
                'notes' => $request->notes
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Session started successfully',
                'data' => [
                    'session' => $session->load('studyLog')
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to start session',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Pause current session
     */
    public function pause(Request $request, int $id): JsonResponse
    {
        try {
            $session = PomodoroSession::where('id', $id)
                ->where('user_id', auth()->id())
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            if (!$session->isActive()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only active sessions can be paused'
                ], 400);
            }

            $session->pause();

            return response()->json([
                'success' => true,
                'message' => 'Session paused successfully',
                'data' => ['session' => $session->fresh()]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to pause session',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resume paused session
     */
    public function resume(Request $request, int $id): JsonResponse
    {
        try {
            $session = PomodoroSession::where('id', $id)
                ->where('user_id', auth()->id())
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            if (!$session->isPaused()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only paused sessions can be resumed'
                ], 400);
            }

            $session->resume();

            return response()->json([
                'success' => true,
                'message' => 'Session resumed successfully',
                'data' => ['session' => $session->fresh()]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to resume session',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Complete current session
     */
    public function complete(Request $request, int $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'notes' => 'nullable|string|max:1000',
                'create_study_log' => 'nullable|boolean',
                'study_topic' => 'nullable|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $session = PomodoroSession::where('id', $id)
                ->where('user_id', auth()->id())
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            if (!($session->isActive() || $session->isPaused())) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only active or paused sessions can be completed'
                ], 400);
            }

            // Update notes if provided
            if ($request->notes) {
                $session->notes = $request->notes;
            }

            $session->complete();

            // Create study log if requested and it's a work session
            $studyLog = null;
            if ($request->create_study_log && $session->session_type === 'work' && $session->actual_duration > 0) {
                $studyLog = StudyLog::create([
                    'user_id' => auth()->id(),
                    'topic' => $request->study_topic ?? 'Pomodoro Study Session',
                    'duration_minutes' => $session->actual_duration,
                    'log_date' => Carbon::parse($session->started_at)->toDateString(),
                    'notes' => $session->notes ?? 'Created from Pomodoro session'
                ]);

                // Link the study log to the session
                $session->study_log_id = $studyLog->id;
                $session->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Session completed successfully',
                'data' => [
                    'session' => $session->fresh()->load('studyLog'),
                    'study_log' => $studyLog
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete session',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel current session
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        try {
            $session = PomodoroSession::where('id', $id)
                ->where('user_id', auth()->id())
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            if (!($session->isActive() || $session->isPaused())) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only active or paused sessions can be cancelled'
                ], 400);
            }

            $session->cancel();

            return response()->json([
                'success' => true,
                'message' => 'Session cancelled successfully',
                'data' => ['session' => $session->fresh()]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel session',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current active session
     */
    public function active(): JsonResponse
    {
        try {
            $session = PomodoroSession::where('user_id', auth()->id())
                ->whereIn('status', ['active', 'paused'])
                ->with('studyLog')
                ->first();

            return response()->json([
                'success' => true,
                'data' => ['session' => $session]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active session',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's session history
     */
    public function history(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1|max:100',
                'session_type' => 'nullable|in:work,short_break,long_break',
                'status' => 'nullable|in:active,completed,cancelled,paused',
                'from_date' => 'nullable|date',
                'to_date' => 'nullable|date|after_or_equal:from_date'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $query = PomodoroSession::where('user_id', auth()->id())
                ->with('studyLog')
                ->orderBy('started_at', 'desc');

            // Apply filters
            if ($request->session_type) {
                $query->where('session_type', $request->session_type);
            }

            if ($request->status) {
                $query->where('status', $request->status);
            }

            if ($request->from_date) {
                $query->whereDate('started_at', '>=', $request->from_date);
            }

            if ($request->to_date) {
                $query->whereDate('started_at', '<=', $request->to_date);
            }

            $perPage = $request->per_page ?? 20;
            $sessions = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $sessions
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve session history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pomodoro statistics
     */
    public function statistics(): JsonResponse
    {
        try {
            $userId = auth()->id();
            $userStats = auth()->user()->getPomodoroStatistics();

            $today = Carbon::today();
            $thisWeek = [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()];
            $thisMonth = [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()];

            $stats = [
                'overview' => $userStats,
                'today' => [
                    'total_sessions' => PomodoroSession::where('user_id', $userId)->today()->count(),
                    'completed_sessions' => PomodoroSession::where('user_id', $userId)->today()->completed()->count(),
                    'focus_time' => PomodoroSession::where('user_id', $userId)->today()->completed()->where('session_type', 'work')->sum('actual_duration')
                ],
                'this_week' => [
                    'total_sessions' => PomodoroSession::where('user_id', $userId)->thisWeek()->count(),
                    'completed_sessions' => PomodoroSession::where('user_id', $userId)->thisWeek()->completed()->count(),
                    'focus_time' => PomodoroSession::where('user_id', $userId)->thisWeek()->completed()->where('session_type', 'work')->sum('actual_duration')
                ],
                'this_month' => [
                    'total_sessions' => PomodoroSession::where('user_id', $userId)->thisMonth()->count(),
                    'completed_sessions' => PomodoroSession::where('user_id', $userId)->thisMonth()->completed()->count(),
                    'focus_time' => PomodoroSession::where('user_id', $userId)->thisMonth()->completed()->where('session_type', 'work')->sum('actual_duration')
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's pomodoro settings
     */
    public function getSettings(): JsonResponse
    {
        try {
            $settings = UserPomodoroSetting::getOrCreateForUser(auth()->id());

            return response()->json([
                'success' => true,
                'data' => ['settings' => $settings]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save user's pomodoro settings
     */
    public function saveSettings(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'work_duration' => 'required|integer|min:1|max:120',
                'short_break_duration' => 'required|integer|min:1|max:60',
                'long_break_duration' => 'required|integer|min:1|max:120',
                'sessions_before_long_break' => 'required|integer|min:1|max:10',
                'auto_start_breaks' => 'required|boolean',
                'notifications_enabled' => 'required|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $settings = UserPomodoroSetting::updateOrCreate(
                ['user_id' => auth()->id()],
                $request->validated()
            );

            return response()->json([
                'success' => true,
                'message' => 'Settings saved successfully',
                'data' => ['settings' => $settings]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}