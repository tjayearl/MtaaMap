# MtaaMap Backend - Implementation Guide for New Features

This guide covers the 7 critical improvements added to your MtaaMap backend.

## 1. Firebase Storage Integration

**What it does:** Photos uploaded via "Add a Place" are now stored in Firebase Storage instead of requiring a separate service.

### Setup:
1. Obtain Firebase credentials JSON from your Firebase project
2. Set environment variable in `.env`:
   ```
   FIREBASE_CREDENTIALS_PATH=/path/to/firebase-credentials.json
   ```

### Usage in code:
```python
from app.storage import upload_photo

# Upload a photo
url = upload_photo(
    file_data=image_bytes,
    file_name=f"points/{point_id}.jpg"
)
```

### Database schema:
- `points.photo_url` stores the Firebase Storage public URL
- No changes needed to existing `PointCreate` schema

### Frontend integration:
When uploading a photo, send the Firebase URL to your backend:
```javascript
const url = await uploadToFirebase(file);
await createPoint({ 
  // ... other fields
  photo_url: url 
});
```

---

## 2. Admin/Moderation Endpoints

**What it does:** You and Zipporah get a way to manage trust violations and problematic content.

### New endpoints:

#### List users for review (by status)
```
GET /admin/users?status=warned
GET /admin/users?status=suspended
```
Response: `list[UserAdminResponse]` (includes `is_admin` and `created_at`)

#### Warn a user
```
POST /admin/users/{user_id}/warn
Body: { "reason": "Spam detection" }
```
Sets `users.status = "warned"`

#### Suspend a user
```
POST /admin/users/{user_id}/suspend
Body: { "reason": "Multiple violations" }
```
Sets `users.status = "suspended"` (user can no longer log in)

#### List flagged comments
```
GET /admin/comments/flagged
```
Returns all comments with `flagged_count > 0`, sorted by flag count

#### Review flagged comments
```
POST /admin/comments/{comment_id}/flag/review?action=accept
POST /admin/comments/{comment_id}/flag/review?action=reject
```
- `action=accept`: Delete the comment
- `action=reject`: Reset `flagged_count` to 0

### Security:
- All admin endpoints require `is_admin=true` on the authenticated user
- Check enforced via `get_admin_user()` dependency
- Audit logged (see Logging section)

### Setup:
To promote a user to admin (temporary SQL):
```sql
UPDATE users SET is_admin = true WHERE id = '...' AND email = 'your-email@example.com';
```

---

## 3. Rate Limiting

**What it does:** Prevents spam and bot attacks by limiting requests per user per minute.

### Current limits:
| Endpoint | Limit | Purpose |
|----------|-------|---------|
| `POST /points` | 5/min | Prevent point spam |
| `POST /points/{id}/reports` | 3/min | Prevent report spam |
| `POST /points/{id}/comments` | 10/min | Prevent comment flood |
| `POST /directions` | 30/min | Prevent routing abuse |

### How it works:
- Based on client IP address via `slowapi`
- Returns `HTTP 429 Too Many Requests` when limit exceeded
- Frontend should retry with exponential backoff

### Customizing limits:
Edit `@limiter.limit()` decorators in `app/main.py`:
```python
@app.post("/points")
@limiter.limit("10/minute")  # Change this
def create_point(...):
```

### Environment variable:
```
RATE_LIMIT_REQUESTS_PER_MINUTE=60
```

---

## 4. CORS Configuration

**What it does:** Explicitly allows your frontend domain to communicate with the backend after deployment.

### Current allowed origins:
- `http://localhost:3000` (local dev)
- `http://localhost:5173` (Vite dev)
- `https://mtaa-map.vercel.app` (production Vercel deployment)
- Value from `FRONTEND_ORIGIN` environment variable

### Configuration:
In `app/main.py`:
```python
allowed_origins = [
    settings.frontend_origin,
    "http://localhost:3000",
    "http://localhost:5173",
    "https://mtaa-map.vercel.app",
]
```

### When deploying:
If you change your frontend domain, either:
1. Update `allowed_origins` list in `app/main.py`, OR
2. Set `FRONTEND_ORIGIN` environment variable

Without this, browser will return: `Cross-Origin Request Blocked`

---

## 5. `last_comment_at` Denormalization

**What it does:** Fast queries for "places with active discussions" without expensive aggregation.

### Database:
- New field: `points.last_comment_at` (nullable DateTime)
- Automatically updated whenever a comment is created
- **Already implemented** in the comment creation endpoint

### Usage in queries:
```python
# Show points sorted by most recent comments
@app.get("/points")
def list_points(...):
    order_by = func.coalesce(Point.last_comment_at, Point.created_at).desc()
    # This is fast because it's an indexed column
```

### Community Panel benefit:
```python
# "Active discussions now"
query = select(Point).where(Point.last_comment_at.isnot(None))
query = query.order_by(Point.last_comment_at.desc()).limit(10)
```

---

## 6. Directions Endpoint

**What it does:** Provides distance and estimated travel time to a location.

### Endpoint:
```
POST /directions

Request:
{
  "start_lat": -1.2921,
  "start_lng": 36.8219,
  "end_lat": -1.2865,
  "end_lng": 36.8245
}

Response:
{
  "distance_km": 0.62,
  "duration_minutes": 1.2,
  "polyline": null,
  "instructions": []
}
```

