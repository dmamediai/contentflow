# ContentFlow API Documentation

## Base URL

```
https://api.contentflow.app
```

## Authentication

All API requests must include a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": { /* response data */ }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { /* optional error details */ }
  }
}
```

## Authentication Endpoints

### Register

Create a new user account.

**Request**
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password",
  "name": "John Doe",
  "teamName": "My Company"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "team": {
      "id": "team_123",
      "name": "My Company",
      "slug": "my-company"
    },
    "token": "eyJhbGci..."
  }
}
```

### Login

Authenticate with email and password.

**Request**
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "team": {
      "id": "team_123",
      "name": "My Company"
    },
    "token": "eyJhbGci..."
  }
}
```

### Get Session

Get current user session.

**Request**
```
GET /api/auth/session
Authorization: Bearer <jwt_token>
```

**Response**
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "team": { /* team object */ },
    "permissions": ["posts:read", "posts:write", ...]
  }
}
```

## Team Management

### List Teams

Get all teams for current user.

**Request**
```
GET /api/teams
Authorization: Bearer <jwt_token>
```

**Query Parameters**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "team_123",
      "name": "My Company",
      "slug": "my-company",
      "image": "https://...",
      "description": "Description",
      "members": 5,
      "subscription": {
        "plan": "PRO",
        "status": "ACTIVE"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### Get Team Details

Get specific team information.

**Request**
```
GET /api/teams/:teamId
Authorization: Bearer <jwt_token>
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "team_123",
    "name": "My Company",
    "slug": "my-company",
    "image": "https://...",
    "description": "Description",
    "createdAt": "2024-01-01T00:00:00Z",
    "members": [
      {
        "id": "member_1",
        "userId": "user_1",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "OWNER"
      }
    ],
    "subscription": {
      "plan": "PRO",
      "status": "ACTIVE",
      "currentPeriodEnd": "2024-02-01T00:00:00Z"
    }
  }
}
```

## Content Management

### Create Post

Create a new social media post.

**Request**
```
POST /api/posts
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "teamId": "team_123",
  "title": "Optional title",
  "content": "Post content here",
  "contentType": "TEXT",
  "socialAccountIds": ["account_1", "account_2"],
  "scheduledAt": "2024-01-15T14:30:00Z",
  "mediaIds": ["media_1"]
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "post_123",
    "teamId": "team_123",
    "title": "Optional title",
    "content": "Post content here",
    "status": "DRAFT",
    "scheduledAt": "2024-01-15T14:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "socialAccounts": [
      {
        "id": "account_1",
        "platform": "TWITTER",
        "username": "@example"
      }
    ]
  }
}
```

### Get Posts

List all posts for a team.

**Request**
```
GET /api/posts?teamId=team_123&status=DRAFT&page=1&limit=20
Authorization: Bearer <jwt_token>
```

**Query Parameters**
- `teamId` (string): Team ID (required)
- `status` (string): Filter by status (DRAFT, SCHEDULED, PUBLISHED, etc.)
- `page` (number): Page number
- `limit` (number): Items per page
- `sortBy` (string): Sort field (createdAt, scheduledAt, etc.)
- `sortOrder` (string): asc or desc

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "post_123",
      "title": "Post title",
      "content": "Post content",
      "status": "SCHEDULED",
      "scheduledAt": "2024-01-15T14:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### Update Post

Update an existing post.

**Request**
```
PUT /api/posts/:postId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Updated title",
  "content": "Updated content",
  "scheduledAt": "2024-01-20T14:30:00Z"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "post_123",
    "title": "Updated title",
    "content": "Updated content",
    "scheduledAt": "2024-01-20T14:30:00Z",
    "updatedAt": "2024-01-01T00:01:00Z"
  }
}
```

### Publish Post

Publish a post immediately.

**Request**
```
POST /api/posts/:postId/publish
Authorization: Bearer <jwt_token>
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "post_123",
    "status": "PUBLISHED",
    "publishedAt": "2024-01-01T12:00:00Z",
    "socialPosts": [
      {
        "platform": "TWITTER",
        "platformPostId": "1234567890",
        "url": "https://twitter.com/..."
      }
    ]
  }
}
```

## AI Operations

### Generate Content

Generate content using AI.

**Request**
```
POST /api/ai/generate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "operation": "GENERATE_POST",
  "contentType": "TEXT",
  "platform": "TWITTER",
  "prompt": "Create a funny tweet about coding",
  "tone": "casual",
  "language": "en"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "ai_123",
    "content": "Generated content here",
    "operation": "GENERATE_POST",
    "tokensUsed": 150,
    "costUsd": 0.0023,
    "model": "gpt-4"
  }
}
```

### Rewrite Content

Rewrite existing content.

**Request**
```
POST /api/ai/rewrite
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "content": "Original content",
  "tone": "professional",
  "platform": "LINKEDIN"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "ai_124",
    "content": "Rewritten content here",
    "operation": "REWRITE",
    "tokensUsed": 120,
    "costUsd": 0.0018
  }
}
```

## Social Accounts

### Connect Social Account

Connect a social media account.

**Request**
```
POST /api/social-accounts/connect
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "teamId": "team_123",
  "platform": "TWITTER",
  "authCode": "auth_code_from_oauth"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "account_123",
    "platform": "TWITTER",
    "displayName": "John Doe",
    "username": "@johndoe",
    "profileImage": "https://...",
    "connectedAt": "2024-01-01T00:00:00Z"
  }
}
```

### List Connected Accounts

Get all connected social accounts for a team.

**Request**
```
GET /api/social-accounts?teamId=team_123
Authorization: Bearer <jwt_token>
```

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "account_1",
      "platform": "TWITTER",
      "displayName": "John Doe",
      "username": "@johndoe",
      "connectedAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": "account_2",
      "platform": "LINKEDIN",
      "displayName": "John Doe",
      "username": "johndoe",
      "connectedAt": "2024-01-02T00:00:00Z"
    }
  ]
}
```

## Analytics

### Get Overview Analytics

Get high-level analytics for a team.

**Request**
```
GET /api/analytics/overview?teamId=team_123&period=month
Authorization: Bearer <jwt_token>
```

**Query Parameters**
- `teamId` (string): Team ID
- `period` (string): daily, weekly, monthly, yearly
- `from` (date): Start date (ISO 8601)
- `to` (date): End date (ISO 8601)

**Response**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "totalFollowers": 5000,
    "followerGrowth": 150,
    "totalImpressions": 50000,
    "totalEngagements": 2500,
    "avgEngagementRate": 5.0,
    "totalPosts": 25,
    "publishedPosts": 20,
    "scheduledPosts": 5,
    "topPost": {
      "id": "post_123",
      "title": "Best performing post",
      "engagements": 500
    }
  }
}
```

