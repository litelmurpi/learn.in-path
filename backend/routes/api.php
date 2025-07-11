<?php

use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\StudyLogController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
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
    Route::get('/study-logs/by-date', [StudyLogController::class, 'getByDate']);
    Route::get('/study-logs/{id}', [StudyLogController::class, 'show']);
    Route::put('/study-logs/{id}', [StudyLogController::class, 'update']);
    Route::delete('/study-logs/{id}', [StudyLogController::class, 'destroy']);

    // Analytics routes
    Route::get('/analytics', [AnalyticsController::class, 'index']);
    Route::get('/analytics/export', [AnalyticsController::class, 'export']);
});