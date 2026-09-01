# MtaaMap API Endpoints Reference

## Authentication
All endpoints (except `/auth/*` and `/health`) require JWT token in header:
```
Authorization: Bearer {token}
```

---

## Public Endpoints

### Health Check
```
GET /health
Response: { "status": "ok" }
```

---

## Authentication

### Register
```
POST /auth/register
Body: {
  "email": "user@example.com",
  "phone": "+254712345678",  // either email or phone required
  "password": "secure_password_8_chars_min",
  "display_name": "John Doe"
}
Response: TokenResponse {
  "access_token": "...",
  "token_type": "bearer",
  "user": UserResponse
}
Status: 201 Created
```

### Login
```
POST /auth/login
Body: {
  "identifier": "user@example.com or +254712345678",
  "password": "secure_password"
}
Response: TokenResponse {
  "access_token": "...",
  "token_type": "bearer",
  "user": UserResponse
}
Status: 200 OK
```

---

## Points (Locations)

### List Points
```
GET /points?layer=neighborhood&lat=-1.2921&lng=36.8219&radius_km=2&has_comments=false&sort=recent_activity&filter=water
Query Parameters:
  - layer: neighborhood | prices | potholes (optional)
  - lat: -90 to 90 (optional)
  - lng: -180 to 180 (optional)
  - radius_km: 0-100, default=2 (optional)
  - has_comments: boolean (optional)
  - sort: recent_activity | popular (optional)
  - filter: search string (optional)

Response: list[PointResponse] {
  "id": "uuid",
  "layer": "neighborhood",
  "name": "Naivas Supermarket",
  "area": "Westlands",
  "lat": -1.2921,
  "lng": 36.8219,
  "photo_url": "https://...",
  "attributes": [
    {"key": "price", "value": "affordable", "unit": null}
  ],
  "created_at": "2024-01-15T10:30:00Z"
}
Status: 200 OK
```

### Get Point
```
GET /points/{point_id}
Response: PointResponse (see above)
Status: 200 OK | 404 Not Found
```

### Create Point
```
POST /points
Rate Limited: 5 requests/minute
Body: {
  "layer": "neighborhood",
  "name": "Naivas Supermarket",
  "area": "Westlands",
  "lat": -1.2921,
  "lng": 36.8219,
  "photo_url": "https://storage.googleapis.com/...",
  "attributes": [
    {"key": "price", "value": "affordable", "unit": null}
  ]
}
Response: PointResponse (see above)
Status: 201 Created
```

---

## Comments

### List Comments for Point
```
GET /points/{point_id}/comments
Response: list[CommentResponse] {
  "id": "uuid",
  "point_id": "uuid",
  "parent_comment_id": "uuid | null",
  "user_id": "uuid",
  "body": "This place has great coffee!",
  "created_at": "2024-01-15T10:30:00Z",
  "flagged_count": 0
}
Status: 200 OK | 404 Not Found
```

### Create Comment
```
POST /points/{point_id}/comments
Rate Limited: 10 requests/minute
Body: {
  "body": "This place has great coffee!",
  "parent_comment_id": "uuid | null"  // null for top-level comments
}
Response: CommentResponse (see above)
Status: 201 Created | 404 Point not found | 400 Invalid parent comment
```

---

## Reports

### Report Point
```
POST /points/{point_id}/reports
Rate Limited: 3 requests/minute
Body: {
  "reason": "Information is outdated",
  "proposed_changes": {"status": "closed"}  // optional
}
Response: ReportResponse {
  "id": "uuid",
  "point_id": "uuid",
  "reason": "Information is outdated",
  "proposed_changes": {...},
  "status": "pending",
  "created_at": "2024-01-15T10:30:00Z"
}
Status: 201 Created | 404 Point not found
```

---

## User

### Get Current User
```
GET /users/me
Response: UserResponse {
  "id": "uuid",
  "display_name": "John Doe",
  "email": "john@example.com",
  "phone": "+254712345678",
  "trust_score": 100,
  "status": "active",  // active | warned | suspended
  "is_admin": false
}
Status: 200 OK
```

### Get User Contributions
```
GET /users/me/contributions
Response: list[ContributionResponse] {
  "id": "uuid",
  "point_id": "uuid",
  "type": "created",  // created | confirmed | disputed
  "created_at": "2024-01-15T10:30:00Z"
}
Status: 200 OK
```

### Confirm Point
```
POST /points/{point_id}/confirm
Response: ContributionResponse (see above)
Status: 201 Created | 404 Point not found
```

---

## Admin Endpoints

**All require: Valid JWT + `is_admin=true`**

