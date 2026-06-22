# Auto-Engagement System

Complete automated engagement system for X (Twitter) using XMCP.

## Features

### 1. Auto-Reply to Mentions
Automatically replies to mentions using AI-generated responses.

- **Trigger**: New mentions of your account
- **Frequency**: Every 5 minutes
- **Tools**: `searchPostsRecent`, `createPosts`
- **AI**: Claude generates contextual replies

### 2. Auto-Like Relevant Posts
Finds and likes posts matching your interests.

- **Trigger**: Posts containing keywords
- **Frequency**: Every 10 minutes
- **Tools**: `searchPostsRecent`, `likePost`
- **Keywords**: Configurable (default: AI, technology)

### 3. Auto-Follow Engaged Users
Follows users who engage with your posts.

- **Trigger**: Users who like/reply to your posts
- **Frequency**: Every 30 minutes
- **Tools**: `getUsersPosts`, `getPostsLikingUsers`, `followUser`
- **Filters**: Min followers, account age, suspicious activity

### 4. Auto-Repost Trending Content
Shares trending content relevant to your niche.

- **Trigger**: Trending topics
- **Frequency**: Every 1 hour
- **Tools**: `getTrendsByWoeid`, `searchPostsRecent`, `repostPost`
- **Filters**: Engagement threshold, quality checks

## Setup

### 1. Configure Environment Variables

Add to `.env`:

```env
# Auto-engagement
ENGAGEMENT_ENABLED=true
X_USER_ID=your_user_id
X_HANDLE=your_handle

# Keywords for engagement
ENGAGEMENT_KEYWORDS=AI,technology,startup,machine learning

# Individual feature toggles
AUTO_REPLY_ENABLED=true
AUTO_LIKE_ENABLED=true
AUTO_FOLLOW_ENABLED=true
AUTO_REPOST_ENABLED=true
AI_REPLY_ENABLED=true

# Rate limiting
MAX_AUTO_LIKES_PER_HOUR=100
MAX_AUTO_FOLLOWS_PER_DAY=50
MAX_AUTO_REPOSTS_PER_DAY=10

# AI settings
AI_REPLY_TONE=friendly
AI_REPLY_INSTRUCTIONS=Keep replies short and helpful
```

### 2. Install Dependencies

```bash
npm install @anthropic-ai/sdk
```

### 3. Start the Scheduler

```javascript
// In your main server file
const EngagementScheduler = require('./jobs/engagement-scheduler');
const scheduler = new EngagementScheduler();

// Start on app startup
scheduler.start();

// Stop on app shutdown
process.on('SIGTERM', () => {
  scheduler.stop();
});
```

### 4. Database Setup

Create engagement log table in Supabase:

```sql
CREATE TABLE engagement_log (
  id BIGSERIAL PRIMARY KEY,
  post_id TEXT,
  author_id TEXT,
  action VARCHAR(50), -- 'auto_reply', 'auto_like', 'auto_follow', 'auto_repost'
  content TEXT, -- For replies, the reply text
  response_id TEXT, -- ID of created post (for replies)
  keyword VARCHAR(100), -- For likes, the keyword that matched
  source_post_id TEXT, -- For follows, the post that triggered follow
  trend TEXT, -- For reposts, the trend name
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_engagement_action ON engagement_log(action);
CREATE INDEX idx_engagement_author ON engagement_log(author_id);
CREATE INDEX idx_engagement_post ON engagement_log(post_id);
```

## API Integration

### Starting Auto-Engagement

