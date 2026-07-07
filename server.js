const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // support json encoded bodies
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Clean HTML routes for enterprise navigation
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/car', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'car.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'services.html'));
});

app.get('/finance', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'finance.html'));
});


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://whatsrye_db_user:tDahYFzP6xbWRUin@cluster0.vyv2ezx.mongodb.net/realcars?retryWrites=true&w=majority&appName=Cluster0';

mongoose.set('bufferCommands', false);

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 4000
})
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas.');
    seedAdmin();
    seedSettings();
  })
  .catch(err => {
    console.error('MongoDB connection error (Offline/Fallback mode):', err.message);
    console.error('Reason: IP may not be whitelisted in MongoDB Atlas or database is unreachable.');
  });

// Database schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: "" },
  phone: { type: String, default: "" },
  role: { type: String, default: "user" }
});
const User = mongoose.model('User', userSchema);

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
});
const Settings = mongoose.model('Settings', settingsSchema);

const inquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  carId: { type: String, required: true },
  carTitle: { type: String, required: true },
  carPrice: { type: String, default: "" },
  date: { type: Date, default: Date.now }
});
const Inquiry = mongoose.model('Inquiry', inquirySchema);

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  message: { type: String, required: true },
  images: [{ type: String }],
  date: { type: Date, default: Date.now }
});
const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

async function seedAdmin() {
  try {
    const rolesToSeed = [
      { username: 'admin', password: 'adminpassword2026', name: 'Super Admin', phone: '+251911000000', role: 'superadmin' },
      { username: 'jossy', password: 'jossypassword2026', name: 'Jossy (Owner)', phone: '+251946740763', role: 'superadmin' },
      { username: 'sales1', password: 'salespassword2026', name: 'Sales Agent 1', phone: '+251976558181', role: 'admin' }
    ];

    for (const u of rolesToSeed) {
      const existing = await User.findOne({ username: u.username });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        const newUser = new User({
          username: u.username,
          password: hashedPassword,
          name: u.name,
          phone: u.phone,
          role: u.role
        });
        await newUser.save();
        console.log(`Seeded user: ${u.username} (${u.role})`);
      } else if (existing.role === 'admin' && u.username === 'admin') {
        // Upgrade legacy admin to superadmin
        existing.role = 'superadmin';
        await existing.save();
        console.log('Upgraded legacy admin user to superadmin');
      }
    }
  } catch (err) {
    console.error('Error seeding users:', err);
  }
}

async function seedSettings() {
  try {
    const defaults = {
      phone1: '+251 946 740 763',
      phone2: '+251 976 558 181',
      telegram_chat_username: '@Jossimulugeta',
      telegram_channel: 'https://t.me/jossycarmar',
      tiktok_link: 'https://www.tiktok.com/@jossycars',
      instagram_link: 'https://www.instagram.com/jossycars',
      youtube_link: 'https://www.youtube.com/@jossycars',
      about_us_en: 'Real Cars ETH is the premier destination for importing and acquiring luxury and electric vehicles in Ethiopia. We offer full transit tracking, clearing services, and localized support.',
      about_us_am: 'ሪል ካርስ ኢቲኤች በኢትዮጵያ ውስጥ የቅንጦት እና የኤሌክትሪክ ተሽከርካሪዎችን ለማስመጣት እና ለመግዛት ቀዳሚ ምርጫ ነው። የተሟላ የትራንዚት ክትትል፣ የጉምሩክ ክሊራንስ እና የሀገር ውስጥ ድጋፍ አገልግሎቶችን እንሰጣለን።',
      hero_title_en: 'Find Your Dream Vehicle',
      hero_title_am: 'የህልምዎን መኪና ያግኙ',
      hero_subtitle_en: 'Direct import and luxury showroom services in Addis Ababa, Ethiopia.',
      hero_subtitle_am: 'ቀጥታ አስመጪ እና የቅንጦት መኪናዎች ማሳያ በአዲስ አበባ፣ ኢትዮጵያ።',
      loan_default_price: '6000000',
      loan_default_down_payment: '30',
      loan_default_interest_rate: '18.5',
      loan_default_term: '5',
      stat_vehicles_sold: '500',
      stat_happy_clients: '12',
      stat_years_in_business: '5',
      stat_verified_quality: '100'
    };

    for (const [key, value] of Object.entries(defaults)) {
      const existing = await Settings.findOne({ key });
      if (!existing) {
        const s = new Settings({ key, value });
        await s.save();
        console.log(`Seeded setting: ${key}`);
      }
    }
  } catch (err) {
    console.error('Error seeding settings:', err);
  }
}

const carSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  title: { type: String, required: true },
  price: { type: String, required: true },
  details: { type: String, default: "" },
  photos: { type: [String], default: [] },
  date: { type: Date, default: Date.now },
  link: { type: String, default: "#" },
  isMock: { type: Boolean, default: false }
});
const Car = mongoose.model('Car', carSchema);

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-realcars-eth-2026';

// Middleware for JWT authentication
function authenticateToken(req, res, next) {
  let token = null;

  // 1. Try Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Try Cookie if header not found
  if (!token && req.headers.cookie) {
    const cookieToken = req.headers.cookie
      .split('; ')
      .find(row => row.startsWith('rceth_token='))
      ?.split('=')[1];
    if (cookieToken) token = cookieToken;
  }

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}


// Parser function to structure plain text from Telegram into a cleaner listing
function parseListing(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let title = "Toyota / Suzuki Car for Sale";
  let price = "Contact for Price";
  let detailsList = [];

  // Try to find the title (often the first line)
  if (lines.length > 0) {
    title = lines[0].replace(/[🔥🔴❇️❇️✅🚗🚙🚘🚖]/g, '').trim();
    if (title.length > 50) {
      title = title.substring(0, 47) + "...";
    }
  }

  // Look for price patterns
  const priceRegex = /(?:price|ዋጋ|birr|etb|br)\s*:?\s*([\d,.\s]+(?:million|ሺ|sh|mill|mil|million|br|etb)?)/i;
  const amharicPriceRegex = /([\d,.\s]+(?:ሚሊዮን|ሺህ)?\s*(?:ብር|etb))/i;

  for (const line of lines) {
    let match = line.match(priceRegex) || line.match(amharicPriceRegex);
    if (match) {
      price = match[0].trim();
      break;
    }
  }

  // Clean details
  detailsList = lines.slice(1).filter(line => {
    // Exclude contact links or long promotional spam lines
    return !line.toLowerCase().includes('http') && !line.includes('@');
  });

  return {
    title,
    price,
    details: detailsList.join('\n')
  };
}

// ── Helpers ────────────────────────────────────────────────
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Referer': 'https://t.me/',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'same-origin',
};

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.get(url, {
        headers: HEADERS,
        timeout: 25000,
        maxRedirects: 5,
      });
      return res.data;
    } catch (err) {
      console.log(`Attempt ${i + 1} failed for ${url}: ${err.message}`);
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw new Error(`All ${retries} attempts failed for ${url}`);
}

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
    if (allPosts.some(p => p.id === postId)) return; // deduplicate

    const parsed = parseListing(postText);

    allPosts.push({
      id: postId,
      title:   parsed.title,
      price:   parsed.price,
      details: parsed.details || postText,
      photos:  photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'],
      date:    $(element).find('time[datetime]').attr('datetime') ||
               $(element).find('.tgme_widget_message_date time').attr('datetime') ||
               $(element).find('.time').attr('datetime') ||
               $(element).find('.time').text().trim() || 'Recently',
      link:    $(element).find('.tgme_widget_message_date').attr('href') || `https://t.me/${channel}`,
      isMock:  false,
    });
  });
}

// ── Scrape helper function ──
async function scrapeTelegramListings(channel = 'jossycarmar', limit = 50) {
  try {
    const allPosts = [];
    const firstUrl = `https://t.me/s/${channel}`;
    const firstData = await fetchWithRetry(firstUrl);
    const $first = cheerio.load(firstData);
    extractPosts($first, allPosts, channel);

    // Get the first message's ID (oldest on the page), not the last one
    let oldestId = null;
    const firstMsg = $first('.tgme_widget_message').first();
    if (firstMsg.length > 0) {
      oldestId = firstMsg.attr('data-post');
    }

    let pages = 0;
    while (allPosts.length < limit && oldestId && pages < 25) {
      const postNum = parseInt(oldestId.split('/')[1]);
      if (!postNum || postNum <= 1) break;

      const pageUrl = `https://t.me/s/${channel}?before=${postNum}`;
      try {
        const pageData = await fetchWithRetry(pageUrl);
        const $page = cheerio.load(pageData);
        const before = allPosts.length;
        extractPosts($page, allPosts, channel);
        if (allPosts.length === before) break;

        let newOldestId = null;
        const pageFirstMsg = $page('.tgme_widget_message').first();
        if (pageFirstMsg.length > 0) {
          newOldestId = pageFirstMsg.attr('data-post');
        }
        if (newOldestId === oldestId) break;
        oldestId = newOldestId;
      } catch { break; }
      pages++;
      await new Promise(r => setTimeout(r, 200));
    }

    if (allPosts.length === 0) return [];

    const withPhotos = allPosts.filter(p => p.photos?.[0] && !p.photos[0].includes('unsplash'));
    return (withPhotos.length >= 5 ? withPhotos : allPosts).slice(0, limit);
  } catch (error) {
    console.error(`Scrape error:`, error.message);
    return [];
  }
}

