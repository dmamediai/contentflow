# API Testing Guide

Complete guide for testing all ContentFlow API endpoints end-to-end.

---

## Setup

### Prerequisites
- API running on `http://localhost:3001` (development) or `https://api.yourdomain.com` (production)
- `curl` or `Postman` for testing
- Valid credentials in `.env`

### Helper Variables

```bash
# Development
API_URL="http://localhost:3001"

# Production
API_URL="https://api.yourdomain.com"

# Will be set after login
ACCESS_TOKEN=""
USER_ID=""
TEAM_ID=""
```

---

## 1. Authentication Tests

### 1.1 User Registration

**Test:** Create new user account

```bash
curl -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePassword123!",
    "name": "Test User"
  }'
```

**Expected Response (201):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "testuser@example.com",
    "name": "Test User",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Store:** Save `token` as `ACCESS_TOKEN` and `user.id` as `USER_ID`

---

### 1.2 User Login

**Test:** Login with email and password

```bash
curl -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePassword123!"
  }'
```

**Expected Response (200):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "testuser@example.com",
    "name": "Test User"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 1.3 Get Current Session

**Test:** Retrieve authenticated user info

```bash
curl -X GET "$API_URL/api/auth/session" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "testuser@example.com",
    "name": "Test User",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 1.4 Refresh Token

**Test:** Get new access token using refresh token

```bash
curl -X POST "$API_URL/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token"
  }'
```

**Expected Response (200):**
```json
{
  "token": "new-jwt-token-here",
  "refreshToken": "new-refresh-token-here"
}
```

---

### 1.5 User Logout

**Test:** Logout and invalidate session

```bash
curl -X POST "$API_URL/api/auth/logout" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "message": "Successfully logged out"
}
```

---

## 2. Team Management Tests

### 2.1 Create Team

**Test:** Create new team

```bash
curl -X POST "$API_URL/api/teams" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "Test Team",
    "description": "A test team for E2E testing"
  }'
```

**Expected Response (201):**
```json
{
  "team": {
    "id": "team-uuid",
    "name": "Test Team",
    "description": "A test team for E2E testing",
    "ownerId": "'$USER_ID'",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Store:** Save `team.id` as `TEAM_ID`

---

### 2.2 List Teams

**Test:** Get all teams for user

```bash
curl -X GET "$API_URL/api/teams" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "teams": [
    {
      "id": "team-uuid",
      "name": "Test Team",
      "description": "A test team",
      "ownerId": "user-uuid",
      "role": "owner",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 2.3 Get Team Details

**Test:** Get specific team info

```bash
curl -X GET "$API_URL/api/teams/$TEAM_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "team": {
    "id": "team-uuid",
    "name": "Test Team",
    "description": "A test team",
    "ownerId": "user-uuid",
    "memberCount": 1,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 2.4 Update Team

**Test:** Update team details

```bash
curl -X PUT "$API_URL/api/teams/$TEAM_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "Updated Team Name",
    "description": "Updated description"
  }'
```

**Expected Response (200):**
```json
{
  "team": {
    "id": "team-uuid",
    "name": "Updated Team Name",
    "description": "Updated description"
  }
}
```

---

### 2.5 List Team Members

**Test:** Get all team members

```bash
curl -X GET "$API_URL/api/teams/$TEAM_ID/members" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "members": [
    {
      "userId": "user-uuid",
      "email": "testuser@example.com",
      "name": "Test User",
      "role": "owner",
      "joinedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 2.6 Add Team Member

**Test:** Invite user to team

```bash
curl -X POST "$API_URL/api/teams/$TEAM_ID/members" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "email": "newmember@example.com",
    "role": "member"
  }'
```

**Expected Response (201):**
```json
{
  "member": {
    "userId": "new-user-uuid",
    "email": "newmember@example.com",
    "role": "member",
    "joinedAt": "2024-01-15T10:35:00Z"
  }
}
```

---

### 2.7 Update Member Role

**Test:** Change member's role

```bash
curl -X PUT "$API_URL/api/teams/$TEAM_ID/members/member-user-id" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "role": "admin"
  }'
