const http = require('http');

// First, let's check if admin exists and update the email
const checkData = JSON.stringify({
  mode: 'login',
  email: 'admin@foodhub.com',
  password: 'admin123'
});

const checkOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/auth',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': checkData.length
  }
};

const checkReq = http.request(checkOptions, (res) => {
  console.log(`Check Status: ${res.statusCode}`);

  res.on('data', (chunk) => {
    const response = JSON.parse(chunk.toString());
    if (response.success) {
      console.log('✅ Admin exists with old email, need to update');
      // If admin exists, we need to register a new one with the correct email
      // But since registration is blocked when admins exist, let's try to register anyway
      registerNewAdmin();
    } else {
      console.log('Admin does not exist or wrong email, registering new admin...');
      registerNewAdmin();
    }
  });
});

checkReq.on('error', (error) => {
  console.error('Check Error:', error.message);
  registerNewAdmin();
});

checkReq.write(checkData);
checkReq.end();

function registerNewAdmin() {
  const data = JSON.stringify({
    mode: 'register',
    username: 'admin',
    password: 'admin123',
    name: 'System Administrator',
    email: 'admin@foodmenu.com'
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
    console.log(`Register Status: ${res.statusCode}`);

    res.on('data', (chunk) => {
      const response = JSON.parse(chunk.toString());
      console.log('Response:', response);
      if (response.success) {
        console.log('✅ Admin created successfully!');
        console.log('Email: admin@foodmenu.com');
        console.log('Password: admin123');
      } else {
        console.log('❌ Failed:', response.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error:', error.message);
  });

  req.write(data);
  req.end();
}