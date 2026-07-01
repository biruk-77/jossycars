const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // support json encoded bodies
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://whatsrye_db_user:tDahYFzP6xbWRUin@cluster0.vyv2ezx.mongodb.net/realcars?retryWrites=true&w=majority&appName=Cluster0';

mongoose.set('bufferCommands', false);

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 4000
})
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas.');
    seedAdmin();
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

const inquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  carId: { type: String, required: true },
  carTitle: { type: String, required: true },
  carPrice: { type: String, default: "" },
  date: { type: Date, default: Date.now }
});
const Inquiry = mongoose.model('Inquiry', inquirySchema);

async function seedAdmin() {
  try {
    const adminUsername = 'admin';
    const adminPassword = 'adminpassword2026';
    const existing = await User.findOne({ username: adminUsername });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = new User({
        username: adminUsername,
        password: hashedPassword,
        name: 'System Admin',
        phone: '+251911000000',
        role: 'admin'
      });
      await admin.save();
      console.log('Seeded default admin user: admin / adminpassword2026');
    }
  } catch (err) {
    console.error('Error seeding admin user:', err);
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
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// High-quality mock car data representing typical cars for sale in Ethiopia (used as fallback or for a polished demo)
function hoursAgo(h) {
  return new Date(Date.now() - h * 3600000).toISOString();
}

const MOCK_CARS = [
  {
    id: "mock-1",
    title: "Toyota Hilux Double Cabin 2022",
    price: "8,200,000 ETB",
    details: "Transmission: Automatic\nFuel: Diesel\nEngine: 2.8L GD-6\nCondition: Excellent (Plate No. B33...)\nContact: 0911XXXXXX",
    photos: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800"],
    date: hoursAgo(2),
    isMock: true,
    link: "#"
  },
  {
    id: "mock-2",
    title: "Suzuki Dzire 2021",
    price: "1,950,000 ETB",
    details: "Transmission: Manual\nFuel: Benzene\nEngine: 1.2L\nKilometers: 18,000 km\nCondition: Very Clean, Euro Spec",
    photos: ["https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800"],
    date: hoursAgo(18),
    isMock: true,
    link: "#"
  },
  {
    id: "mock-3",
    title: "Toyota Vitz (Yaris) 2015",
    price: "1,650,000 ETB",
    details: "Transmission: Automatic\nFuel: Benzene\nEngine: 1.3L\nCondition: Local Used, No Accident",
    photos: ["https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800"],
    date: hoursAgo(48),
    isMock: true,
    link: "#"
  },
  {
    id: "mock-4",
    title: "Hyundai Tucson 2020",
    price: "5,400,000 ETB",
    details: "Transmission: Automatic\nFuel: Benzene\nEngine: 2.0L\nCondition: Clean title, imported directly from Dubai",
    photos: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800"],
    date: hoursAgo(72),
    isMock: true,
    link: "#"
  },
  {
    id: "mock-5",
    title: "Toyota Corolla (Core) 2018",
    price: "3,800,000 ETB",
    details: "Transmission: Automatic\nFuel: Benzene\nEngine: 1.8L\nCondition: Code 2 Plate, Very Neat Interior",
    photos: ["https://images.unsplash.com/photo-1623869675781-80aa311b2a78?auto=format&fit=crop&q=80&w=800"],
    date: hoursAgo(96),
    isMock: true,
    link: "#"
  }
];

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

    let oldestId = null;
    $first('.tgme_widget_message').each((_, el) => {
      const id = $first(el).attr('data-post');
      if (id) oldestId = id;
    });

    let pages = 0;
    while (allPosts.length < limit && oldestId && pages < 4) {
      const postNum = parseInt(oldestId.split('/')[1]);
      if (!postNum || postNum <= 1) break;

      const pageUrl = `https://t.me/s/${channel}?before=${postNum}`;
      try {
        const pageData = await fetchWithRetry(pageUrl);
        const $page = cheerio.load(pageData);
        const before = allPosts.length;
        extractPosts($page, allPosts, channel);
        if (allPosts.length === before) break;

        $page('.tgme_widget_message').each((_, el) => {
          const id = $page(el).attr('data-post');
          if (id) oldestId = id;
        });
      } catch { break; }
      pages++;
    }

    if (allPosts.length === 0) return MOCK_CARS;

    const withPhotos = allPosts.filter(p => p.photos?.[0] && !p.photos[0].includes('unsplash'));
    return (withPhotos.length >= 5 ? withPhotos : allPosts).slice(0, limit);
  } catch (error) {
    console.error(`Scrape error:`, error.message);
    return MOCK_CARS;
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
    if (req.user.role !== 'admin') {
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
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admins only' });
  try {
    const users = await User.find({}, { password: 0 }).sort({ _id: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Database is offline.' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admins only' });
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
  try {
    const result = await User.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/users/:id/role', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Database is offline.' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admins only' });
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, select: '-password' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Role updated', user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: reset any user's password
app.patch('/api/users/:id/password', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Database is offline.' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admins only' });
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

app.get('/api/inquiries', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is offline.' });
  }
  try {
    if (req.user.role !== 'admin') {
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
    if (req.user.role !== 'admin') {
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

// ── Cars API ──
// ── Cars API ──
app.get('/api/cars', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.warn("MongoDB is offline/buffering. Serving directly from Telegram scrape...");
      const channel = req.query.channel || 'jossycarmar';
      const scraped = await scrapeTelegramListings(channel, 50);
      return res.json(scraped);
    }

    let cars = await Car.find().sort({ date: -1 });
    if (cars.length === 0) {
      console.log("No cars in database, seeding from Telegram...");
      const channel = req.query.channel || 'jossycarmar';
      const scraped = await scrapeTelegramListings(channel, 50);
      
      // Clean duplicate IDs in the scraped set itself (if any)
      const seen = new Set();
      const uniqueScraped = [];
      for (const item of scraped) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          uniqueScraped.push(item);
        }
      }
      
      try {
        await Car.insertMany(uniqueScraped);
      } catch (dbErr) {
        console.error("Failed to seed scraped cars into DB:", dbErr.message);
      }
      cars = await Car.find().sort({ date: -1 });
    }
    res.json(cars);
  } catch (err) {
    console.error('Error fetching cars, falling back to scraped listings:', err);
    try {
      const channel = req.query.channel || 'jossycarmar';
      const scraped = await scrapeTelegramListings(channel, 50);
      res.json(scraped);
    } catch (fallbackErr) {
      res.json(MOCK_CARS);
    }
  }
});

app.post('/api/cars/sync', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is offline. Unable to sync.' });
  }
  try {
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
    res.status(201).json(car);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/cars/:id', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is offline. Unable to edit listing.' });
  }
  try {
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
    res.json(car);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cars/:id', authenticateToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is offline. Unable to delete listing.' });
  }
  try {
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
