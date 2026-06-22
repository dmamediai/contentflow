/**
 * AI Reply Generator
 * Generates contextual, intelligent replies to mentions using Claude API
 */

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic();

/**
 * Generate a smart reply to a mention
 * @param {string} mentionText - The mention text to reply to
 * @param {object} context - Additional context (username, followers, etc)
 * @returns {Promise<string>} - Generated reply (max 280 chars for Twitter)
 */
async function generateSmartReply(mentionText, context = {}) {
  try {
    const prompt = `You are a helpful social media manager. Generate a friendly, concise reply to this Twitter mention. Keep it under 280 characters.

Mention: "${mentionText}"

Guidelines:
- Be helpful and friendly
- Keep it short and punchy
- No hashtags unless relevant
- Natural tone, not robotic
- Relevant to the mention

Reply:`;

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    let reply = message.content[0].text.trim();

    // Ensure it's under 280 characters
    if (reply.length > 280) {
      reply = reply.substring(0, 277) + '...';
    }

    return reply;
  } catch (error) {
    console.error('Error generating smart reply:', error);
    // Fallback reply
    return 'Thanks for reaching out! 🙏';
  }
}

/**
 * Generate a caption for a repost
 * @param {string} originalText - The original post text
 * @returns {Promise<string>} - Generated caption
 */
async function generateRepostCaption(originalText) {
  try {
    const prompt = `Create a short, engaging repost caption for this content. Keep it under 100 characters.

Original: "${originalText}"

Caption:`;

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return message.content[0].text.trim();
  } catch (error) {
    console.error('Error generating repost caption:', error);
    return 'Great share! 👍';
  }
}

module.exports = {
  generateSmartReply,
  generateRepostCaption
};
