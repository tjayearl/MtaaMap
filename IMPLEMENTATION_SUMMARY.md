# MtaaMap Backend: 7 Critical Improvements - Quick Summary

## What Changed

### 1. **Firebase Storage** ✅
- Photos upload to Firebase instead of external service
- Module: `app/storage.py`
- Env var: `FIREBASE_CREDENTIALS_PATH`
- Already integrated into `PointCreate`

### 2. **Admin/Moderation Endpoints** ✅
- 5 new endpoints for user/comment management
- Requires `is_admin=true` + valid JWT
- Endpoints:
  - `GET /admin/users?status=warned|suspended`
  - `POST /admin/users/{id}/warn`
  - `POST /admin/users/{id}/suspend`
  - `GET /admin/comments/flagged`
  - `POST /admin/comments/{id}/flag/review?action=accept|reject`

### 3. **Rate Limiting** ✅
- Prevents spam/bot attacks
- Library: `slowapi`
- Limits per minute:
  - Points: 5/min
  - Reports: 3/min
  - Comments: 10/min
  - Directions: 30/min

### 4. **CORS Configuration** ✅
- Updated to explicitly allow:
  - `http://localhost:5173` (dev)
  - `https://mtaa-map.vercel.app` (production)
  - Custom `FRONTEND_ORIGIN` env var

### 5. **`last_comment_at` Field** ✅
- Auto-updated when comments added
- Enables fast "active discussions" queries
- Already in database schema
- No action needed

### 6. **Directions Endpoint** ✅
- `POST /directions`
- Returns: distance (km) + estimated time (minutes)
- Uses haversine formula (can upgrade to real routing API)
- Rate limited: 30/min

### 7. **Structured Logging** ✅
- All major events logged as JSON
- Optional Sentry integration (production)
- Module: `app/logging_config.py`
- Env var: `SENTRY_DSN`

---

## Files Modified/Created

### New Files
- `app/storage.py` - Firebase Storage utilities
- `app/logging_config.py` - Structured logging setup
- `backend/alembic/versions/0002_add_is_admin_to_users.py` - Database migration
- `backend/IMPLEMENTATION_GUIDE.md` - Detailed docs
- `.env.example` - Updated with new variables

### Modified Files
- `requirements.txt` - Added: firebase-admin, slowapi, structlog, sentry-sdk
- `app/config.py` - Added Firebase/Sentry/rate limit config
- `app/models.py` - Added `is_admin` field to `User`
- `app/schemas.py` - Added admin/directions schemas
- `app/security.py` - Added `get_admin_user()` dependency
- `app/main.py` - Major updates:
  - Rate limiting decorators on write endpoints
  - Logging initialization
  - CORS updates
  - 5 new admin endpoints
  - Directions endpoint
  - Haversine distance calculation

---

## Setup Steps (In Order)

1. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Run database migration**
   ```bash
   alembic upgrade head
   ```
   This adds the `is_admin` column to `users` table.

3. **Promote yourself to admin** (one-time)
   ```sql
   UPDATE users SET is_admin = true 
   WHERE email = 'your-email@example.com';
   ```

4. **Set environment variables** (copy `.env.example` to `.env`)
   ```bash
   cp .env.example .env
   # Edit .env and add:
   # - FIREBASE_CREDENTIALS_PATH (if using Firebase)
   # - SENTRY_DSN (if using Sentry)
   ```

5. **Test locally**
   ```bash
   uvicorn app.main:app --reload
   ```

6. **Test an endpoint**
   ```bash
   curl -X POST http://localhost:8000/directions \
     -H "Content-Type: application/json" \
     -d '{"start_lat": -1.3, "start_lng": 36.8, "end_lat": -1.2, "end_lng": 36.9}'
   ```

---

## Frontend Integration Checklist

- [ ] Update photo upload to use Firebase Storage URLs
- [ ] Add admin dashboard UI (moderation panel)
- [ ] Integrate `/directions` endpoint for routing feature
- [ ] Add retry logic for rate-limited (429) responses
- [ ] Update domain in `FRONTEND_ORIGIN` before production deploy
- [ ] Test CORS headers are working with new domain

---

## Testing Checklist

- [ ] Rate limiting blocks after N requests
- [ ] Admin endpoints return 403 for non-admins
- [ ] Comments update `last_comment_at`
- [ ] Directions endpoint returns proper distance
- [ ] Logs appear in JSON format
- [ ] Firebase upload works (if enabled)
- [ ] Sentry captures exceptions (if enabled)

---

## Important Notes

⚠️ **Before Production:**
- Change `JWT_SECRET_KEY` to a strong random value
- Set `FIREBASE_CREDENTIALS_PATH` to point to your credentials
- Set `FRONTEND_ORIGIN` to your actual domain
- Set up Sentry account and add DSN (optional but recommended)

⚠️ **Database Migration:**
- Backup your database before running `alembic upgrade head`
- The migration adds `is_admin BOOLEAN DEFAULT false` - safe to run

⚠️ **Firebase Setup:**
- Need Firebase project with Storage bucket enabled
- Service account must have Storage permissions

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 429 Too Many Requests | App is rate-limited; wait or increase limit in config |
| 403 on admin endpoints | User doesn't have `is_admin=true` |
| CORS error on frontend | Check `FRONTEND_ORIGIN` or `allowed_origins` in main.py |
| Firebase upload fails | Check credentials path and permissions |
| Sentry not working | Verify DSN is set and firewall allows outbound HTTPS |

---

## Next Phase Enhancements

1. **Real routing API** - Swap haversine for Google Directions/OSRM
2. **Photo moderation** - Flag inappropriate images
3. **Comment threading UI** - Parent comment display
4. **Trust score automation** - Adjust based on reports/suspensions
5. **Bulk moderation** - Admin tools for batch actions
6. **Webhooks** - Notify admins of flagged content

