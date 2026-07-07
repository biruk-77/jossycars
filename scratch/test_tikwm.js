const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TIKTOK_VIDEO_IDS = [
  '7648654778792152321',
  '7653476960747752720',
  '7655566178441612545',
  '7519578963522489605',
];

const videosDir = path.join(__dirname, '..', 'public', 'videos');
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

async function downloadVideo(id) {
  try {
    const videoUrl = `https://www.tiktok.com/@jossyautomotive6/video/${id}`;
    console.log(`Resolving video ID ${id}...`);
    
    // We can call tikwm.com API
    const apiRes = await axios.get(`https://www.tikwm.com/api/`, {
      params: { url: videoUrl }
    });
    
    if (apiRes.data && apiRes.data.data && apiRes.data.data.play) {
      const downloadUrl = apiRes.data.data.play; // direct mp4 url
      console.log(`Found direct URL for ID ${id}:`, downloadUrl);
      
      const filePath = path.join(videosDir, `${id}.mp4`);
      console.log(`Downloading to ${filePath}...`);
      
      const fileStream = fs.createWriteStream(filePath);
      const response = await axios({
        method: 'get',
        url: downloadUrl,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      response.data.pipe(fileStream);
      
      await new Promise((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
      });
      console.log(`Successfully downloaded video ID ${id}`);
    } else {
      console.error(`Failed to resolve direct URL for ID ${id}:`, apiRes.data);
    }
  } catch (err) {
    console.error(`Error downloading video ID ${id}:`, err.message);
  }
}

async function run() {
  for (const id of TIKTOK_VIDEO_IDS) {
    await downloadVideo(id);
    // Add small delay to avoid hitting rate limits
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log('All downloads completed!');
}

run();
