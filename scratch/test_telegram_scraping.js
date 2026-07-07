const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://t.me/',
};

async function testScraping() {
  const channel = 'jossycarmar';
  const url = `https://t.me/s/${channel}`;
  try {
    console.log(`Fetching ${url}...`);
    const res = await axios.get(url, { headers: HEADERS });
    const $ = cheerio.load(res.data);
    
    const posts = [];
    $('.tgme_widget_message_wrap').each((index, el) => {
      const text = $(el).find('.tgme_widget_message_text').text().trim();
      const id = $(el).find('.tgme_widget_message').attr('data-post');
      
      const photos = [];
      $(el).find('.tgme_widget_message_photo_wrap').each((_i, photoEl) => {
        const style = $(photoEl).attr('style') || '';
        const match = style.match(/background-image:url\('(.+?)'\)/);
        if (match?.[1]) photos.push(match[1]);
      });
      
      posts.push({ id, text: text.substring(0, 100), photosCount: photos.length });
    });
    
    console.log(`Found ${posts.length} posts on page 1:`);
    console.log(posts);
  } catch (err) {
    console.error(err.message);
  }
}

testScraping();
