/**
 * Engagement Scheduler
 * Automates audience engagement on X (Twitter)
 * - Auto-reply to mentions
 * - Auto-like relevant posts
 * - Auto-follow engaged users
 * - Auto-repost trending content
 */

const { callXMCPTool } = require('../services/xmcp-client');
const { supabase } = require('../lib/supabase');
const { generateSmartReply } = require('../services/ai-reply-generator');

class EngagementScheduler {
  constructor(config = {}) {
    this.config = {
      mentionCheckInterval: 5 * 60 * 1000, // 5 minutes
      likeCheckInterval: 10 * 60 * 1000, // 10 minutes
      followCheckInterval: 30 * 60 * 1000, // 30 minutes
      repostCheckInterval: 60 * 60 * 1000, // 1 hour
      maxActionsPerRun: 5,
      throttleDelay: 2000, // 2 seconds between actions
      ...config
    };
    this.jobs = [];
    this.running = false;
  }

  start() {
    if (this.running) {
      console.log('⚠️  Engagement scheduler already running');
      return;
    }

    this.running = true;
    console.log('🤖 Starting engagement scheduler...');

    // Auto-reply to mentions
    this.jobs.push(
      setInterval(
        () => this.autoReplyToMentions().catch(err => console.error('Auto-reply error:', err)),
        this.config.mentionCheckInterval
      )
    );

    // Auto-like relevant posts
    this.jobs.push(
      setInterval(
        () => this.autoLikeRelevantPosts().catch(err => console.error('Auto-like error:', err)),
        this.config.likeCheckInterval
      )
    );

    // Auto-follow engaged users
    this.jobs.push(
      setInterval(
        () => this.autoFollowEngagedUsers().catch(err => console.error('Auto-follow error:', err)),
        this.config.followCheckInterval
      )
    );

    // Auto-repost trending content
    this.jobs.push(
      setInterval(
        () => this.autoRepostTrending().catch(err => console.error('Auto-repost error:', err)),
        this.config.repostCheckInterval
      )
    );

    console.log('✅ Engagement scheduler started (4 jobs active)');
  }

  stop() {
    this.jobs.forEach(job => clearInterval(job));
    this.jobs = [];
    this.running = false;
    console.log('⏹️  Engagement scheduler stopped');
  }

  /**
   * Auto-reply to mentions
   * Finds recent mentions and replies with AI-generated responses
   */
  async autoReplyToMentions() {
    try {
      const userId = process.env.X_USER_ID;
      if (!userId) {
        console.log('⚠️  X_USER_ID not configured, skipping auto-reply');
        return;
      }

      // Find recent mentions
      const mentions = await callXMCPTool('searchPostsRecent', {
        query: `@${process.env.X_HANDLE}`,
        max_results: this.config.maxActionsPerRun
      });

      if (!mentions || mentions.length === 0) {
        console.log('ℹ️  No new mentions found');
        return;
      }

      for (const mention of mentions) {
        try {
          // Check if already replied
          const { data: existing } = await supabase
            .from('engagement_log')
            .select('id')
            .eq('post_id', mention.id)
            .eq('action', 'auto_reply')
            .single();

          if (existing) {
            console.log(`⏭️  Already replied to ${mention.id}, skipping`);
            continue;
          }

          // Generate AI response
          const reply = await generateSmartReply(mention.text);

          // Post reply
          const result = await callXMCPTool('createPosts', {
            text: reply,
            reply: {
              in_reply_to_tweet_id: mention.id
            }
          });

          // Log engagement
          await supabase.from('engagement_log').insert({
            post_id: mention.id,
            author_id: mention.author_id,
            action: 'auto_reply',
            content: reply,
            response_id: result?.id,
            timestamp: new Date()
          });

          console.log(`✅ Replied to mention: ${mention.id}`);

          // Throttle
          await this.sleep(this.config.throttleDelay);
        } catch (err) {
          console.error(`Error replying to ${mention.id}:`, err);
        }
      }
    } catch (error) {
      console.error('Auto-reply job error:', error);
    }
  }

