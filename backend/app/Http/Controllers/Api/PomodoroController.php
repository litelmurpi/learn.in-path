<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PomodoroSession;
use App\Models\PomodoroSettings;
use App\Models\StudyLog;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PomodoroController extends Controller
{
    /**
     * Get all sessions for authenticated user (with pagination)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $userId = auth()->id();
            $perPage = $request->get('per_page', 15);
            
            $sessions = PomodoroSession::where('user_id', $userId)
                ->with(['studyLog'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Pomodoro sessions retrieved successfully',
                'data' => $sessions
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve sessions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Start a new Pomodoro session
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            // Check if user has active session
            $activeSession = PomodoroSession::getActiveSession($userId);
            if ($activeSession) {
                return response()->json([
                    'success' => false,
                    'message' => 'You already have an active session',
                    'data' => $activeSession
                ], 409);
            }

            // Validate request
            $validator = Validator::make($request->all(), [
                'session_type' => 'required|in:work,short_break,long_break',
                'study_log_id' => 'nullable|exists:study_logs,id',
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get user's settings
            $settings = PomodoroSettings::getOrCreateForUser($userId);
            
            // Determine session duration based on type
            $sessionType = $request->session_type;
            $plannedDuration = $settings->getDurationForSessionType($sessionType);

            // Create new session
            $session = PomodoroSession::create([
                'user_id' => $userId,
                'study_log_id' => $request->study_log_id,
                'session_type' => $sessionType,
                'planned_duration' => $plannedDuration,
                'status' => PomodoroSession::STATUS_ACTIVE,
                'started_at' => Carbon::now(),
                'notes' => $request->notes
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pomodoro session started successfully',
                'data' => $session->load(['studyLog'])
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
     * Get specific session details
     */
    public function show(string $id): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            $session = PomodoroSession::where('id', $id)
                ->where('user_id', $userId)
                ->with(['studyLog'])
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            // Add real-time data
            $sessionData = $session->toArray();
            $sessionData['remaining_time'] = $session->remaining_time;
            $sessionData['elapsed_time'] = $session->elapsed_time;
            $sessionData['progress_percentage'] = $session->progress_percentage;

            return response()->json([
                'success' => true,
                'message' => 'Session retrieved successfully',
                'data' => $sessionData
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve session',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update session (pause, resume, complete, cancel)
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            $session = PomodoroSession::where('id', $id)
                ->where('user_id', $userId)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'action' => 'required|in:pause,resume,complete,cancel',
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $action = $request->action;
            $message = '';

            switch ($action) {
                case 'pause':
                    if (!$session->is_active) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Cannot pause non-active session'
                        ], 400);
                    }
                    $session->pause();
                    $message = 'Session paused successfully';
                    break;

                case 'resume':
                    if (!$session->is_paused) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Cannot resume non-paused session'
                        ], 400);
                    }
                    $session->resume();
                    $message = 'Session resumed successfully';
                    break;

                case 'complete':
                    if ($session->is_completed) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Session already completed'
                        ], 400);
                    }
                    $session->complete();
                    $message = 'Session completed successfully';
                    
                    // Auto-create study log for work sessions
                    if ($session->session_type === PomodoroSession::TYPE_WORK && !$session->study_log_id) {
                        $this->createStudyLogFromSession($session);
                    }
                    break;

                case 'cancel':
                    if ($session->is_completed) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Cannot cancel completed session'
                        ], 400);
                    }
                    $session->cancel();
                    $message = 'Session cancelled successfully';
                    break;
            }

            // Update notes if provided
            if ($request->filled('notes')) {
                $session->update(['notes' => $request->notes]);
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $session->fresh()->load(['studyLog'])
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update session',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete session (soft delete with cancel status)
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            $session = PomodoroSession::where('id', $id)
                ->where('user_id', $userId)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            // Cancel session if active, then delete
            if ($session->is_active || $session->is_paused) {
                $session->cancel();
            }

            $session->delete();

            return response()->json([
                'success' => true,
                'message' => 'Session deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete session',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get active session for authenticated user
     */
    public function getActiveSession(): JsonResponse
    {
        try {
            $userId = auth()->id();
            $activeSession = PomodoroSession::getActiveSession($userId);

            if (!$activeSession) {
                return response()->json([
                    'success' => true,
                    'message' => 'No active session found',
                    'data' => null
                ], 200);
            }

            // Add real-time data
            $sessionData = $activeSession->load(['studyLog'])->toArray();
            $sessionData['remaining_time'] = $activeSession->remaining_time;
            $sessionData['elapsed_time'] = $activeSession->elapsed_time;
            $sessionData['progress_percentage'] = $activeSession->progress_percentage;

            return response()->json([
                'success' => true,
                'message' => 'Active session retrieved successfully',
                'data' => $sessionData
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get active session',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get session statistics
     */
    public function getStats(Request $request): JsonResponse
    {
        try {
            $userId = auth()->id();
            $period = $request->get('period', 'today'); // today, week, month

            $stats = [];
            
            switch ($period) {
                case 'today':
                    $stats = PomodoroSession::getTodayStats($userId);
                    break;
                case 'week':
                    $stats = PomodoroSession::getWeeklyStats($userId);
                    break;
                case 'month':
                    $stats = $this->getMonthlyStats($userId);
                    break;
                default:
                    $stats = PomodoroSession::getTodayStats($userId);
            }

            return response()->json([
                'success' => true,
                'message' => 'Statistics retrieved successfully',
                'data' => [
                    'period' => $period,
                    'stats' => $stats
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's Pomodoro settings
     */
    public function getSettings(): JsonResponse
    {
        try {
            $userId = auth()->id();
            $settings = PomodoroSettings::getOrCreateForUser($userId);

            return response()->json([
                'success' => true,
                'message' => 'Settings retrieved successfully',
                'data' => $settings
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user's Pomodoro settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            $validator = Validator::make(
                $request->all(), 
                PomodoroSettings::validationRules(),
                PomodoroSettings::validationMessages()
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $settings = PomodoroSettings::getOrCreateForUser($userId);
            $settings->update($request->only([
                'work_duration',
                'short_break_duration', 
                'long_break_duration',
                'long_break_interval',
                'auto_start_breaks',
                'auto_start_work',
                'sound_enabled',
                'notification_sound'
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Settings updated successfully',
                'data' => $settings->fresh()
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get suggested next session type
     */
    public function getNextSession(): JsonResponse
    {
        try {
            $userId = auth()->id();
            $settings = PomodoroSettings::getOrCreateForUser($userId);
            
            // Count completed work sessions today
            $completedWorkSessions = PomodoroSession::where('user_id', $userId)
                ->today()
                ->completed()
                ->workSessions()
                ->count();

            $nextType = $settings->getNextBreakType($completedWorkSessions);
            $duration = $settings->getDurationForSessionType($nextType);

            return response()->json([
                'success' => true,
                'message' => 'Next session suggestion retrieved',
                'data' => [
                    'suggested_type' => $nextType,
                    'duration' => $duration,
                    'completed_work_sessions_today' => $completedWorkSessions,
                    'next_long_break_at' => $settings->long_break_interval
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get next session suggestion',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Private helper methods
     */
    private function getMonthlyStats($userId): array
    {
        $sessions = PomodoroSession::where('user_id', $userId)
            ->thisMonth()
            ->completed()
            ->get();

        return [
            'total_sessions' => $sessions->count(),
            'work_sessions' => $sessions->where('session_type', PomodoroSession::TYPE_WORK)->count(),
            'total_time' => $sessions->sum('actual_duration'),
            'work_time' => $sessions->where('session_type', PomodoroSession::TYPE_WORK)->sum('actual_duration'),
            'average_per_day' => $sessions->count() > 0 ? round($sessions->sum('actual_duration') / Carbon::now()->day) : 0,
        ];
    }

    private function createStudyLogFromSession(PomodoroSession $session): void
    {
        try {
            $studyLog = StudyLog::create([
                'user_id' => $session->user_id,
                'title' => 'Pomodoro Session - ' . Carbon::now()->format('H:i'),
                'description' => $session->notes ?? 'Completed Pomodoro work session',
                'category' => 'Pomodoro',
                'duration' => $session->actual_duration ?? $session->planned_duration,
                'date' => $session->started_at->format('Y-m-d')
            ]);

            // Link session to study log
            $session->update(['study_log_id' => $studyLog->id]);

        } catch (\Exception $e) {
            // Log error but don't fail the session completion
            Log::error('Failed to create study log from session: ' . $e->getMessage());
        }
    }
}