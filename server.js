require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

// Import the SQLite database wrapper
const { db } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and body parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ── Rate Limiting (Security) ──
// General API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true, 
  legacyHeaders: false,
});

// Stricter Rate Limiter for Login/Signup/Auth changes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per windowMs
  message: { error: 'Too many login/auth requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general API rate limiter to all API routes
app.use('/api/', apiLimiter);

// JWT Secret Key
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

// Helper parser for Telegram Listings
function parseListing(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let title = "Toyota / Suzuki Car for Sale";
  let price = "Contact for Price";
  let detailsList = [];

  if (lines.length > 0) {
    title = lines[0].replace(/[🔥🔴❇️❇️✅🚗🚙🚘🚖]/g, '').trim();
    if (title.length > 50) {
      title = title.substring(0, 47) + "...";
    }
  }

  const priceRegex = /(?:price|ዋጋ|birr|etb|br)\s*:?\s*([\d,.\s]+(?:million|ሺ|sh|mill|mil|million|br|etb)?)/i;
  const amharicPriceRegex = /([\d,.\s]+(?:ሚሊዮን|ሺህ)?\s*(?:ብር|etb))/i;

  for (const line of lines) {
    let match = line.match(priceRegex) || line.match(amharicPriceRegex);
    if (match) {
      price = match[0].trim();
      break;
    }
  }

  detailsList = lines.slice(1).filter(line => {
    return !line.toLowerCase().includes('http') && !line.includes('@');
  });

  return {
    title,
    price,
    details: detailsList.join('\n')
  };
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Referer': 'https://t.me/',
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
            $(element).find('.time').attr('datetime') ||
            $(element).find('.time').text().trim() || 'Recently',
      link: $(element).find('.tgme_widget_message_date').attr('href') || `https://t.me/${channel}`,
      isMock: false,
    });
  });
}

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

    if (allPosts.length === 0) return [];

    const withPhotos = allPosts.filter(p => p.photos?.[0] && !p.photos[0].includes('unsplash'));
    return (withPhotos.length >= 5 ? withPhotos : allPosts).slice(0, limit);
  } catch (error) {
    console.error(`Scrape error:`, error.message);
    return [];
  }
}