  /**
   * Auto-like relevant posts
   * Finds and likes posts matching configured keywords
   */
  async autoLikeRelevantPosts() {
    try {
      const keywords = process.env.ENGAGEMENT_KEYWORDS?.split(',') || ['AI', 'technology'];
      const userId = process.env.X_USER_ID;

      for (const keyword of keywords) {
        try {
          // Find recent posts with keyword
          const posts = await callXMCPTool('searchPostsRecent', {
            query: keyword,
            max_results: this.config.maxActionsPerRun
          });

          if (!posts || posts.length === 0) continue;

          for (const post of posts) {
            try {
              // Don't like own posts
              if (post.author_id === userId) {
                console.log(`⏭️  Skipping own post: ${post.id}`);
                continue;
              }

              // Check if already liked
              const { data: existing } = await supabase
                .from('engagement_log')
                .select('id')
                .eq('post_id', post.id)
                .eq('action', 'auto_like')
                .single();

              if (existing) {
                console.log(`⏭️  Already liked ${post.id}, skipping`);
                continue;
              }

              // Like the post
              const result = await callXMCPTool('likePost', {
                id: post.id
              });

              // Log engagement
              await supabase.from('engagement_log').insert({
                post_id: post.id,
                author_id: post.author_id,
                action: 'auto_like',
                keyword: keyword,
                timestamp: new Date()
              });

              console.log(`❤️  Liked post about "${keyword}": ${post.id}`);

              await this.sleep(this.config.throttleDelay);
            } catch (err) {
              console.error(`Error liking ${post.id}:`, err);
            }
          }
        } catch (err) {
          console.error(`Error processing keyword "${keyword}":`, err);
        }
      }
    } catch (error) {
      console.error('Auto-like job error:', error);
    }
  }

  /**
   * Auto-follow engaged users
   * Follows users who engage with your posts
   */
  async autoFollowEngagedUsers() {
    try {
      const userId = process.env.X_USER_ID;
      if (!userId) {
        console.log('⚠️  X_USER_ID not configured, skipping auto-follow');
        return;
      }

      // Get your recent posts
      const yourPosts = await callXMCPTool('getUsersPosts', {
        id: userId,
        max_results: 3
      });

      if (!yourPosts || yourPosts.length === 0) {
        console.log('ℹ️  No recent posts found');
        return;
      }

      for (const post of yourPosts) {
        try {
          // Get users who liked this post
          const likers = await callXMCPTool('getPostsLikingUsers', {
            id: post.id,
            max_results: this.config.maxActionsPerRun
          });

          if (!likers || likers.length === 0) continue;

          for (const user of likers) {
            try {
              // Check if already following
              const { data: following } = await supabase
                .from('engagement_log')
                .select('id')
                .eq('author_id', user.id)
                .eq('action', 'auto_follow')
                .single();

              if (following) {
                console.log(`⏭️  Already followed ${user.id}, skipping`);
                continue;
              }

              // Follow the user
              const result = await callXMCPTool('followUser', {
                target_user_id: user.id
              });

              // Log engagement
              await supabase.from('engagement_log').insert({
                author_id: user.id,
                action: 'auto_follow',
                source_post_id: post.id,
                timestamp: new Date()
              });

              console.log(`👤 Followed user: ${user.username}`);

              await this.sleep(this.config.throttleDelay * 2);
            } catch (err) {
              console.error(`Error following ${user.id}:`, err);
            }
          }
        } catch (err) {
          console.error(`Error processing post ${post.id}:`, err);
        }
      }
    } catch (error) {
      console.error('Auto-follow job error:', error);
    }
  }

  /**
   * Auto-repost trending content
   * Reposts relevant content from trends
   */
  async autoRepostTrending() {
    try {
      // Get world trends
      const trends = await callXMCPTool('getTrendsByWoeid', {
        woeid: 1 // Worldwide
      });

      if (!trends || trends.length === 0) {
        console.log('ℹ️  No trends found');
        return;
      }

      // Get your interests
      const keywords = process.env.ENGAGEMENT_KEYWORDS?.split(',') || ['AI', 'technology'];

      // Find matching trends
      const relevantTrends = trends.filter(trend =>
        keywords.some(keyword =>
          trend.name.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      if (relevantTrends.length === 0) {
        console.log('ℹ️  No relevant trends found');
        return;
      }

      // Find posts from relevant trend
      const trend = relevantTrends[0];
      const posts = await callXMCPTool('searchPostsRecent', {
        query: trend.name,
        max_results: this.config.maxActionsPerRun
      });

      if (!posts || posts.length === 0) return;

      for (const post of posts) {
        try {
          // Check if already reposted
          const { data: existing } = await supabase
            .from('engagement_log')
            .select('id')
            .eq('post_id', post.id)
            .eq('action', 'auto_repost')
            .single();

          if (existing) {
            console.log(`⏭️  Already reposted ${post.id}, skipping`);
            continue;
          }

          // Repost the content
          const result = await callXMCPTool('repostPost', {
            id: post.id
          });

          // Log engagement
          await supabase.from('engagement_log').insert({
            post_id: post.id,
            author_id: post.author_id,
            action: 'auto_repost',
            trend: trend.name,
            timestamp: new Date()
          });

          console.log(`🔄 Reposted trending content: ${post.id}`);

          await this.sleep(this.config.throttleDelay);
        } catch (err) {
          console.error(`Error reposting ${post.id}:`, err);
        }
      }
    } catch (error) {
      console.error('Auto-repost job error:', error);
    }
  }

  /**
   * Utility: Sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = EngagementScheduler;
