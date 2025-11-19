const mongoose = require('mongoose');

async function dropIndex() {
  await mongoose.connect('mongodb+srv://ssiddiqui2106_db_user:6yn4YKnN3CWc5bXT@foodmenu.rebtatq.mongodb.net/foodhub?retryWrites=true&w=majority');
  const db = mongoose.connection.db;
  try {
    await db.collection('users').dropIndex('phone_1');
    console.log('Index dropped');
  } catch (e) {
    console.log('Index not found or error:', e.message);
  }
  await mongoose.disconnect();
}

dropIndex();