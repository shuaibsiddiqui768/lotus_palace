const http = require('http');

// Test login with old email
const testOldEmail = () => {
  const data = JSON.stringify({
    mode: 'login',
    email: 'admin@foodhub.com',
    password: 'admin123'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/auth',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Old Email Status: ${res.statusCode}`);

    res.on('data', (chunk) => {
      try {
        const response = JSON.parse(chunk.toString());
        console.log('Old Email Response:', response);
        if (response.success) {
          console.log('✅ Old email works!');
        } else {
          console.log('❌ Old email failed, trying new email...');
          testNewEmail();
        }
      } catch (e) {
        console.log('Parse error:', e.message);
        testNewEmail();
      }
    });
  });

  req.on('error', (error) => {
    console.error('Old Email Error:', error.message);
    testNewEmail();
  });

  req.write(data);
  req.end();
};

// Test login with new email
const testNewEmail = () => {
  const data = JSON.stringify({
    mode: 'login',
    email: 'admin@foodmenu.com',
    password: 'admin123'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/auth',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    console.log(`New Email Status: ${res.statusCode}`);

    res.on('data', (chunk) => {
      try {
        const response = JSON.parse(chunk.toString());
        console.log('New Email Response:', response);
        if (response.success) {
          console.log('✅ New email works!');
        } else {
          console.log('❌ New email also failed');
        }
      } catch (e) {
        console.log('Parse error:', e.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('New Email Error:', error.message);
  });

  req.write(data);
  req.end();
};

testOldEmail();