```javascript
const router = require('express').Router();
const EngagementScheduler = require('../jobs/engagement-scheduler');

// Initialize scheduler
let scheduler;

router.post('/engage/start', async (req, res) => {
  try {
    if (!scheduler) {
      scheduler = new EngagementScheduler({
        mentionCheckInterval: 5 * 60 * 1000,
        likeCheckInterval: 10 * 60 * 1000,
        followCheckInterval: 30 * 60 * 1000
      });
    }
    
    scheduler.start();
    res.json({ success: true, message: 'Engagement scheduler started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop auto-engagement
router.post('/engage/stop', (req, res) => {
  if (scheduler) {
    scheduler.stop();
  }
  res.json({ success: true, message: 'Engagement scheduler stopped' });
});

// Get engagement stats
router.get('/engage/stats', async (req, res) => {
  try {
    const stats = await supabase
      .from('engagement_log')
      .select('action, count(*)')
      .groupBy('action');
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

## Monitoring

### View Engagement Logs

```javascript
// Get all engagements today
const today = new Date().toISOString().split('T')[0];

const { data } = await supabase
  .from('engagement_log')
  .select('*')
  .gte('timestamp', `${today}T00:00:00`)
  .order('timestamp', { ascending: false });

console.log(data);
```

### Dashboard Metrics

```javascript
// Get engagement summary
const summary = await supabase
  .from('engagement_log')
  .select('action')
  .then(res => {
    const counts = {};
    res.data.forEach(log => {
      counts[log.action] = (counts[log.action] || 0) + 1;
    });
    return counts;
  });

// Example output:
// {
//   auto_reply: 24,
//   auto_like: 87,
//   auto_follow: 12,
//   auto_repost: 3
// }
```

## Best Practices

### ✅ Do's
- Spread actions over time (5-30 min intervals)
- Use AI to generate unique replies
- Filter low-quality accounts before following
- Monitor engagement logs for quality
- Respect X API rate limits
- Use quality filters to avoid spam

### ❌ Don'ts
- Spam replies to every mention
- Like more than 100 posts per hour
- Follow/unfollow rapidly
- Reply with identical messages
- Engage with spam accounts
- Ignore rate limit warnings

## Rate Limits

X API enforces rate limits:

| Action | Limit | Window |
|--------|-------|--------|
| Search (free) | 300 | 15 mins |
| Tweets/replies | 450 | 15 mins |
| Likes | 1000 | 24 hours |
| Follows | 400 | 15 mins |
| Unfollows | 400 | 15 mins |

The scheduler respects these limits and logs warnings when approaching thresholds.

## Troubleshooting

### No engagements happening

1. Check `ENGAGEMENT_ENABLED=true` in `.env`
2. Verify X credentials are correct
3. Check scheduler logs: `DEBUG=engagement-* npm start`
4. Ensure XMCP server is running

### AI replies not generating

1. Verify `ANTHROPIC_API_KEY` is set
2. Check Claude API quota
3. Review engagement logs for error messages
4. Try testing with `generateSmartReply()` directly

### Getting rate limited

1. Increase throttle delays in config
2. Reduce max actions per run
3. Spread check intervals further apart
4. Monitor engagement logs to see which action is throttled

## Advanced Configuration

### Custom Filters

```javascript
// In engagement-scheduler.js
const shouldEngage = (post) => {
  // Skip posts with certain keywords
  const bannedWords = ['spam', 'adult'];
  if (bannedWords.some(word => post.text.toLowerCase().includes(word))) {
    return false;
  }

  // Skip low-engagement posts
  if (post.like_count + post.reply_count < 5) {
    return false;
  }

  // Skip suspicious accounts
  if (post.author.followers_count < 100) {
    return false;
  }

  return true;
};
```

### Custom Reply Tone

```javascript
// Pass tone to AI generator
const reply = await generateSmartReply(mentionText, {
  tone: 'professional', // friendly, professional, casual, humorous
  maxLength: 280,
  includeEmoji: false,
  customInstructions: 'Always mention the product name'
});
```

## Files

- `engagement-scheduler.js` - Main scheduler class
- `ai-reply-generator.js` - AI reply generation service
- `../config/engagement.config.js` - Configuration settings
- `ENGAGEMENT_README.md` - This file

## Support

For issues or questions:
1. Check logs: `supabase.from('engagement_log').select('*')`
2. Review rate limit status
3. Verify X API credentials
4. Test XMCP connection: `python server.py` in services/xmcp/