### How it works:
- Uses **haversine formula** for distance (great-circle distance)
- Estimates duration assuming 40 km/h average speed
- Rate limited to 30 requests/minute

### Future improvements:
- Swap haversine for real routing service (Google Directions API, OSRM, Mapbox)
- Add turn-by-turn instructions
- Add polyline geometry for mapping the route

### Usage:
```typescript
// Frontend: Get directions to a point
const directions = await fetch('/directions', {
  method: 'POST',
  body: JSON.stringify({
    start_lat: userLat,
    start_lng: userLng,
    end_lat: pointLat,
    end_lng: pointLng,
  }),
});
```

---

## 7. Structured Logging & Error Tracking

**What it does:** Logs all important events in JSON format for debugging and monitoring. Optionally integrates with Sentry for error tracking in production.

### Logging events captured:
- User registration/login
- Point creation
- Comment creation
- Reports
- Admin actions (warn, suspend, flag review)
- Directions requests

### Example log output:
```json
{
  "timestamp": "2024-01-15T10:30:45Z",
  "level": "info",
  "logger": "app.main",
  "event": "point_created",
  "point_id": "abc123...",
  "user_id": "def456..."
}
```

### Sentry integration:
1. Create account at [sentry.io](https://sentry.io)
2. Create a project (Python/FastAPI)
3. Copy the DSN and add to `.env`:
   ```
   SENTRY_DSN=https://your-key@sentry.io/your-project-id
   ```
4. Sentry will automatically capture:
   - Unhandled exceptions
   - HTTP 500 errors
   - Performance data (slowness tracking)

### Viewing logs locally:
```bash
# Logs output to stdout as JSON
python -m uvicorn app.main:app --reload 2>&1 | jq .
```

### For production:
- Set up log aggregation (CloudLogging on GCP, CloudWatch on AWS, etc.)
- Parse the JSON logs for structured search/alerting

---

## Database Migration

Run the new migration to add `is_admin` column:
```bash
cd backend
alembic upgrade head
```

This runs `0002_add_is_admin_to_users.py`, which adds:
```sql
ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;
```

---

## Environment Variables Summary

Create/update `.env` in the backend folder:

```env
# Database
DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/mtaamap

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-in-production

# Frontend
FRONTEND_ORIGIN=http://localhost:5173

# Firebase
FIREBASE_CREDENTIALS_PATH=/path/to/credentials.json

# Logging
SENTRY_DSN=https://your-key@sentry.io/your-project-id

# Rate limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60
```

---

## Testing the new features

### Test rate limiting:
```bash
for i in {1..10}; do
  curl -X POST http://localhost:8000/directions \
    -H "Content-Type: application/json" \
    -d '{"start_lat": -1.2, "start_lng": 36.8, "end_lat": -1.3, "end_lng": 36.9}'
  sleep 0.1
done
# Should get 429 after 5th request (depending on your limit config)
```

### Test admin endpoints:
```bash
# List warned users
curl http://localhost:8000/admin/users?status=warned \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Warn a user
curl -X POST http://localhost:8000/admin/users/{user_id}/warn \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Spam"}'
```

### Test directions:
```bash
curl -X POST http://localhost:8000/directions \
  -H "Content-Type: application/json" \
  -d '{
    "start_lat": -1.2921,
    "start_lng": 36.8219,
    "end_lat": -1.2865,
    "end_lng": 36.8245
  }'
```

---

## Next Steps

1. **Install dependencies**: `pip install -r requirements.txt`
2. **Run migration**: `alembic upgrade head`
3. **Set environment variables** (see summary above)
4. **Promote yourself to admin**: SQL update (see section 2)
5. **Test each feature** with the curl commands above
6. **Update frontend** to:
   - Use Firebase Storage for photo uploads
   - Integrate admin dashboard UI for moderation
   - Call `/directions` for routing
   - Implement retry logic for rate-limited requests
7. **Deploy**: Update production environment variables before deploying

---

## Troubleshooting

### Rate limiting not working
- Check `slowapi` is installed: `pip list | grep slowapi`
- Ensure decorators are above the endpoint function

### CORS errors
- Check `FRONTEND_ORIGIN` matches exactly (no trailing slash)
- Verify the domain is in `allowed_origins` list

### Firebase upload fails
- Check credentials file path is correct
- Ensure Firebase Storage bucket exists and is public
- Verify service account has `storage.buckets.get` and `storage.objects.create` permissions

### Admin endpoints return 403
- Verify user has `is_admin = true` in database
- Check JWT token is valid and not expired

### Sentry not capturing errors
- Verify `SENTRY_DSN` is set and valid
- Check internet connectivity (Sentry requires outbound HTTPS)

---

## Architecture diagram

```
Frontend (Vercel)
      ↓ (HTTPS, CORS allowed)
FastAPI Backend
├─ Auth (JWT)
├─ Points CRUD (rate limited)
├─ Comments (rate limited, updates last_comment_at)
├─ Admin endpoints (requires is_admin + auth)
├─ Directions (rate limited)
└─ Logging
   ├─ Structured (stdout)
   └─ Sentry (production error tracking)

Database (PostgreSQL)
├─ users (+ is_admin field)
├─ points (+ last_comment_at)
├─ comments (flagged_count for moderation)
└─ ... other tables

Storage
└─ Firebase Storage (photos)
```

