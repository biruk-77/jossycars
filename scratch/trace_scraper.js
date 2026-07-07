const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://t.me/',
};

function extractPosts($, allPosts, channel) {
  $('.tgme_widget_message_wrap').each((index, element) => {
    const postText = $(element).find('.tgme_widget_message_text').text().trim();
    const photos = [];
    $(element).find('.tgme_widget_message_photo_wrap').each((_i, photoEl) => {
      const style = $(photoEl).attr('style') || '';
      const match = style.match(/background-image:url\('(.+?)'\)/);
      if (match?.[1]) photos.push(match[1]);
    });
    if (!postText && photos.length === 0) return;
    const postId = $(element).find('.tgme_widget_message').attr('data-post') || `tg-${index}`;
    if (allPosts.some(p => p.id === postId)) return;
    allPosts.push({ id: postId, text: postText.substring(0, 50), photosCount: photos.length });
  });
}

async function trace() {
  const channel = 'jossycarmar';
  const limit = 50;
  const allPosts = [];
  
  const firstUrl = `https://t.me/s/${channel}`;
  console.log(`Fetching page 1: ${firstUrl}...`);
  const firstData = await axios.get(firstUrl, { headers: HEADERS }).then(r => r.data);
  const $first = cheerio.load(firstData);
  extractPosts($first, allPosts, channel);
  console.log(`Page 1 fetched. Total posts so far: ${allPosts.length}`);

  let oldestId = null;
  $first('.tgme_widget_message').each((_, el) => {
    const id = $first(el).attr('data-post');
    if (id) oldestId = id;
  });
  console.log(`Initial oldestId: ${oldestId}`);

  let pages = 0;
  while (allPosts.length < limit && oldestId && pages < 10) {
    const postNum = parseInt(oldestId.split('/')[1]);
    if (!postNum || postNum <= 1) {
      console.log(`No valid postNum, breaking.`);
      break;
    }

    const pageUrl = `https://t.me/s/${channel}?before=${postNum}`;
    console.log(`Fetching previous page (pages=${pages}): ${pageUrl}...`);
    try {
      const res = await axios.get(pageUrl, { headers: HEADERS });
      const $page = cheerio.load(res.data);
      const before = allPosts.length;
      extractPosts($page, allPosts, channel);
      console.log(`Fetched page. Posts added: ${allPosts.length - before}. Total: ${allPosts.length}`);
      
      if (allPosts.length === before) {
        console.log(`No new posts added, breaking.`);
        break;
      }

      let newOldestId = null;
      $page('.tgme_widget_message').each((_, el) => {
        const id = $page(el).attr('data-post');
        if (id) newOldestId = id;
      });
      console.log(`New oldestId: ${newOldestId}`);
      if (newOldestId === oldestId) {
        console.log(`oldestId did not change, breaking to prevent loop.`);
        break;
      }
      oldestId = newOldestId;
    } catch (err) {
      console.log(`Error fetching pageUrl: ${err.message}`);
      break;
    }
    pages++;
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`Final total scraped posts: ${allPosts.length}`);
}

trace();
