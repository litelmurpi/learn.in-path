# 🍅 Pomodoro API Database Seeder

This seeder creates comprehensive test data for the Pomodoro API endpoints to facilitate testing in Postman and other API testing tools.

## Overview

The PomodoroSeeder generates realistic test data including:
- **5 different user types** with unique Pomodoro usage patterns
- **Multiple session states** (active, completed, cancelled, paused)
- **Custom user settings** with various configurations
- **Historical data** spanning 30 days for analytics testing
- **Active sessions** for real-time API testing
- **Integration** with existing StudyLog system

## Database Structure

### Tables Created
1. **pomodoro_sessions** - Individual Pomodoro timer sessions
2. **user_pomodoro_settings** - User-specific Pomodoro configurations

### Models Available
- `PomodoroSession` - Manages timer sessions with states and durations
- `UserPomodoroSettings` - Stores user preferences and settings

## Generated Test Data

### User Types & Patterns

| User Type | Email | Pattern Description | Completion Rate |
|-----------|-------|-------------------|-----------------|
| **Morning Person** | morning.person@example.com | High activity 6AM-6PM, weekdays focused | 85% |
| **Night Owl** | night.owl@example.com | Active 2PM-11PM, weekends heavy | 75% |
| **Consistent** | consistent.user@example.com | Regular 9AM-7PM, steady patterns | 80% |
| **Sporadic** | sporadic.user@example.com | Irregular usage, 70% study days | 65% |
| **Struggling** | struggling.user@example.com | Shorter sessions, many cancellations | 50% |

### Session Data Volume
- **Total Sessions**: 50-100+ across all users
- **Time Span**: Last 30 days + today's active sessions
- **Session Types**: 70% work, 20% short break, 10% long break
- **Active Sessions**: 2-3 sessions for real-time testing

### User Settings Variety

| User | Work Duration | Break Duration | Auto-start | Timezone |
|------|---------------|----------------|------------|----------|
| Morning Person | 25 min | 5/15 min | Breaks only | EST |
| Night Owl | 45 min | 10/30 min | Work only | PST |
| Consistent | 30 min | 7/20 min | Both | UTC |
| Sporadic | 25 min | 5/15 min | None | GMT |
| Struggling | 15 min | 5/10 min | None | JST |

## Installation & Usage

### 1. Run Migrations
```bash
php artisan migrate
```

### 2. Run the Seeder
```bash
# Run only Pomodoro seeder
php artisan db:seed --class=PomodoroSeeder

# Or run all seeders (includes Pomodoro)
php artisan db:seed
```

### 3. Verify Data
```bash
# Check created users
php artisan tinker
>>> User::count()
>>> PomodoroSession::count()
>>> UserPomodoroSettings::count()
```

## API Testing with Postman

### Authentication
All test users use the password: `password123`

Example login request:
```json
POST /api/login
{
    "email": "morning.person@example.com", 
    "password": "password123"
}
```

### Available API Endpoints

#### 1. Session Management
- `POST /api/pomodoro/start` - Start new session
- `PUT /api/pomodoro/{id}/pause` - Pause active session
- `PUT /api/pomodoro/{id}/resume` - Resume paused session
- `PUT /api/pomodoro/{id}/complete` - Complete session
- `PUT /api/pomodoro/{id}/cancel` - Cancel session

#### 2. Data Retrieval  
- `GET /api/pomodoro/active` - Get user's active session
- `GET /api/pomodoro/history` - Get session history
- `GET /api/pomodoro/statistics` - Get analytics data

#### 3. Settings Management
- `GET /api/pomodoro/settings` - Get user settings
- `POST /api/pomodoro/settings` - Update user settings

### Test Scenarios

#### Scenario 1: Complete Session Flow
1. Login as `morning.person@example.com`
2. `GET /api/pomodoro/active` (should have active session)
3. `PUT /api/pomodoro/{id}/pause` (pause the session)
4. `PUT /api/pomodoro/{id}/resume` (resume it)
5. `PUT /api/pomodoro/{id}/complete` (finish it)

#### Scenario 2: Settings Management
1. Login as `night.owl@example.com`
2. `GET /api/pomodoro/settings` (view custom 45min settings)
3. `POST /api/pomodoro/settings` (modify durations)

#### Scenario 3: Analytics Testing
1. Login as `consistent.user@example.com`
2. `GET /api/pomodoro/history?days=7` (last week data)
3. `GET /api/pomodoro/statistics` (view aggregated stats)

#### Scenario 4: Error Handling
1. Login as `sporadic.user@example.com`
2. Try starting session when one is already active
3. Try resuming a completed session
4. Try accessing another user's session

## Data Characteristics

### Realistic Patterns
- **Morning Person**: Sessions mostly 6AM-6PM weekdays
- **Night Owl**: Longer sessions 2PM-11PM, weekend focused  
- **Consistent**: Regular 9AM-7PM daily patterns
- **Sporadic**: Random gaps, 70% study probability
- **Struggling**: Shorter durations, 35% cancellation rate

### Session Distribution
- **Active**: 2-3 sessions (for real-time testing)
- **Completed**: ~70% of historical sessions
- **Cancelled**: ~20% of historical sessions  
- **Paused**: ~10% of historical sessions

### Integration Features
- Study logs linked to completed work sessions
- Realistic timestamps across different times of day
- Proper foreign key relationships maintained
- Various session durations based on user settings

## Development Notes

### Model Relationships
```php
// User has many sessions and one settings
User::pomodoroSessions()
User::pomodoroSettings()

// Session belongs to user and optionally study log
PomodoroSession::user()
PomodoroSession::studyLog()

// Settings belong to one user
UserPomodoroSettings::user()
```

### Session States
- `active` - Currently running
- `paused` - Temporarily stopped
- `completed` - Finished successfully
- `cancelled` - Stopped before completion

### Session Types
- `work` - Focus session (linked to study logs)
- `short_break` - Quick rest period
- `long_break` - Extended rest period

## Troubleshooting

### Common Issues
1. **Foreign key errors**: Ensure users are created before sessions
2. **Timezone issues**: Check Carbon timezone handling
3. **Duplicate data**: Seeder uses truncate() to clear existing data

### Re-running Seeder
The seeder can be run multiple times safely:
```bash
php artisan db:seed --class=PomodoroSeeder
```

### Resetting All Data
```bash
php artisan migrate:fresh --seed
```

## API Testing Checklist

- [ ] User authentication with all 5 test users
- [ ] Start session (test concurrent session prevention)
- [ ] Pause/resume functionality
- [ ] Complete session (verify study log linkage)  
- [ ] Cancel session (test partial time tracking)
- [ ] Get active session (test ownership validation)
- [ ] History retrieval (test pagination & filtering)
- [ ] Statistics calculation (test aggregations)
- [ ] Settings CRUD operations
- [ ] Error scenarios (unauthorized access, invalid states)
- [ ] Timezone handling across different user timezones

This seeder provides a robust foundation for comprehensive Pomodoro API testing in Postman! 🚀