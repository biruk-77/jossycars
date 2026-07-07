/**
 * MongoDB User Seeding Script for Real Cars ETH
 * Seeds the database with standard users, agents, and admins.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://whatsrye_db_user:tDahYFzP6xbWRUin@cluster0.vyv2ezx.mongodb.net/realcars?retryWrites=true&w=majority&appName=Cluster0';

// Define User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: "" },
  phone: { type: String, default: "" },
  role: { type: String, default: "user" }
});

const User = mongoose.model('User', userSchema);

const usersToSeed = [
  {
    username: "admin",
    passwordRaw: "adminpassword2026",
    name: "System Admin",
    phone: "+251911000000",
    role: "admin"
  },
  {
    username: "jossy",
    passwordRaw: "jossypassword2026",
    name: "Jossy Automobile Owner",
    phone: "+251946740763",
    role: "admin"
  },
  {
    username: "sales1",
    passwordRaw: "salespassword2026",
    name: "Sales Agent Tariku",
    phone: "+251912345678",
    role: "user"
  },
  {
    username: "customer1",
    passwordRaw: "customerpassword2026",
    name: "Biruk Abraham",
    phone: "+251911223344",
    role: "user"
  },
  {
    username: "testuser",
    passwordRaw: "testpassword2026",
    name: "Demo User",
    phone: "+251900112233",
    role: "user"
  }
];

async function seedUsers() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully.");

    console.log("Seeding user accounts...");
    let seededCount = 0;

    for (const u of usersToSeed) {
      // Hash the password just like server.js
      const hashedPassword = await bcrypt.hash(u.passwordRaw, 10);
      
      const userData = {
        username: u.username,
        password: hashedPassword,
        name: u.name,
        phone: u.phone,
        role: u.role
      };

      // Upsert by username so running this script multiple times won't duplicate users
      await User.findOneAndUpdate(
        { username: u.username },
        userData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      
      console.log(`- Seeded user: ${u.username} (${u.role}) | Pass: ${u.passwordRaw}`);
      seededCount++;
    }

    console.log(`\nSuccessfully seeded ${seededCount} user accounts.`);
    
    // Check total count
    const total = await User.countDocuments();
    console.log(`Total users in MongoDB collection 'users': ${total}`);

    mongoose.connection.close();
    console.log("Database connection closed. Seeding complete!");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedUsers();