// ── Auth API ──
app.post('/api/auth/signup', authLimiter, async (req, res) => {
  try {
    const { username, password, name, phone } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // SAFE: Parameterized SELECT query to check for existing username (prevents SQL injection)
    const existing = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `u_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // SAFE: Parameterized INSERT query
    await db.run(
      'INSERT INTO users (id, username, password, name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, username, hashedPassword, name || '', phone || '', 'user']
    );

    const token = jwt.sign({ id: userId, username, role: 'user', name: name || '', phone: phone || '' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Signup successful', token, username, role: 'user', name: name || '', phone: phone || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // SAFE: Parameterized SELECT query (prevents SQL injection)
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name || '', phone: user.phone || '' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, username: user.username, role: user.role, name: user.name || '', phone: user.phone || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    // SAFE: Parameterized SELECT query
    const user = await db.get('SELECT username, role, name, phone FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admins only' });
  try {
    // SAFE: Parameterized query
    const users = await db.all('SELECT id, username, name, phone, role FROM users ORDER BY id DESC');
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admins only' });
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
  try {
    // SAFE: Parameterized query
    const result = await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/users/:id/role', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admins only' });
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  try {
    // SAFE: Parameterized query
    const result = await db.run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Role updated successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/users/:id/password', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admins only' });
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    // SAFE: Parameterized query
    const result = await db.run('UPDATE users SET password = ? WHERE id = ?', [hashed, req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Password updated successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/profile', authenticateToken, authLimiter, async (req, res) => {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;
    // SAFE: Parameterized query
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let updatedName = name !== undefined ? name.trim() : user.name;
    let updatedPhone = phone !== undefined ? phone.trim() : user.phone;
    let hashedPassword = user.password;

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password is required to set a new one' });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
      if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }

    // SAFE: Parameterized query
    await db.run(
      'UPDATE users SET name = ?, phone = ?, password = ? WHERE id = ?',
      [updatedName, updatedPhone, hashedPassword, req.user.id]
    );

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: updatedName, phone: updatedPhone }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Profile updated successfully', token, name: updatedName, phone: updatedPhone });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Inquiries API ──
app.post('/api/inquiries', async (req, res) => {
  try {
    const { name, phone, carId, carTitle, carPrice } = req.body;
    if (!name || !phone || !carId || !carTitle) {
      return res.status(400).json({ error: 'Missing required inquiry fields' });
    }
    const id = `inq_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // SAFE: Parameterized query
    await db.run(
      'INSERT INTO inquiries (id, name, phone, carId, carTitle, carPrice) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, phone, carId, carTitle, carPrice || '']
    );

    res.status(201).json({ message: 'Lead saved successfully', inquiry: { id, name, phone, carId, carTitle, carPrice } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inquiries', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    // SAFE: Parameterized query
    const inquiries = await db.all('SELECT * FROM inquiries ORDER BY date DESC');
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/inquiries/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    // SAFE: Parameterized query
    const result = await db.run('DELETE FROM inquiries WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    res.json({ message: 'Inquiry deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Cars API ──
app.get('/api/cars', async (req, res) => {
  const channel = req.query.channel || 'jossycarmar';
  try {
    // 1. Try Telegram scraping first
    const scraped = await scrapeTelegramListings(channel, 50);
    if (scraped.length > 0) {
      res.json(scraped);

      // Save/update scraped posts to SQL in the background
      for (const item of scraped) {
        // SAFE: Parameterized queries used throughout
        db.run(
          `INSERT INTO cars (id, title, price, details, photos, link, isMock) 
           VALUES (?, ?, ?, ?, ?, ?, 0) 
           ON CONFLICT(id) DO UPDATE SET 
             title = excluded.title, 
             price = excluded.price, 
             details = excluded.details, 
             photos = excluded.photos, 
             link = excluded.link`,
          [item.id, item.title, item.price, item.details, JSON.stringify(item.photos), item.link]
        ).catch(e => console.error('BG Save SQLite Error:', e.message));
      }
      
      // Delete any mock listings in the database
      db.run('DELETE FROM cars WHERE isMock = 1').catch(() => {});
      return;
    }

    // 2. Scraper failed or returned nothing — fall back to local SQLite database
    const cars = await db.all('SELECT * FROM cars WHERE isMock = 0 ORDER BY date DESC');
    const parsedCars = cars.map(car => ({
      ...car,
      photos: JSON.parse(car.photos || '[]'),
      isMock: car.isMock === 1
    }));
    res.json(parsedCars);
  } catch (err) {
    console.error('Cars fetch error:', err.message);
    try {
      const cars = await db.all('SELECT * FROM cars WHERE isMock = 0 ORDER BY date DESC');
      const parsedCars = cars.map(car => ({
        ...car,
        photos: JSON.parse(car.photos || '[]'),
        isMock: car.isMock === 1
      }));
      res.json(parsedCars);
    } catch (_) {
      res.json([]);
    }
  }
});

app.post('/api/cars/sync', authenticateToken, async (req, res) => {
  try {
    const channel = req.body.channel || 'jossycarmar';
    console.log(`Sync requested for channel: ${channel}`);
    const scraped = await scrapeTelegramListings(channel, 50);
    let addedCount = 0;
    
    for (const item of scraped) {
      // SAFE: Parameterized query to check if listing already exists
      const existing = await db.get('SELECT 1 FROM cars WHERE id = ?', [item.id]);
      if (!existing) {
        // SAFE: Parameterized insert query
        await db.run(
          'INSERT INTO cars (id, title, price, details, photos, link, isMock) VALUES (?, ?, ?, ?, ?, ?, 0)',
          [item.id, item.title, item.price, item.details, JSON.stringify(item.photos), item.link]
        );
        addedCount++;
      }
    }
    res.json({ message: `Sync complete. Added ${addedCount} new listings from Telegram.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cars', authenticateToken, async (req, res) => {
  try {
    const { title, price, details, photos, link } = req.body;
    if (!title || !price) {
      return res.status(400).json({ error: 'Title and price are required' });
    }
    const newId = `car_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const photosStr = JSON.stringify(photos || ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800']);

    // SAFE: Parameterized query
    await db.run(
      'INSERT INTO cars (id, title, price, details, photos, link, isMock) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [newId, title, price, details || '', photosStr, link || '#']
    );

    res.status(201).json({
      id: newId,
      title,
      price,
      details: details || '',
      photos: photos || ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'],
      link: link || '#',
      isMock: false
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/cars/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, price, details, photos, link } = req.body;

    // SAFE: Parameterized query to check if listing exists
    const car = await db.get('SELECT * FROM cars WHERE id = ?', [id]);
    if (!car) {
      return res.status(404).json({ error: 'Car listing not found' });
    }

    const updatedTitle = title || car.title;
    const updatedPrice = price || car.price;
    const updatedDetails = details !== undefined ? details : car.details;
    const updatedPhotos = photos ? JSON.stringify(photos) : car.photos;
    const updatedLink = link || car.link;

    // SAFE: Parameterized query to update listing
    await db.run(
      'UPDATE cars SET title = ?, price = ?, details = ?, photos = ?, link = ? WHERE id = ?',
      [updatedTitle, updatedPrice, updatedDetails, updatedPhotos, updatedLink, id]
    );

    res.json({
      id,
      title: updatedTitle,
      price: updatedPrice,
      details: updatedDetails,
      photos: photos || JSON.parse(updatedPhotos),
      link: updatedLink,
      isMock: car.isMock === 1
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cars/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    // SAFE: Parameterized query to delete listing
    const result = await db.run('DELETE FROM cars WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Car listing not found' });
    }
    res.json({ message: 'Car listing deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── TikTok video IDs ───────────────────────────────────────
const TIKTOK_VIDEO_IDS = [
  '7648654778792152321',
  '7653476960747752720',
  '7655566178441612545',
  '7519578963522489605',
];

app.get('/api/tiktok', (_req, res) => {
  res.json(TIKTOK_VIDEO_IDS);
});

// ── 3D Model Proxy ──
app.get('/car.glb', async (_req, res) => {
  const local = path.join(__dirname, 'public', 'car.glb');
  if (fs.existsSync(local)) {
    return res.sendFile(local);
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

// Serve frontend assets if Vite build exists
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    // If it is an API route, pass to other routers
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // Fall back to old public folder if React app is not compiled yet
  app.use(express.static(path.join(__dirname, 'public')));
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
