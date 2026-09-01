# Backend Changelog - v0.2.0

## New Features

### 1. Firebase Storage Integration
- **Module:** `app/storage.py`
- **Functions:** 
  - `init_firebase()` - Initialize Firebase Admin SDK
  - `upload_photo(file_data, file_name)` - Upload to Firebase Storage
  - `delete_photo(file_path)` - Delete from Firebase Storage
- **Config:** `settings.firebase_credentials_path`

### 2. Admin Moderation System
- **New User Field:** `is_admin` (Boolean, default=False)
- **New Dependency:** `get_admin_user()` in security module
- **Endpoints:**
  - `GET /admin/users?status={status}` - List users by status
  - `POST /admin/users/{id}/warn` - Warn user
  - `POST /admin/users/{id}/suspend` - Suspend user
  - `GET /admin/comments/flagged` - List flagged comments
  - `POST /admin/comments/{id}/flag/review?action={action}` - Review flagged content
- **Database Migration:** `0002_add_is_admin_to_users.py`

### 3. Rate Limiting
- **Library:** `slowapi`
- **Configuration:**
  - `POST /points`: 5 requests/minute
  - `POST /points/{id}/reports`: 3 requests/minute
  - `POST /points/{id}/comments`: 10 requests/minute
  - `POST /directions`: 30 requests/minute
- **Behavior:** Returns HTTP 429 when limit exceeded

### 4. CORS Updates
- **Added Origins:**
  - `https://mtaa-map.vercel.app` (production)
  - `http://localhost:3000` (alternative dev port)
  - `http://localhost:5173` (Vite dev port)
- **Dynamic Origin:** Reads from `FRONTEND_ORIGIN` env variable

### 5. Structured Logging
- **Library:** `structlog` + optional `sentry-sdk`
- **Format:** JSON structured logs
- **Events Logged:**
  - User registration/login
  - Point creation
  - Comment creation
  - Reports submitted
  - Admin actions
  - Directions requested
- **Configuration:** `app/logging_config.py`

### 6. Directions Endpoint
- **Endpoint:** `POST /directions`
- **Input:** start_lat, start_lng, end_lat, end_lng
- **Output:** distance_km, duration_minutes, polyline, instructions
- **Algorithm:** Haversine formula + 40 km/h speed estimate
- **Rate Limited:** 30 requests/minute

### 7. Comment Activity Tracking
- **Field:** `points.last_comment_at`
- **Behavior:** Auto-updated when new comment created
- **Use Case:** Fast queries for "active discussions"
- **Schema:** Already existed, no changes needed

---

## Modified Files

### `requirements.txt`
Added dependencies:
- `firebase-admin==6.6.0`
- `slowapi==0.1.8`
- `structlog==24.2.0`
- `sentry-sdk==1.50.1`

### `app/config.py`
New settings:
- `firebase_credentials_path: str | None`
- `sentry_dsn: str | None`
- `rate_limit_requests_per_minute: int`

### `app/models.py`
- Added import: `Boolean` from sqlalchemy
- Added field to `User`: `is_admin: Mapped[bool]`

### `app/schemas.py`
New schemas:
- `UserAdminResponse` - Extended user info for admins
- `AdminActionRequest` - Body for admin actions
- `DirectionsRequest` - Directions request parameters
- `DirectionsResponse` - Directions response with distance/time
- Updated `UserResponse` to include `is_admin` field

### `app/security.py`
New function:
- `get_admin_user(user: User)` - Dependency for admin-only endpoints

### `app/main.py`
Major changes:
- Added imports for rate limiting, logging, math
- Initialize logging and rate limiter on startup
- Updated CORS configuration
- Added `@limiter.limit()` decorators to:
  - `create_point()` - 5/min
  - `report_point()` - 3/min
  - `create_comment()` - 10/min
  - `get_directions()` - 30/min
- Added logging to endpoints
- New endpoints:
  - `GET /admin/users` - List users for moderation
  - `POST /admin/users/{id}/warn` - Warn user
  - `POST /admin/users/{id}/suspend` - Suspend user
  - `GET /admin/comments/flagged` - List flagged comments
  - `POST /admin/comments/{id}/flag/review` - Review flagged content
  - `POST /directions` - Get directions/distance
- Added helper functions:
  - `haversine_distance()` - Calculate distance between points
  - `estimate_duration()` - Estimate travel time

### `.env.example`
Updated with new variables:
- `FIREBASE_CREDENTIALS_PATH`
- `SENTRY_DSN`
- `RATE_LIMIT_REQUESTS_PER_MINUTE`

---

## New Files

### `app/storage.py`
Firebase Storage integration module with functions for upload/delete.

### `app/logging_config.py`
Structured logging configuration with Sentry integration.

### `alembic/versions/0002_add_is_admin_to_users.py`
Database migration adding `is_admin` column to `users` table.

### `IMPLEMENTATION_GUIDE.md`
Comprehensive guide covering:
- Setup instructions for each feature
- Environment variable configuration
- Testing procedures
- Troubleshooting

### `IMPLEMENTATION_SUMMARY.md` (in root)
Quick reference guide for all 7 features.

---

## Breaking Changes
None. All changes are additive and backward-compatible.

---

## Database Migration Required
```bash
alembic upgrade head
```

This adds the `is_admin` column to the `users` table with a default value of `false`.

---

## Environment Variables Added
```
FIREBASE_CREDENTIALS_PATH     # Path to Firebase service account JSON
SENTRY_DSN                    # Sentry error tracking DSN (optional)
RATE_LIMIT_REQUESTS_PER_MINUTE  # Global rate limit setting
```

---

## Security Considerations

1. **Admin Access Control:**
   - All admin endpoints require both valid JWT AND `is_admin=true`
   - Set via direct database update only (no self-promotion endpoint)

2. **Rate Limiting:**
   - Protects against spam and bot attacks
   - Based on client IP (can be spoofed on shared networks)
   - Should be combined with Cloudflare/WAF for production

3. **Firebase Credentials:**
   - Keep `firebase-credentials.json` secure
   - Never commit to version control
   - Use environment variables or secret management in production

4. **JWT Secret:**
   - Must change from default in production
   - Use strong random value (32+ characters)
   - Rotate periodically

---

## Performance Improvements

1. **Indexed Queries:**
   - `points.last_comment_at` enables efficient sorting
   - Replaces expensive aggregation queries

2. **Rate Limiting:**
   - Prevents resource exhaustion
   - Reduces database load from spam

3. **Structured Logging:**
   - JSON format allows efficient parsing and filtering
   - Can be indexed by logging service (Sentry, CloudLogging, etc.)

---

## Future Roadmap

- [ ] Real routing API integration (Google Directions / OSRM)
- [ ] Photo moderation (flag inappropriate images)
- [ ] Webhook notifications for flagged content
- [ ] Bulk admin actions UI
- [ ] Automated trust score adjustments
- [ ] API documentation (OpenAPI/Swagger)
- [ ] GraphQL layer (optional)