### Get Post Analytics

Get detailed analytics for a specific post.

**Request**
```
GET /api/analytics/posts/:postId
Authorization: Bearer <jwt_token>
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "post_123",
    "title": "Post title",
    "publishedAt": "2024-01-01T12:00:00Z",
    "likes": 250,
    "comments": 50,
    "shares": 25,
    "impressions": 5000,
    "clicks": 150,
    "engagementRate": 5.5,
    "byPlatform": [
      {
        "platform": "TWITTER",
        "likes": 100,
        "retweets": 25,
        "impressions": 2000
      }
    ]
  }
}
```

## Media Library

### Upload Media

Upload media to team library.

**Request**
```
POST /api/media/upload
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

- file: (binary file data)
- teamId: team_123
- type: IMAGE
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "media_123",
    "teamId": "team_123",
    "name": "image.jpg",
    "type": "IMAGE",
    "url": "https://...",
    "publicUrl": "https://...",
    "size": 102400,
    "width": 1920,
    "height": 1080,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### List Media

Get all media in team library.

**Request**
```
GET /api/media?teamId=team_123&type=IMAGE&page=1&limit=20
Authorization: Bearer <jwt_token>
```

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "media_123",
      "name": "image.jpg",
      "type": "IMAGE",
      "url": "https://...",
      "size": 102400,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

## Subscriptions

### Get Current Subscription

Get subscription details for a team.

**Request**
```
GET /api/subscriptions?teamId=team_123
Authorization: Bearer <jwt_token>
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "sub_123",
    "teamId": "team_123",
    "plan": "PRO",
    "status": "ACTIVE",
    "currentPeriodStart": "2024-01-01T00:00:00Z",
    "currentPeriodEnd": "2024-02-01T00:00:00Z",
    "usage": {
      "postsUsed": 45,
      "postsLimit": 1000,
      "aiCreditsUsed": 500,
      "aiCreditsLimit": 10000,
      "teamMembersUsed": 3,
      "teamMembersLimit": 5
    }
  }
}
```

### Upgrade Plan

Upgrade team subscription.

**Request**
```
POST /api/subscriptions/upgrade
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "teamId": "team_123",
  "newPlan": "AGENCY"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "sub_123",
    "plan": "AGENCY",
    "status": "ACTIVE",
    "stripeCheckoutUrl": "https://checkout.stripe.com/..."
  }
}
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | User lacks required permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `BAD_REQUEST` | 400 | Invalid request parameters |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INVALID_TOKEN` | 401 | Invalid JWT token |
| `EXPIRED_TOKEN` | 401 | JWT token has expired |
| `INSUFFICIENT_CREDITS` | 402 | Insufficient AI credits |
| `QUOTA_EXCEEDED` | 402 | Plan quota exceeded |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limits

- General endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- AI endpoints: 50 requests per 15 minutes

## Pagination

All list endpoints support pagination with these parameters:

- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Webhooks

### Post Published

Triggered when a post is published.

```json
{
  "event": "post.published",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "postId": "post_123",
    "teamId": "team_123",
    "socialPosts": [
      {
        "platform": "TWITTER",
        "platformPostId": "1234567890"
      }
    ]
  }
}
```

### Subscription Changed

Triggered when subscription status changes.

```json
{
  "event": "subscription.changed",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "subscriptionId": "sub_123",
    "teamId": "team_123",
    "plan": "PRO",
    "status": "ACTIVE"
  }
}
```

---

For more information, visit the [documentation](https://docs.contentflow.app).
