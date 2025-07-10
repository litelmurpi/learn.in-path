# LEARN.IN PATH API Documentation

Base URL: `https://api.learninpath.com` (Production) | `http://localhost:8000/api` (Development)

## Authentication

LEARN.IN PATH menggunakan Laravel Sanctum untuk token-based authentication.

### Register

```http
POST /register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2025-07-10T12:00:00.000000Z",
    "updated_at": "2025-07-10T12:00:00.000000Z"
  },
  "token": "1|laravel_sanctum_token_here"
}
```

### Login

```http
POST /login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "2|laravel_sanctum_token_here"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "message": "Invalid credentials"
}
```

## User

### Get Current User

```http
GET /user
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "email_verified_at": null,
  "created_at": "2025-07-10T12:00:00.000000Z",
  "updated_at": "2025-07-10T12:00:00.000000Z"
}
```

## Dashboard

### Get Dashboard Statistics

```http
GET /dashboard/stats
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Dashboard stats retrieved successfully",
  "data": {
    "longest_streak": 15,
    "total_time_this_month": {
      "minutes": 2400,
      "hours": 40.0,
      "formatted": "40 jam"
    },
    "sessions_today": 2
  }
}
```

### Get Heatmap Data

```http
GET /dashboard/heatmap
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Heatmap data retrieved successfully",
  "data": {
    "heatmap": [
      {
        "date": "2024-07-10",
        "total_minutes": 120,
        "total_hours": 2.0,
        "session_count": 2,
        "intensity": 3
      },
      {
        "date": "2024-07-11",
        "total_minutes": 0,
        "total_hours": 0,
        "session_count": 0,
        "intensity": 0
      }
      // ... 365 days of data
    ],
    "stats": {
      "total_days_studied": 150,
      "total_study_time": {
        "minutes": 18000,
        "hours": 300.0,
        "formatted": "300 jam"
      },
      "average_per_day": {
        "minutes": 120,
        "formatted": "2 jam"
      },
      "most_productive_day": {
        "date": "2025-07-08",
        "total_minutes": 480,
        "total_hours": 8.0,
        "session_count": 4,
        "intensity": 4
      },
      "current_streak": 7
    },
    "period": {
      "start": "2024-07-11",
      "end": "2025-07-10"
    }
  }
}
```

**Intensity Levels:**
- `0`: No activity
- `1`: 1-30 minutes (light)
- `2`: 31-60 minutes (moderate)  
- `3`: 61-120 minutes (high)
- `4`: >120 minutes (very high)

## Study Logs

### Get All Study Logs

```http
GET /study-logs
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `per_page` (optional): Items per page (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Study logs retrieved successfully",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "user_id": 1,
        "topic": "Laravel Basics",
        "duration_minutes": 120,
        "log_date": "2025-07-10",
        "notes": "Learned about routing and controllers",
        "created_at": "2025-07-10T10:00:00.000000Z",
        "updated_at": "2025-07-10T10:00:00.000000Z",
        "user": {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com"
        }
      }
    ],
    "first_page_url": "http://localhost:8000/api/study-logs?page=1",
    "from": 1,
    "last_page": 5,
    "last_page_url": "http://localhost:8000/api/study-logs?page=5",
    "links": [...],
    "next_page_url": "http://localhost:8000/api/study-logs?page=2",
    "path": "http://localhost:8000/api/study-logs",
    "per_page": 10,
    "prev_page_url": null,
    "to": 10,
    "total": 50
  }
}
```

### Create Study Log

```http
POST /study-logs
Authorization: Bearer {token}
Content-Type: application/json

{
  "topic": "Advanced Laravel",
  "duration_minutes": 90,
  "log_date": "2025-07-10",
  "notes": "Studied service providers and facades"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Study log created successfully",
  "data": {
    "id": 2,
    "user_id": 1,
    "topic": "Advanced Laravel",
    "duration_minutes": 90,
    "log_date": "2025-07-10",
    "notes": "Studied service providers and facades",
    "created_at": "2025-07-10T14:30:00.000000Z",
    "updated_at": "2025-07-10T14:30:00.000000Z",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### Get Single Study Log

```http
GET /study-logs/{id}
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Study log retrieved successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "topic": "Laravel Basics",
    "duration_minutes": 120,
    "log_date": "2025-07-10",
    "notes": "Learned about routing and controllers",
    "created_at": "2025-07-10T10:00:00.000000Z",
    "updated_at": "2025-07-10T10:00:00.000000Z",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### Update Study Log

```http
PUT /study-logs/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "topic": "Advanced Laravel - Updated",
  "duration_minutes": 120,
  "notes": "Added more study time"
}
```

**Note:** All fields are optional when updating. Only include fields you want to update.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Study log updated successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "topic": "Advanced Laravel - Updated",
    "duration_minutes": 120,
    "log_date": "2025-07-10",
    "notes": "Added more study time",
    "created_at": "2025-07-10T10:00:00.000000Z",
    "updated_at": "2025-07-10T15:00:00.000000Z",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### Delete Study Log

```http
DELETE /study-logs/{id}
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Study log deleted successfully"
}
```

## Error Responses

### 401 Unauthorized

```json
{
  "message": "Unauthenticated."
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Study log not found"
}
```

### 422 Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "topic": [
      "The topic field is required."
    ],
    "duration_minutes": [
      "The duration minutes must be at least 1."
    ]
  }
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to create study log",
  "error": "Error message here"
}
```

## Request Headers

All authenticated endpoints require:
```
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

## Rate Limiting

Default Laravel rate limiting applies:
- 60 requests per minute for API routes

## CORS

CORS is configured for the frontend URL specified in `.env`:
```
FRONTEND_URL=http://localhost:3000
```

## Postman Collection

You can import this collection to test the API:

1. Open Postman
2. Click "Import"
3. Use the following collection:

```json
{
  "info": {
    "name": "LEARN.IN PATH API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:8000/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Test User\",\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\",\n  \"password_confirmation\": \"password123\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/register",
              "host": ["{{baseUrl}}"],
              "path": ["register"]
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/login",
              "host": ["{{baseUrl}}"],
              "path": ["login"]
            }
          }
        }
      ]
    }
  ]
}
```

---

For support or bug reports, please open an issue on GitHub: https://github.com/litelmurpi/learn.in-path/issues
