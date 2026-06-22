/**
 * Engagement Configuration
 * Settings for auto-engagement features
 */

module.exports = {
  // Enable/disable auto-engagement
  enabled: process.env.ENGAGEMENT_ENABLED === 'true',

  // X API credentials
  xUserId: process.env.X_USER_ID,
  xHandle: process.env.X_HANDLE,

  // Auto-reply settings
  autoReply: {
    enabled: process.env.AUTO_REPLY_ENABLED !== 'false',
    checkInterval: 5 * 60 * 1000, // 5 minutes
    maxPerRun: 5,
    responseDelay: 2000, // 2 seconds
    onlyFromFollowers: false, // Set true to only reply to followers
    filterSpam: true // Auto-detect and skip spam
  },

  // Auto-like settings
  autoLike: {
    enabled: process.env.AUTO_LIKE_ENABLED !== 'false',
    checkInterval: 10 * 60 * 1000, // 10 minutes
    maxPerRun: 10,
    responseDelay: 2000,
    keywords: (process.env.ENGAGEMENT_KEYWORDS || 'AI,technology,startup').split(','),
    maxLikesPerHour: 100, // Rate limit
    excludeOwnPosts: true,
    filterRetweets: false
  },

  // Auto-follow settings
  autoFollow: {
    enabled: process.env.AUTO_FOLLOW_ENABLED !== 'false',
    checkInterval: 30 * 60 * 1000, // 30 minutes
    maxPerRun: 5,
    responseDelay: 5000, // 5 seconds (respect rate limits)
    maxFollowsPerDay: 50,
    minFollowerCount: 100, // Don't follow accounts with <100 followers
    maxFollowingRatio: 2, // Don't follow if following > followers * 2
    filterBots: true,
    engagementThreshold: 1 // Must have at least 1 engagement with your posts
  },

  // Auto-repost settings
  autoRepost: {
    enabled: process.env.AUTO_REPOST_ENABLED !== 'false',
    checkInterval: 60 * 60 * 1000, // 1 hour
    maxPerRun: 3,
    responseDelay: 2000,
    focusKeywords: (process.env.ENGAGEMENT_KEYWORDS || 'AI,technology,startup').split(','),
    maxRepostsPerDay: 10,
    filterLowEngagement: true,
    minLikes: 5
  },

  // AI reply generation
  aiReply: {
    enabled: process.env.AI_REPLY_ENABLED !== 'false',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 150,
    tone: 'friendly', // friendly, professional, casual, humorous
    excludeKeywords: ['spam', 'adult'], // Don't reply to these
    customInstructions: process.env.AI_REPLY_INSTRUCTIONS || ''
  },

  // Logging and monitoring
  logging: {
    enabled: true,
    logToDatabase: true, // Store in Supabase
    logToConsole: true,
    auditTrail: true // Track all engagements
  },

  // Safety & compliance
  safety: {
    enabled: true,
    checkRateLimits: true,
    respectApiLimits: true,
    preventSpamming: true,
    preventAbuse: true,
    maxActionsPerHour: 100,
    suspiciousActivityThreshold: 50 // Actions to flag for review
  },

  // Engagement quality filters
  quality: {
    filterSpam: true,
    filterBots: true,
    filterBanned: true,
    filterSuspiciousAccounts: true,
    minAccountAge: 30, // Days
    minFollowers: 10
  }
};
