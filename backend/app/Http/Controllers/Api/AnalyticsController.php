<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudyLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    private $timezone = 'Asia/Jakarta';

    /**
     * Get analytics data based on period
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $period = $request->get('period', 'month');
            $userId = auth()->id();
            
            // Calculate date range
            $endDate = Carbon::now($this->timezone);
            $startDate = $this->getStartDate($period);
            
            // Get all logs in period
            $logs = StudyLog::where('user_id', $userId)
                ->whereBetween('log_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
                ->orderBy('log_date', 'desc')
                ->get();
            
            // Get analytics data
            $analytics = [
                'period' => $period,
                'date_range' => [
                    'start' => $startDate->format('Y-m-d'),
                    'end' => $endDate->format('Y-m-d')
                ],
                'overview' => $this->getOverviewStats($logs, $startDate, $endDate),
                'daily_chart' => $this->getDailyChartData($userId, $startDate, $endDate),
                'topic_distribution' => $this->getTopicDistribution($logs),
                'weekly_pattern' => $this->getWeeklyPattern($logs),
                'time_of_day' => $this->getTimeOfDayDistribution($logs),
                'insights' => $this->generateInsights($logs, $period)
            ];
            
            return response()->json([
                'success' => true,
                'data' => $analytics
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load analytics data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Calculate start date based on period
     */
    private function getStartDate($period): Carbon
    {
        $now = Carbon::now($this->timezone);
        
        switch ($period) {
            case 'week':
                return $now->copy()->subDays(7);
            case 'month':
                return $now->copy()->subDays(30);
            case '3months':
                return $now->copy()->subMonths(3);
            case 'year':
                return $now->copy()->subYear();
            default:
                return $now->copy()->subDays(30);
        }
    }
    
    /**
     * Get overview statistics
     */
    private function getOverviewStats($logs, $startDate, $endDate): array
    {
        $totalMinutes = $logs->sum('duration_minutes');
        $totalHours = round($totalMinutes / 60, 1);
        
        // Calculate unique days studied
        $uniqueDays = $logs->pluck('log_date')->unique()->count();
        
        // Calculate average per day
        $avgDaily = $uniqueDays > 0 ? round($totalMinutes / $uniqueDays) : 0;
        
        // Calculate consistency (percentage of days studied in period)
        $totalDays = $startDate->diffInDays($endDate) + 1;
        $consistency = $totalDays > 0 ? round(($uniqueDays / $totalDays) * 100) : 0;
        
        return [
            'total_hours' => $totalHours,
            'total_minutes' => $totalMinutes,
            'avg_daily_minutes' => $avgDaily,
            'consistency_percentage' => $consistency,
            'unique_days' => $uniqueDays,
            'total_sessions' => $logs->count()
        ];
    }
    
    /**
     * Get daily chart data
     */
    private function getDailyChartData($userId, $startDate, $endDate): array
    {
        $dailyData = [];
        $currentDate = $startDate->copy();
        
        // Initialize all dates in range
        while ($currentDate <= $endDate) {
            $dailyData[$currentDate->format('Y-m-d')] = 0;
            $currentDate->addDay();
        }
        
        // Get aggregated data from database
        $dbData = StudyLog::where('user_id', $userId)
            ->whereBetween('log_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->groupBy('log_date')
            ->select('log_date', DB::raw('SUM(duration_minutes) as total_minutes'))
            ->pluck('total_minutes', 'log_date')
            ->toArray();
        
        // Merge with initialized data
        foreach ($dbData as $date => $minutes) {
            $dailyData[$date] = $minutes;
        }
        
        // Format for chart
        $labels = [];
        $data = [];
        foreach ($dailyData as $date => $minutes) {
            $labels[] = Carbon::parse($date)->format('d M');
            $data[] = $minutes;
        }
        
        return [
            'labels' => $labels,
            'data' => $data,
            'total' => array_sum($data)
        ];
    }
    
    /**
     * Get topic distribution
     */
    private function getTopicDistribution($logs): array
    {
        $topicData = [];
        
        foreach ($logs as $log) {
            if (!isset($topicData[$log->topic])) {
                $topicData[$log->topic] = 0;
            }
            $topicData[$log->topic] += $log->duration_minutes;
        }
        
        // Sort by minutes and take top 5
        arsort($topicData);
        $topicData = array_slice($topicData, 0, 5, true);
        
        $total = array_sum($topicData);
        $result = [];
        
        foreach ($topicData as $topic => $minutes) {
            $result[] = [
                'topic' => $topic,
                'minutes' => $minutes,
                'percentage' => $total > 0 ? round(($minutes / $total) * 100, 1) : 0
            ];
        }
        
        return $result;
    }
    
    /**
     * Get weekly pattern
     */
    private function getWeeklyPattern($logs): array
    {
        $weeklyData = array_fill(0, 7, []);
        $dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        
        foreach ($logs as $log) {
            $dayOfWeek = Carbon::parse($log->log_date)->dayOfWeek;
            $weeklyData[$dayOfWeek][] = $log->duration_minutes;
        }
        
        $result = [];
        for ($i = 0; $i < 7; $i++) {
            $dayData = $weeklyData[$i];
            $avg = count($dayData) > 0 
                ? round(array_sum($dayData) / count($dayData)) 
                : 0;
            
            $result[] = [
                'day' => $dayNames[$i],
                'day_number' => $i,
                'average_minutes' => $avg,
                'session_count' => count($dayData)
            ];
        }
        
        // Rearrange to start from Monday
        $mondayFirst = [];
        for ($i = 1; $i <= 7; $i++) {
            $mondayFirst[] = $result[$i % 7];
        }
        
        return $mondayFirst;
    }
    
    /**
     * Get time of day distribution
     */
    private function getTimeOfDayDistribution($logs): array
    {
        $timeData = [
            'morning' => 0,    // 6-12
            'afternoon' => 0,  // 12-18
            'evening' => 0,    // 18-22
            'night' => 0       // 22-6
        ];
        
        foreach ($logs as $log) {
            // Use created_at to determine when the session was logged
            $hour = Carbon::parse($log->created_at)->hour;
            
            if ($hour >= 6 && $hour < 12) {
                $timeData['morning']++;
            } elseif ($hour >= 12 && $hour < 18) {
                $timeData['afternoon']++;
            } elseif ($hour >= 18 && $hour < 22) {
                $timeData['evening']++;
            } else {
                $timeData['night']++;
            }
        }
        
        return [
            ['period' => 'Pagi', 'count' => $timeData['morning']],
            ['period' => 'Siang', 'count' => $timeData['afternoon']],
            ['period' => 'Sore', 'count' => $timeData['evening']],
            ['period' => 'Malam', 'count' => $timeData['night']]
        ];
    }
    
    /**
     * Generate insights
     */
    private function generateInsights($logs, $period): array
    {
        $totalMinutes = $logs->sum('duration_minutes');
        $totalHours = round($totalMinutes / 60, 1);
        $uniqueDays = $logs->pluck('log_date')->unique()->count();
        
        // Best achievement
        $achievement = '';
        if ($totalHours >= 50) {
            $achievement = "Luar biasa! {$totalHours} jam belajar periode ini! 🏆";
        } elseif ($totalHours >= 20) {
            $achievement = "Bagus! {$totalHours} jam belajar periode ini! 💪";
        } else {
            $achievement = "Terus tingkatkan! {$totalHours} jam belajar periode ini 📚";
        }
        
        // Learning trend
        $trend = '';
        if ($logs->count() >= 14) {
            $recentWeek = $logs->filter(function ($log) {
                return Carbon::parse($log->log_date)->gte(Carbon::now()->subDays(7));
            });
            
            $previousWeek = $logs->filter(function ($log) {
                $logDate = Carbon::parse($log->log_date);
                return $logDate->lt(Carbon::now()->subDays(7)) && 
                       $logDate->gte(Carbon::now()->subDays(14));
            });
            
            $recentAvg = $recentWeek->count() > 0 
                ? $recentWeek->sum('duration_minutes') / $recentWeek->count() 
                : 0;
            
            $prevAvg = $previousWeek->count() > 0 
                ? $previousWeek->sum('duration_minutes') / $previousWeek->count() 
                : 0;
            
            if ($recentAvg > $prevAvg * 1.1) {
                $trend = 'Meningkat dari minggu sebelumnya 📈';
            } elseif ($recentAvg < $prevAvg * 0.9) {
                $trend = 'Menurun dari minggu sebelumnya 📉';
            } else {
                $trend = 'Stabil dari minggu sebelumnya ➡️';
            }
        } else {
            $trend = 'Belum cukup data untuk analisis tren';
        }
        
        // Recommendation
        $consistency = $this->getConsistencyPercentage($uniqueDays, $period);
        $recommendation = '';
        
        if ($consistency < 50) {
            $recommendation = 'Coba belajar lebih rutin setiap hari untuk membangun kebiasaan';
        } elseif ($consistency < 80) {
            $recommendation = 'Hampir konsisten! Pertahankan momentum belajar Anda';
        } else {
            $recommendation = 'Konsistensi sangat baik! Pertahankan ritme belajar ini';
        }
        
        return [
            'achievement' => $achievement,
            'trend' => $trend,
            'recommendation' => $recommendation
        ];
    }
    
    /**
     * Calculate consistency percentage based on period
     */
    private function getConsistencyPercentage($uniqueDays, $period): int
    {
        $expectedDays = match($period) {
            'week' => 7,
            'month' => 30,
            '3months' => 90,
            'year' => 365,
            default => 30
        };
        
        return min(round(($uniqueDays / $expectedDays) * 100), 100);
    }
    
    /**
     * Export analytics data
     */
    public function export(Request $request): JsonResponse
    {
        $format = $request->get('format', 'csv');
        
        // TODO: Implement export functionality
        
        return response()->json([
            'success' => false,
            'message' => 'Export functionality coming soon!'
        ], 501);
    }
}