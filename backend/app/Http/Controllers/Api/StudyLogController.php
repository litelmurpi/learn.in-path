<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudyLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class StudyLogController extends Controller
{
    /**
     * Set timezone untuk aplikasi
     */
    private $timezone = 'Asia/Jakarta';

    /**
     * Format tanggal yang digunakan untuk response
     */
    private function formatLogDate($log)
    {
        // Pastikan log_date selalu dalam format Y-m-d tanpa timezone conversion
        if ($log->log_date instanceof Carbon) {
            $log->log_date = $log->log_date->format('Y-m-d');
        }
        
        // Tambahkan formatted date untuk display
        $log->log_date_formatted = $this->formatDateForDisplay($log->log_date);
        
        return $log;
    }

    /**
     * Format tanggal untuk display
     */
    private function formatDateForDisplay($dateString)
    {
        $monthNames = [
            '01' => 'Jan', '02' => 'Feb', '03' => 'Mar', '04' => 'Apr',
            '05' => 'Mei', '06' => 'Jun', '07' => 'Jul', '08' => 'Agu',
            '09' => 'Sep', '10' => 'Okt', '11' => 'Nov', '12' => 'Des'
        ];
        
        list($year, $month, $day) = explode('-', $dateString);
        return intval($day) . ' ' . $monthNames[$month] . ' ' . $year;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 10);
            
            $studyLogs = StudyLog::with(['user'])
                ->where('user_id', auth()->id())
                ->orderBy('log_date', 'desc')
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            // Transform collection untuk memastikan format tanggal konsisten
            $studyLogs->getCollection()->transform(function ($log) {
                return $this->formatLogDate($log);
            });

            return response()->json([
                'success' => true,
                'message' => 'Study logs retrieved successfully',
                'data' => $studyLogs
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve study logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Get today's date in Asia/Jakarta timezone
            $today = Carbon::now($this->timezone)->format('Y-m-d');
            
            $validator = Validator::make($request->all(), [
                'topic' => 'required|string|max:255',
                'duration_minutes' => 'required|integer|min:1|max:1440',
                'log_date' => [
                    'required',
                    'date',
                    'date_format:Y-m-d',
                    'before_or_equal:' . $today
                ],
                'notes' => 'nullable|string|max:1000'
            ], [
                'log_date.before_or_equal' => 'Tidak dapat mencatat sesi untuk tanggal masa depan.',
                'duration_minutes.max' => 'Durasi maksimal adalah 24 jam (1440 menit).'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if user already has logs for this date exceeding 24 hours
            $existingMinutes = StudyLog::where('user_id', auth()->id())
                ->where('log_date', $request->log_date)
                ->sum('duration_minutes');
            
            $totalMinutes = $existingMinutes + $request->duration_minutes;
            
            if ($totalMinutes > 1440) {
                return response()->json([
                    'success' => false,
                    'message' => 'Total durasi belajar untuk tanggal ini melebihi 24 jam',
                    'errors' => [
                        'duration_minutes' => ['Total durasi untuk hari ini sudah ' . $existingMinutes . ' menit. Maksimal total adalah 1440 menit (24 jam).']
                    ]
                ], 422);
            }

            $data = $request->all();
            $data['user_id'] = auth()->id();
            
            // Ensure log_date is stored as date only (no time component)
            $data['log_date'] = Carbon::parse($request->log_date)->format('Y-m-d');
            
            $studyLog = StudyLog::create($data);
            
            // Format the response
            $studyLog = $this->formatLogDate($studyLog->load(['user']));

            return response()->json([
                'success' => true,
                'message' => 'Study log created successfully',
                'data' => $studyLog
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create study log',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $studyLog = StudyLog::with(['user'])
                ->where('user_id', auth()->id())
                ->find($id);

            if (!$studyLog) {
                return response()->json([
                    'success' => false,
                    'message' => 'Study log not found'
                ], 404);
            }

            // Format the response
            $studyLog = $this->formatLogDate($studyLog);

            return response()->json([
                'success' => true,
                'message' => 'Study log retrieved successfully',
                'data' => $studyLog
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve study log',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $studyLog = StudyLog::where('user_id', auth()->id())->find($id);

            if (!$studyLog) {
                return response()->json([
                    'success' => false,
                    'message' => 'Study log not found or you do not have permission to update it'
                ], 404);
            }

            // Get today's date in Asia/Jakarta timezone
            $today = Carbon::now($this->timezone)->format('Y-m-d');

            $validator = Validator::make($request->all(), [
                'topic' => 'sometimes|required|string|max:255',
                'duration_minutes' => 'sometimes|required|integer|min:1|max:1440',
                'log_date' => [
                    'sometimes',
                    'required',
                    'date',
                    'date_format:Y-m-d',
                    'before_or_equal:' . $today
                ],
                'notes' => 'nullable|string|max:1000'
            ], [
                'log_date.before_or_equal' => 'Tidak dapat mencatat sesi untuk tanggal masa depan.',
                'duration_minutes.max' => 'Durasi maksimal adalah 24 jam (1440 menit).'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // If duration or date is being updated, check total duration for that date
            if ($request->has('duration_minutes') || $request->has('log_date')) {
                $checkDate = $request->get('log_date', $studyLog->log_date);
                $newDuration = $request->get('duration_minutes', $studyLog->duration_minutes);
                
                $existingMinutes = StudyLog::where('user_id', auth()->id())
                    ->where('log_date', $checkDate)
                    ->where('id', '!=', $id)
                    ->sum('duration_minutes');
                
                $totalMinutes = $existingMinutes + $newDuration;
                
                if ($totalMinutes > 1440) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Total durasi belajar untuk tanggal ini melebihi 24 jam',
                        'errors' => [
                            'duration_minutes' => ['Total durasi untuk hari ini akan menjadi ' . $totalMinutes . ' menit. Maksimal total adalah 1440 menit (24 jam).']
                        ]
                    ], 422);
                }
            }

            $updateData = $request->all();
            
            // Ensure log_date is stored as date only if it's being updated
            if ($request->has('log_date')) {
                $updateData['log_date'] = Carbon::parse($request->log_date)->format('Y-m-d');
            }
            
            $studyLog->update($updateData);
            
            // Reload and format the response
            $studyLog = $this->formatLogDate($studyLog->fresh()->load(['user']));

            return response()->json([
                'success' => true,
                'message' => 'Study log updated successfully',
                'data' => $studyLog
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update study log',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $studyLog = StudyLog::where('user_id', auth()->id())->find($id);

            if (!$studyLog) {
                return response()->json([
                    'success' => false,
                    'message' => 'Study log not found or you do not have permission to delete it'
                ], 404);
            }

            $studyLog->delete();

            return response()->json([
                'success' => true,
                'message' => 'Study log deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete study log',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get study logs for a specific date
     */
    public function getByDate(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'date' => 'required|date|date_format:Y-m-d'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $logs = StudyLog::where('user_id', auth()->id())
                ->where('log_date', $request->date)
                ->orderBy('created_at', 'desc')
                ->get();

            // Format each log
            $logs->transform(function ($log) {
                return $this->formatLogDate($log);
            });

            $totalMinutes = $logs->sum('duration_minutes');
            $sessionCount = $logs->count();

            return response()->json([
                'success' => true,
                'message' => 'Study logs for date retrieved successfully',
                'data' => [
                    'logs' => $logs,
                    'summary' => [
                        'total_minutes' => $totalMinutes,
                        'total_hours' => round($totalMinutes / 60, 2),
                        'session_count' => $sessionCount,
                        'date' => $request->date,
                        'date_formatted' => $this->formatDateForDisplay($request->date)
                    ]
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve study logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}