// ── Auth API ──
app.post('/api/auth/signup', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is offline. Please make sure your current IP address is whitelisted on your MongoDB Atlas cluster.' });
  }
  try {
    const { username, password, name, phone } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword,
      name: name || '',
      phone: phone || '',
      role: 'user'
    });
    await user.save();
    const token = jwt.sign({ id: user._id, username: user.username, role: user.role, name: user.name, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Signup successful', token, username: user.username, role: user.role, name: user.name, phone: user.phone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is offline. Please make sure your current IP address is whitelisted on your MongoDB Atlas cluster.' });
  }
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }
    const token = jwt.sign({ id: user._id, username: user.username, role: user.role, name: user.name || '', phone: user.phone || '' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, username: user.username, role: user.role, name: user.name || '', phone: user.phone || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is offline.' });
  }
  res.json({ username: req.user.username, role: req.user.role, name: req.user.name || '', phone: req.user.phone || '' });
});

// ── File Upload API (Base64) ──
app.post('/api/upload', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    const { base64Data, fileName } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'No image data provided' });
    }
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 image data' });
    }
    const imageBuffer = Buffer.from(matches[2], 'base64');
    const extension = fileName ? path.extname(fileName) : '.jpg';
    const uniqueFileName = `upload_${Date.now()}_${Math.floor(Math.random() * 10000)}${extension}`;
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filePath = path.join(uploadsDir, uniqueFileName);
    fs.writeFileSync(filePath, imageBuffer);
    const relativeUrl = `/uploads/${uniqueFileName}`;
    res.status(201).json({ url: relativeUrl });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process image upload' });
  }
});