```

**Expected Response (200):**
```json
{
  "member": {
    "userId": "member-user-id",
    "email": "newmember@example.com",
    "role": "admin"
  }
}
```

---

### 2.8 Remove Team Member

**Test:** Remove user from team

```bash
curl -X DELETE "$API_URL/api/teams/$TEAM_ID/members/member-user-id" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (204):** No content

---

## 3. AI Content Generation Tests

### 3.1 Generate Social Post

**Test:** Generate AI post for social media

```bash
curl -X POST "$API_URL/api/ai/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "type": "social_post",
    "platform": "twitter",
    "topic": "productivity tips for developers",
    "tone": "professional",
    "length": "short",
    "includeHashtags": true
  }'
```

**Expected Response (200):**
```json
{
  "content": "Boost your dev productivity with these 5 essential tips! 🚀\n1. Use keyboard shortcuts\n2. Automate repetitive tasks\n3. Keep learning daily\n4. Share knowledge with team\n5. Take regular breaks\n\n#DeveloperTips #Productivity #CodingLife",
  "platform": "twitter",
  "tokensUsed": 150
}
```

---

### 3.2 Rewrite Content

**Test:** Rewrite content in different style

```bash
curl -X POST "$API_URL/api/ai/rewrite" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "content": "This product is really great and you should buy it",
    "style": "professional",
    "platform": "linkedin"
  }'
```

**Expected Response (200):**
```json
{
  "content": "We're confident this solution delivers exceptional value and would be an excellent addition to your business toolkit.",
  "tokensUsed": 75
}
```

---

### 3.3 Expand Content

**Test:** Expand short content to longer form

```bash
curl -X POST "$API_URL/api/ai/expand" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "content": "Use React hooks for better state management",
    "targetLength": "medium",
    "platform": "twitter"
  }'
```

**Expected Response (200):**
```json
{
  "content": "Master React hooks for cleaner, more efficient state management. Learn how useEffect, useState, and custom hooks can transform your components and improve code reusability. Perfect for modern React development! #ReactJS #WebDevelopment",
  "tokensUsed": 120
}
```

---

### 3.4 Summarize Content

**Test:** Summarize long content

```bash
curl -X POST "$API_URL/api/ai/summarize" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "content": "Long article content here...",
    "length": "short"
  }'
```

**Expected Response (200):**
```json
{
  "summary": "Key takeaways from the article in a concise format.",
  "tokensUsed": 85
}
```

---

### 3.5 Generate Hashtags

**Test:** Generate relevant hashtags

```bash
curl -X POST "$API_URL/api/ai/hashtags" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "content": "Announcing our new AI-powered content creation tool",
    "count": 10,
    "platform": "instagram"
  }'
```

**Expected Response (200):**
```json
{
  "hashtags": [
    "#AI",
    "#ContentCreation",
    "#AITools",
    "#Innovation",
    "#MarketingTools",
    "#SocialMedia",
    "#Automation",
    "#ProductLaunch",
    "#TechStartup",
    "#DigitalMarketing"
  ],
  "tokensUsed": 50
}
```

---

## 4. Media Management Tests

### 4.1 Upload Media

**Test:** Upload image/video to media library

```bash
# Upload file
curl -X POST "$API_URL/api/media/upload" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "teamId=$TEAM_ID" \
  -F "type=image"
```

