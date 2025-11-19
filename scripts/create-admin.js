const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('MONGODB_URI not found in environment variables');
  process.exit(1);
}

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  email: { type: String, lowercase: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

function deriveKey(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await deriveKey(password, salt);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully');

    // Check if admin exists
    const existing = await Admin.findOne({ username: 'admin' });
    if (existing) {
      console.log('Admin user already exists');
      return;
    }

    console.log('Creating admin user...');
    const passwordHash = await hashPassword('admin123');

    const admin = new Admin({
      username: 'admin',
      email: 'admin@foodhub.com',
      name: 'System Administrator',
      passwordHash,
      role: 'superadmin',
      isActive: true,
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

createAdmin();