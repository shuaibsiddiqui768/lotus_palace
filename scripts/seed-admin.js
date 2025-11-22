const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LENGTH = 64;
const PBKDF2_DIGEST = 'sha512';

function deriveKey(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, PBKDF2_DIGEST, (error, derivedKey) => {
      if (error) {
        reject(error);
      } else {
        resolve(derivedKey);
      }
    });
  });
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const derivedKey = await deriveKey(password, salt);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function createAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodhub';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Define Admin schema directly
    const adminSchema = new mongoose.Schema({
      username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        minlength: 3,
        maxlength: 50,
      },
      email: {
        type: String,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      },
      name: {
        type: String,
        required: true,
        maxlength: 100,
      },
      passwordHash: {
        type: String,
        required: true,
        select: false,
      },
      role: {
        type: String,
        enum: ['admin', 'superadmin'],
        default: 'admin',
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      lastLogin: Date,
    }, {
      timestamps: true,
    });

    const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create password hash
    const passwordHash = await hashPassword('admin123');

    // Create admin user
    const admin = new Admin({
      username: 'admin',
      email: 'admin@foodhub.com',
      name: 'System Administrator',
      passwordHash,
      role: 'superadmin',
      isActive: true,
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Role: superadmin');

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createAdmin();