// ── Users Management API ──
app.get('/api/users', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Database is offline.' });
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden: Super Admins only' });
  try {
    const users = await User.find({}, { password: 0 }).sort({ _id: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Database is offline.' });
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden: Super Admins only' });
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
  try {
    const result = await User.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/users/:id/role', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Database is offline.' });
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden: Super Admins only' });
  const { role } = req.body;
  if (!['superadmin', 'admin', 'user'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, select: '-password' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Role updated', user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: reset any user's password
app.patch('/api/users/:id/password', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Database is offline.' });
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden: Super Admins only' });
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    const user = await User.findByIdAndUpdate(req.params.id, { password: hashed }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Password updated successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// User: update own profile (name, phone, password)
app.patch('/api/profile', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Database is offline.' });
  try {
    const { name, phone, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password is required to set a new one' });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
      if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    const token = jwt.sign({ id: user._id, username: user.username, role: user.role, name: user.name, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Profile updated successfully', token, name: user.name, phone: user.phone });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Inquiries API ──
app.post('/api/inquiries', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is offline. Unable to send inquiry.' });
  }
  try {
    const { name, phone, carId, carTitle, carPrice } = req.body;
    if (!name || !phone || !carId || !carTitle) {
      return res.status(400).json({ error: 'Missing required inquiry fields' });
    }
    const inquiry = new Inquiry({ name, phone, carId, carTitle, carPrice });
    await inquiry.save();
    res.status(201).json({ message: 'Lead saved successfully', inquiry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Contact & Email Notification API ──
app.post('/api/contact', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is offline. Please try again later.' });
  }
  try {
    const { name, contact, message, images } = req.body;
    if (!name || !contact || !message) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    // Process and save Base64 uploaded images (if any)
    const imageUrls = [];
    if (images && Array.isArray(images)) {
      const uploadsDir = path.join(__dirname, 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img && img.base64Data) {
          const matches = img.base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const imageBuffer = Buffer.from(matches[2], 'base64');
            const extension = img.fileName ? path.extname(img.fileName) : '.jpg';
            const uniqueFileName = `contact_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}${extension}`;
            const filePath = path.join(uploadsDir, uniqueFileName);
            fs.writeFileSync(filePath, imageBuffer);
            imageUrls.push(`/uploads/${uniqueFileName}`);
          }
        }
      }
    }

    // Save contact message details in MongoDB
    const contactMsg = new ContactMessage({ name, contact, message, images: imageUrls });
    await contactMsg.save();

    // Setup Nodemailer email notification
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'jossycars.notification@gmail.com',
        pass: process.env.EMAIL_PASS || 'jossypassword123'
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || 'jossycars.notification@gmail.com',
      to: 'biruk@gmail.com',
      subject: `[Jossy Cars] Message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 25px; background-color: #FCF9EC; color: #1C1917; border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.2);">
          <h2 style="color: #D4AF37; margin-bottom: 20px; border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 10px;">New Customer Message</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #7F7F7F;">Name:</td>
              <td style="padding: 8px 0; font-weight: 700;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #7F7F7F;">Contact:</td>
              <td style="padding: 8px 0; font-weight: 700;">${contact}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #7F7F7F;">Date:</td>
              <td style="padding: 8px 0;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
          <div style="background: #ffffff; padding: 15px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.08); margin-bottom: 25px;">
            <p style="margin: 0; font-weight: bold; margin-bottom: 10px; color: #D4AF37; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Message Details:</p>
            <p style="margin: 0; white-space: pre-wrap; line-height: 1.5; font-size: 14px;">${message}</p>
          </div>
          ${imageUrls.length > 0 ? `
            <p style="font-weight: bold; margin-bottom: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #D4AF37;">Attached Images (${imageUrls.length}):</p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
              ${imageUrls.map((url, idx) => `
                <div style="border: 1px solid rgba(0,0,0,0.1); border-radius: 6px; padding: 4px; background: #fff;">
                  <p style="font-size: 11px; margin: 0 0 4px; color: #7F7F7F; text-align: center;">Image ${idx + 1}</p>
                </div>
              `).join('')}
            </div>
            <p style="font-size: 12px; color: #7F7F7F; margin-top: 8px;">(Images are attached directly to this email message file)</p>
          ` : ''}
          <hr style="border: 0; border-top: 1px solid rgba(0, 0, 0, 0.08); margin-top: 30px;">
          <p style="font-size: 11px; color: #A1A1AA; text-align: center; margin: 0;">This email was automatically generated by Jossy Cars Platform.</p>
        </div>
      `,
      attachments: imageUrls.map((url, idx) => ({
        filename: url.split('/').pop(),
        path: path.join(__dirname, 'public', url)
      }))
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email successfully sent to biruk@gmail.com for message from ${name}`);
    } catch (mailErr) {
      console.warn(`Database saved contact, but email sending failed: ${mailErr.message}`);
    }

    res.status(201).json({ message: 'Message sent successfully. We will get back to you soon.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inquiries', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is offline.' });
  }
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    const inquiries = await Inquiry.find().sort({ date: -1 });
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/inquiries/:id', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is offline.' });
  }
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    const { id } = req.params;
    const result = await Inquiry.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    res.json({ message: 'Inquiry deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Contact Messages & Appraisals API (Admin-only GET and DELETE) ──
app.get('/api/contact', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is offline.' });
  }
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    const contacts = await ContactMessage.find().sort({ date: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/contact/:id', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is offline.' });
  }
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    const { id } = req.params;
    const result = await ContactMessage.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Settings Configuration API (Public GET, Super Admin PUT) ──
app.get('/api/settings', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is offline.' });
  }
  try {
    const list = await Settings.find();
    const settingsObj = {};
    list.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    res.json(settingsObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is offline.' });
  }
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden: Super Admins only' });
    }
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await Settings.findOneAndUpdate({ key }, { value }, { upsert: true });
    }
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to wrap external image URLs with our proxy endpoint
function proxyCarPhotos(car) {
  if (!car) return car;
  const carObj = typeof car.toObject === 'function' ? car.toObject() : car;
  if (carObj.photos && Array.isArray(carObj.photos)) {
    carObj.photos = carObj.photos.map(src => {
      if (!src || src.startsWith('/uploads/') || src.includes('unsplash.com')) {
        return src || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800';
      }
      return `/api/proxy-image?url=${encodeURIComponent(src)}`;
    });
  }
  return carObj;
}

// ── Image Proxy API (Bypasses Telegram CDN blocking in Ethiopia) ──
app.get('/api/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send('URL required');
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://t.me/',
      },
      timeout: 10000,
    });
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    response.data.pipe(res);
  } catch (err) {
    console.error(`Image proxy failed for URL: ${imageUrl} - ${err.message}`);
    res.redirect('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800');
  }
});

// ── Cars API ──
app.get('/api/cars', async (req, res) => {
  const channel = req.query.channel || 'jossycarmar';
  try {
    // 1. Return database listings first — instant load, can contain thousands of records
    let dbCars = [];
    if (mongoose.connection.readyState === 1) {
      dbCars = await Car.find({ isMock: { $ne: true } }).sort({ date: -1 }).limit(1500);
    }

    // 2. Trigger asynchronous background scrape to fetch freshest items from Telegram
    scrapeTelegramListings(channel, 50)
      .then(async (scraped) => {
        if (scraped.length > 0 && mongoose.connection.readyState === 1) {
          const seen = new Set();
          for (const item of scraped) {
            if (seen.has(item.id)) continue;
            seen.add(item.id);
            await Car.findOneAndUpdate({ id: item.id }, item, { upsert: true, setDefaultsOnInsert: true })
              .catch(e => console.error('BG save err:', e.message));
          }
          await Car.deleteMany({ isMock: true }).catch(() => {});
        }
      })
      .catch(err => console.error('BG scrape err:', err.message));

    if (dbCars.length > 0) {
      return res.json(dbCars.map(proxyCarPhotos));
    }

    // 3. Fallback: If DB is empty, await the scraper and return results immediately
    const scrapedImmediate = await scrapeTelegramListings(channel, 50);
    if (scrapedImmediate.length > 0) {
      if (mongoose.connection.readyState === 1) {
        for (const item of scrapedImmediate) {
          await Car.findOneAndUpdate({ id: item.id }, item, { upsert: true, setDefaultsOnInsert: true }).catch(() => {});
        }
        await Car.deleteMany({ isMock: true }).catch(() => {});
      }
      return res.json(scrapedImmediate.map(proxyCarPhotos));
    }

    res.json([]);
  } catch (err) {
    console.error('Cars fetch error:', err.message);
    // Last resort: query MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        const cars = await Car.find({ isMock: { $ne: true } }).sort({ date: -1 }).limit(1500);
        return res.json(cars.map(proxyCarPhotos));
      } catch (_) {}
    }
    res.json([]);
  }
});

app.post('/api/cars/sync', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is offline. Unable to sync.' });
  }
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    const channel = req.body.channel || 'jossycarmar';
    console.log(`Sync requested for channel: ${channel}`);
    const scraped = await scrapeTelegramListings(channel, 50);
    let addedCount = 0;
    for (const item of scraped) {
      const existing = await Car.findOne({ id: item.id });
      if (!existing) {
        const car = new Car(item);
        await car.save();
        addedCount++;
      }
    }
    res.json({ message: `Sync complete. Added ${addedCount} new listings from Telegram.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cars', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is offline. Unable to add listing.' });
  }
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    const { title, price, details, photos, link } = req.body;
    if (!title || !price) {
      return res.status(400).json({ error: 'Title and price are required' });
    }
    const car = new Car({
      title,
      price,
      details: details || '',
      photos: photos || ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'],
      link: link || '#',
      date: new Date()
    });
    car.id = car._id.toString();
    await car.save();
    res.status(201).json(proxyCarPhotos(car));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/cars/:id', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is offline. Unable to edit listing.' });
  }
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    const { id } = req.params;
    const { title, price, details, photos, link } = req.body;
    const car = await Car.findOne({ id });
    if (!car) {
      return res.status(404).json({ error: 'Car listing not found' });
    }
    if (title) car.title = title;
    if (price) car.price = price;
    if (details !== undefined) car.details = details;
    if (photos) car.photos = photos;
    if (link) car.link = link;
    await car.save();
    res.json(proxyCarPhotos(car));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cars/:id', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is offline. Unable to delete listing.' });
  }
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    const { id } = req.params;
    const result = await Car.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Car listing not found' });
    }
    res.json({ message: 'Car listing deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── TikTok video IDs ───────────────────────────────────────
// Paste full TikTok video URLs here — just replace the placeholders
const TIKTOK_VIDEO_IDS = [
  '7648654778792152321',
  '7653476960747752720',
  '7655566178441612545',
  '7519578963522489605',
];

app.get('/api/tiktok', (_req, res) => {
  res.json(TIKTOK_VIDEO_IDS);
});

// ── 3D Model proxy ─────────────────────────────────────────
// If user drops their own car.glb in /public, Express static serves it.
// If not, this route fetches the Ferrari demo model and streams it.

app.get('/car.glb', async (_req, res) => {
  const local = path.join(__dirname, 'public', 'car.glb');
  if (fs.existsSync(local)) {
    return res.sendFile(local); // serve the user's own model
  }
  try {
    const modelUrl = 'https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/models/gltf/ferrari.glb';
    const { data } = await axios.get(modelUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    res.set({
      'Content-Type': 'model/gltf-binary',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*'
    });
    res.send(Buffer.from(data));
  } catch (err) {
    console.error('Model proxy error:', err.message);
    res.status(502).send('Could not fetch 3D model');
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