**Expected Response (201):**
```json
{
  "media": {
    "id": "media-uuid",
    "url": "https://supabase.com/storage/media/...",
    "type": "image",
    "size": 1024000,
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Store:** Save `media.id` as `MEDIA_ID`

---

### 4.2 List Media

**Test:** Get all media in team

```bash
curl -X GET "$API_URL/api/media?teamId=$TEAM_ID&type=image" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "media": [
    {
      "id": "media-uuid",
      "url": "https://...",
      "type": "image",
      "size": 1024000,
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

---

### 4.3 Delete Media

**Test:** Delete media file

```bash
curl -X DELETE "$API_URL/api/media/$MEDIA_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (204):** No content

---

## 5. Content Scheduler Tests

### 5.1 Create Draft Post

**Test:** Create draft post

```bash
curl -X POST "$API_URL/api/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "teamId": "'$TEAM_ID'",
    "content": "Check out our new feature! 🎉",
    "platforms": ["twitter", "linkedin"],
    "status": "draft",
    "mediaIds": ["media-uuid-1", "media-uuid-2"]
  }'
```

**Expected Response (201):**
```json
{
  "post": {
    "id": "post-uuid",
    "content": "Check out our new feature! 🎉",
    "platforms": ["twitter", "linkedin"],
    "status": "draft",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Store:** Save `post.id` as `POST_ID`

---

### 5.2 Schedule Post

**Test:** Schedule post for future delivery

```bash
curl -X POST "$API_URL/api/posts/$POST_ID/schedule" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "scheduledAt": "2024-01-20T14:00:00Z",
    "timezone": "America/New_York"
  }'
```

**Expected Response (200):**
```json
{
  "post": {
    "id": "post-uuid",
    "status": "scheduled",
    "scheduledAt": "2024-01-20T14:00:00Z"
  }
}
```

---

### 5.3 Publish Post

**Test:** Publish post immediately

```bash
curl -X POST "$API_URL/api/posts/$POST_ID/publish" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "post": {
    "id": "post-uuid",
    "status": "published",
    "publishedAt": "2024-01-15T10:30:00Z",
    "results": [
      {
        "platform": "twitter",
        "status": "success",
        "postId": "twitter-post-id"
      },
      {
        "platform": "linkedin",
        "status": "success",
        "postId": "linkedin-post-id"
      }
    ]
  }
}
```

---

### 5.4 Get Post Details

**Test:** Get specific post

```bash
curl -X GET "$API_URL/api/posts/$POST_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "post": {
    "id": "post-uuid",
    "content": "Check out our new feature! 🎉",
    "platforms": ["twitter", "linkedin"],
    "status": "published",
    "createdAt": "2024-01-15T10:30:00Z",
    "publishedAt": "2024-01-15T10:35:00Z"
  }
}
```

---

### 5.5 List Posts

**Test:** Get all posts in team

```bash
curl -X GET "$API_URL/api/posts?teamId=$TEAM_ID&status=published&page=1" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "posts": [
    {
      "id": "post-uuid",
      "content": "Check out our new feature! 🎉",
      "status": "published",
      "platforms": ["twitter", "linkedin"]
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

---

## 6. Social Account Connection Tests

### 6.1 Get Twitter Auth URL

**Test:** Get authorization URL for Twitter

```bash
curl -X GET "$API_URL/api/social-accounts/twitter/auth-url?teamId=$TEAM_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "authUrl": "https://twitter.com/i/oauth2/authorize?client_id=...",
  "state": "random-state-token"
}
```

**Action:** Visit `authUrl` in browser, authorize app

---

### 6.2 Connect Social Account (Callback)

**Test:** Complete social account connection

```bash
# User is redirected to this after authorizing
curl -X POST "$API_URL/api/social-accounts/twitter/callback" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "code": "authorization-code-from-twitter",
    "state": "random-state-token",
    "teamId": "'$TEAM_ID'"
  }'
```

**Expected Response (201):**
```json
{
  "account": {
    "id": "social-account-uuid",
    "platform": "twitter",
    "username": "@yourusername",
    "accountId": "twitter-user-id",
    "connectedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 6.3 List Connected Accounts

**Test:** Get all connected social accounts

```bash
curl -X GET "$API_URL/api/social-accounts?teamId=$TEAM_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "accounts": [
    {
      "id": "social-account-uuid",
      "platform": "twitter",
      "username": "@yourusername",
      "connectedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 6.4 Disconnect Social Account

**Test:** Remove social account connection

```bash
curl -X DELETE "$API_URL/api/social-accounts/social-account-uuid" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (204):** No content

---

## 7. Analytics Tests

### 7.1 Get Analytics Overview

**Test:** Get dashboard metrics

```bash
curl -X GET "$API_URL/api/analytics/overview?teamId=$TEAM_ID&period=last_30_days" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "overview": {
    "totalPosts": 42,
    "totalEngagement": 1250,
    "totalReach": 15000,
    "averageEngagementRate": 8.3,
    "topPlatform": "twitter",
    "trend": "up"
  }
}
```

---

### 7.2 Get Post Analytics

**Test:** Get metrics for specific post

```bash
curl -X GET "$API_URL/api/analytics/posts/$POST_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "analytics": {
    "postId": "post-uuid",
    "impressions": 5000,
    "engagement": 250,
    "engagementRate": 5.0,
    "clicks": 75,
    "shares": 25,
    "comments": 50,
    "platforms": {
      "twitter": {
        "impressions": 3000,
        "engagement": 150
      },
      "linkedin": {
        "impressions": 2000,
        "engagement": 100
      }
    }
  }
}
```

---

## 8. Complete User Journey Test

### Full Flow:

```bash
#!/bin/bash

API_URL="http://localhost:3001"

# 1. Register
echo "1. Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "e2e-test-'$(date +%s)'@example.com",
    "password": "TestPassword123!",
    "name": "E2E Test User"
  }')

ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
USER_ID=$(echo $REGISTER_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "✓ User registered: $USER_ID"
echo "✓ Access token: $ACCESS_TOKEN"

# 2. Create team
echo -e "\n2. Creating team..."
TEAM_RESPONSE=$(curl -s -X POST "$API_URL/api/teams" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "E2E Test Team",
    "description": "Testing team"
  }')

TEAM_ID=$(echo $TEAM_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
echo "✓ Team created: $TEAM_ID"

# 3. Generate AI content
echo -e "\n3. Generating AI content..."
AI_RESPONSE=$(curl -s -X POST "$API_URL/api/ai/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "type": "social_post",
    "platform": "twitter",
    "topic": "software development",
    "tone": "professional"
  }')

echo "✓ Content generated"

# 4. Create post
echo -e "\n4. Creating post..."
POST_RESPONSE=$(curl -s -X POST "$API_URL/api/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "teamId": "'$TEAM_ID'",
    "content": "Great productivity tip: use keyboard shortcuts!",
    "platforms": ["twitter"],
    "status": "draft"
  }')

POST_ID=$(echo $POST_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
echo "✓ Post created: $POST_ID"

# 5. Get analytics
echo -e "\n5. Fetching analytics..."
curl -s -X GET "$API_URL/api/analytics/overview?teamId=$TEAM_ID&period=last_30_days" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'

echo -e "\n✓ End-to-end test completed successfully!"
```

---

## Debugging Tips

### Enable Verbose Logging

```bash
# Add to cURL
curl -v -X GET "$API_URL/api/teams" ...

# Check response headers, timing, etc.
```

### Pretty Print JSON

```bash
# Pipe to jq
curl -s "$API_URL/api/teams" -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

### Check Status Codes

```bash
# Get just the HTTP status
curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/api/teams"
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Token expired or invalid. Re-login with fresh token |
| 403 Forbidden | User doesn't have permission. Check role/membership |
| 404 Not Found | Resource doesn't exist. Check ID is correct |
| 422 Validation Error | Check request body matches schema |
| 500 Server Error | Check API logs. May be database connection issue |

---

## Performance Testing

### Load Test Authentication

```bash
for i in {1..100}; do
  curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "password"
    }' &
done
wait
```

### Response Time Check

```bash
time curl -s "$API_URL/api/teams" \
  -H "Authorization: Bearer $ACCESS_TOKEN" > /dev/null
```

---

