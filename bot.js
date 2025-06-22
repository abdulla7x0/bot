require('dotenv').config(); // Load environment variables

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Get your token and tag from .env file
const TOKEN = process.env.TOKEN;
const AFFILIATE_TAG = process.env.AFFILIATE_TAG;

// Initialize bot
const bot = new TelegramBot(TOKEN, { polling: true });

// Start command
bot.onText(/\/start/, (msg) => {
  const welcomeText = `👋 *Welcome to Zendeal Bot!*\n\n📦 Send me any Amazon product link and I'll convert it into your personal affiliate link with *24-hour earning* tracking.\n\n💰 Share the link, and earn a part of the commission when people buy from it.`;
  bot.sendMessage(msg.chat.id, welcomeText, { parse_mode: 'Markdown' });
});

// Handle incoming messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/')) return;


  try {
    let url = text.trim();

    // Expand short amzn.in links
    if (url.includes('amzn.in')) {
      const res = await axios.get(url, {
        maxRedirects: 0,
        validateStatus: (status) => status === 301 || status === 302,
      });
      url = res.headers.location;
    }

    // Extract ASIN
    const amazonRegex = /(?:https?:\/\/)?(?:www\.)?amazon\.[a-z.]{2,6}\/(?:[^\/\n]+\/)*?(?:dp|gp\/product)\/([A-Z0-9]{10})/i;
    const match = url.match(amazonRegex);

    if (match && match[1]) {
      const asin = match[1];
      const affiliateLink = `https://www.amazon.in/dp/${asin}?tag=${AFFILIATE_TAG}`;
      const reply = `✅ *Your Affiliate Link:*\n[Click here to copy and share](${affiliateLink})\n\n🔁 Share this with anyone — if they buy within 24 hours, you get paid! 💸`;
      bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
      console.log(`[LOG] ${msg.from.username || msg.from.first_name} -> ${asin}`);
    } else {
      bot.sendMessage(chatId, '❌ *Please send a valid Amazon product link.*\nExample: https://www.amazon.in/dp/B09XYZ1234', { parse_mode: 'Markdown' });
    }
  } catch (err) {
    console.error('[ERROR]', err.message);
    bot.sendMessage(chatId, '❌ *Something went wrong while processing your link.* Try again later.', { parse_mode: 'Markdown' });
  }
});