### List Users for Moderation
```
GET /admin/users?status=warned
Query Parameters:
  - status: active | warned | suspended (optional)

Response: list[UserAdminResponse] {
  "id": "uuid",
  "display_name": "John Doe",
  "email": "john@example.com",
  "phone": "+254712345678",
  "trust_score": 50,
  "status": "warned",
  "is_admin": false,
  "created_at": "2024-01-15T10:30:00Z"
}
Status: 200 OK | 403 Forbidden
```

### Warn User
```
POST /admin/users/{user_id}/warn
Body: {
  "reason": "Spam detection - multiple fake points"
}
Response: UserAdminResponse (see above)
Status: 200 OK | 404 User not found | 403 Forbidden
```

### Suspend User
```
POST /admin/users/{user_id}/suspend
Body: {
  "reason": "Multiple violations - account suspended"
}
Response: UserAdminResponse (see above)
Status: 200 OK | 404 User not found | 403 Forbidden
```

### List Flagged Comments
```
GET /admin/comments/flagged
Response: list[CommentResponse] {
  "id": "uuid",
  "point_id": "uuid",
  "parent_comment_id": null,
  "user_id": "uuid",
  "body": "Offensive comment...",
  "created_at": "2024-01-15T10:30:00Z",
  "flagged_count": 5
}
Status: 200 OK | 403 Forbidden
```

### Review Flagged Comment
```
POST /admin/comments/{comment_id}/flag/review?action=accept
POST /admin/comments/{comment_id}/flag/review?action=reject
Query Parameters:
  - action: accept (delete) | reject (unflag) - REQUIRED

Response: {
  "status": "ok" (if accepted/deleted)
  OR
  CommentResponse (if rejected/unflagged)
}
Status: 200 OK | 404 Comment not found | 403 Forbidden
```

---

## Directions

### Get Directions
```
POST /directions
Rate Limited: 30 requests/minute
Body: {
  "start_lat": -1.2921,
  "start_lng": 36.8219,
  "end_lat": -1.2865,
  "end_lng": 36.8245
}
Response: DirectionsResponse {
  "distance_km": 0.62,
  "duration_minutes": 1.2,
  "polyline": null,
  "instructions": []
}
Status: 200 OK | 429 Too Many Requests
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (e.g., email already exists) |
| 429 | Too Many Requests (rate limited) |
| 500 | Server Error |

---

## Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## Rate Limits Summary

| Endpoint | Limit | Status Code |
|----------|-------|------------|
| POST /points | 5/min | 429 |
| POST /points/{id}/reports | 3/min | 429 |
| POST /points/{id}/comments | 10/min | 429 |
| POST /directions | 30/min | 429 |
| GET /admin/* | No limit | - |

---

## User Status Enum

```
active      - Normal user, can post/comment
warned      - User has been warned, can still post but flagged
suspended   - User cannot post/comment/login
```

---

## Point Layer Enum

```
neighborhood  - General neighborhood info, services, landmarks
prices        - Price information (food, services, goods)
potholes      - Road/infrastructure issues
```

---

## Contribution Type Enum

```
created     - User created this point
confirmed   - User confirmed/verified this point
disputed    - User disputed information on this point
```

---

## Example Workflow: Add and Discuss a Place

1. **Register**
   ```
   POST /auth/register → Get token
   ```

2. **Create a point**
   ```
   POST /points → New PointResponse
   ```

3. **View the point**
   ```
   GET /points/{point_id}
   ```

4. **Add a comment**
   ```
   POST /points/{point_id}/comments → CommentResponse
   ```

5. **Reply to comment**
   ```
   POST /points/{point_id}/comments (with parent_comment_id) → CommentResponse
   ```

6. **Confirm point**
   ```
   POST /points/{point_id}/confirm → ContributionResponse
   ```

7. **View contributions**
   ```
   GET /users/me/contributions → list[ContributionResponse]
   ```

---

## Example Workflow: Admin Moderation

1. **List warned users**
   ```
   GET /admin/users?status=warned
   ```

2. **Review a user**
   ```
   GET /admin/users?status=warned
   ```

3. **Escalate to suspension**
   ```
   POST /admin/users/{user_id}/suspend
   Body: {"reason": "Multiple violations"}
   ```

4. **Review flagged comments**
   ```
   GET /admin/comments/flagged
   ```

5. **Remove a comment**
   ```
   POST /admin/comments/{comment_id}/flag/review?action=accept
   ```

---

## Testing with curl

### Get token
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"user@example.com","password":"password"}' \
  | jq -r '.access_token')
echo $TOKEN
```

### Create a point
```bash
curl -X POST http://localhost:8000/points \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "layer": "neighborhood",
    "name": "Test Point",
    "area": "Westlands",
    "lat": -1.2921,
    "lng": 36.8219,
    "attributes": [{"key": "type", "value": "store"}]
  }'
```

### List points
```bash
curl "http://localhost:8000/points?lat=-1.2921&lng=36.8219&radius_km=5"
```

### Get directions
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

