const axios = require('axios');
const fs = require('fs');

async function test() {
  try {
    const id = '7648654778792152321';
    const url = `https://www.tiktok.com/embed/v2/${id}`;
    console.log('Fetching', url);
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    fs.writeFileSync('scratch/tiktok_embed.html', data);
    console.log('Saved to scratch/tiktok_embed.html');
    
    // Search for video links or json data
    const matches = data.match(/https?:\/\/[^\s"'`<>]+?\.(?:mp4|m3u8)[^\s"'`<>]*/g);
    console.log('Regex matches for mp4/m3u8:', matches);
    
    // Also look for SIGI_STATE or __INIT_DATA__
    const sigi = data.match(/<script id="SIGI_STATE" type="application\/json">([\s\S]+?)<\/script>/);
    if (sigi) {
      console.log('Found SIGI_STATE');
      fs.writeFileSync('scratch/sigi.json', sigi[1]);
    }
    const renderData = data.match(/<script id="RENDER_DATA" type="application\/json">([\s\S]+?)<\/script>/);
    if (renderData) {
      console.log('Found RENDER_DATA');
      fs.writeFileSync('scratch/render_data.json', decodeURIComponent(renderData[1]));
    }
  } catch (err) {
    console.error(err);
  }
}

test();
