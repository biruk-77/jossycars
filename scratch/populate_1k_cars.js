const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');

const MONGODB_URI = 'mongodb+srv://whatsrye_db_user:tDahYFzP6xbWRUin@cluster0.vyv2ezx.mongodb.net/realcars?retryWrites=true&w=majority&appName=Cluster0';
const CHANNEL = 'jossycarmar';
const TARGET_COUNT = 1100;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://t.me/',
};

// Simple Listing parser from server.js
function parseListing(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let title = 'Premium Vehicle';
  let price = 'Contact for Price';
  const details = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.startsWith('make:') || lower.startsWith('model:')) {
      details.push(line);
    } else if (lower.startsWith('price:')) {
      price = line.replace(/price:/i, '').trim();
    } else {
      details.push(line);
    }
  }

  if (lines.length > 0) {
    // Try to construct a good title
    const makeLine = lines.find(l => l.toLowerCase().startsWith('make:'));
    const modelLine = lines.find(l => l.toLowerCase().startsWith('model:'));
    if (makeLine || modelLine) {
      const mk = makeLine ? makeLine.replace(/make:/i, '').trim() : '';
      const md = modelLine ? modelLine.replace(/model:/i, '').trim() : '';
      title = `${mk} ${md}`.trim();
    } else {
      title = lines[0].substring(0, 40);
    }
  }

  return { title, price, details: details.join('\n') };
}

function extractPosts($, allPosts) {
  let count = 0;
  $('.tgme_widget_message_wrap').each((index, element) => {
    const postText = $(element).find('.tgme_widget_message_text').text().trim();
    const photos = [];
    $(element).find('.tgme_widget_message_photo_wrap').each((_i, photoEl) => {
      const style = $(photoEl).attr('style') || '';
      const match = style.match(/background-image:url\('(.+?)'\)/);
      if (match?.[1]) photos.push(match[1]);
    });

    if (!postText && photos.length === 0) return;

    const postId = $(element).find('.tgme_widget_message').attr('data-post') || `tg-${Date.now()}-${index}`;
    if (allPosts.some(p => p.id === postId)) return;

    const parsed = parseListing(postText);
    allPosts.push({
      id: postId,
      title: parsed.title,
      price: parsed.price,
      details: parsed.details || postText,
      photos: photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'],
      date: $(element).find('time[datetime]').attr('datetime') ||
            $(element).find('.tgme_widget_message_date time').attr('datetime') ||
            new Date().toISOString(),
      link: $(element).find('.tgme_widget_message_date').attr('href') || `https://t.me/${CHANNEL}`,
      isMock: false
    });
    count++;
  });
  return count;
}

async function run() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    // Define Model
    const CarSchema = new mongoose.Schema({
      id: { type: String, unique: true },
      title: String,
      price: String,
      details: String,
      photos: [String],
      date: String,
      link: String,
      isMock: Boolean
    }, { timestamps: true });
    
    let Car;
    try {
      Car = mongoose.model('Car');
    } catch {
      Car = mongoose.model('Car', CarSchema);
    }

    const allPosts = [];
    const firstUrl = `https://t.me/s/${CHANNEL}`;
    console.log(`Fetching page 1: ${firstUrl}...`);
    const firstRes = await axios.get(firstUrl, { headers: HEADERS });
    const $first = cheerio.load(firstRes.data);
    extractPosts($first, allPosts);
    console.log(`Page 1 fetched. Total scraped: ${allPosts.length}`);

    let oldestId = null;
    const firstMsg = $first('.tgme_widget_message').first();
    if (firstMsg.length > 0) {
      oldestId = firstMsg.attr('data-post');
    }

    let pages = 0;
    while (allPosts.length < TARGET_COUNT && oldestId) {
      const postNum = parseInt(oldestId.split('/')[1]);
      if (!postNum || postNum <= 1) {
        console.log('Reached oldest channel post.');
        break;
      }

      const pageUrl = `https://t.me/s/${CHANNEL}?before=${postNum}`;
      console.log(`[Pages Scraped: ${pages}] Fetching: ${pageUrl}... (Total posts: ${allPosts.length})`);

      try {
        const res = await axios.get(pageUrl, { headers: HEADERS });
        const $page = cheerio.load(res.data);
        const beforeCount = allPosts.length;
        extractPosts($page, allPosts);
        
        if (allPosts.length === beforeCount) {
          console.log('No new posts added on this page. Breaking.');
          break;
        }

        let newOldestId = null;
        const pageFirstMsg = $page('.tgme_widget_message').first();
        if (pageFirstMsg.length > 0) {
          newOldestId = pageFirstMsg.attr('data-post');
        }
        if (!newOldestId || newOldestId === oldestId) {
          console.log('Oldest ID did not change. Breaking.');
          break;
        }
        oldestId = newOldestId;
      } catch (err) {
        console.error(`Error on page fetch: ${err.message}`);
        break;
      }

      pages++;
      // Save progress to DB incrementally in batches of 100
      if (allPosts.length % 100 === 0 || allPosts.length > TARGET_COUNT) {
        console.log(`Saving batch of ${allPosts.length} to DB...`);
        for (const item of allPosts) {
          await Car.findOneAndUpdate({ id: item.id }, item, { upsert: true }).catch(() => {});
        }
      }

      // Small throttle to avoid hitting Telegram rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Scraping complete. Saving all ${allPosts.length} posts to database...`);
    let savedCount = 0;
    for (const item of allPosts) {
      try {
        await Car.findOneAndUpdate({ id: item.id }, item, { upsert: true });
        savedCount++;
      } catch (err) {
        // Ignore duplicate key errors if concurrent requests happen
      }
    }
    console.log(`Finished! Successfully saved/updated ${savedCount} posts in MongoDB!`);
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

run();
