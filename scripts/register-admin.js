const http = require('http');

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
  console.log(`Status: ${res.statusCode}`);

  res.on('data', (chunk) => {
    const response = JSON.parse(chunk.toString());
    console.log('Response:', response);
    if (response.success) {
      console.log('✅ Admin created successfully!');
      console.log('Username: admin');
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