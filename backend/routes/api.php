<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\PomodoroController;
use App\Http\Controllers\Api\StudyLogController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // User route
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Dashboard stats route
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/heatmap', [DashboardController::class, 'heatmap']);
    
    // Study Log routes
    Route::get('/study-logs', [StudyLogController::class, 'index']);
    Route::post('/study-logs', [StudyLogController::class, 'store']);
    Route::get('/study-logs/{id}', [StudyLogController::class, 'show']);
    Route::put('/study-logs/{id}', [StudyLogController::class, 'update']);
    Route::delete('/study-logs/{id}', [StudyLogController::class, 'destroy']);

    Route::prefix('pomodoro')->group(function () {
        // Session CRUD operations
        Route::get('/', [PomodoroController::class, 'index']); // Get all sessions (paginated)
        Route::post('/', [PomodoroController::class, 'store']); // Start new session
        Route::get('/{id}', [PomodoroController::class, 'show']); // Get specific session details
        Route::put('/{id}', [PomodoroController::class, 'update']); // Update session (pause/resume/complete/cancel)
        Route::delete('/{id}', [PomodoroController::class, 'destroy']); // Delete session
        
        // Special endpoints
        Route::get('/active/current', [PomodoroController::class, 'getActiveSession']); // Get current active session
        Route::get('/stats/summary', [PomodoroController::class, 'getStats']); // Get statistics (today/week/month)
        Route::get('/next/suggestion', [PomodoroController::class, 'getNextSession']); // Get next session type suggestion
        
        // Settings management
        Route::get('/settings/user', [PomodoroController::class, 'getSettings']); // Get user's Pomodoro settings
        Route::put('/settings/user', [PomodoroController::class, 'updateSettings']); // Update user's settings
    });
});
