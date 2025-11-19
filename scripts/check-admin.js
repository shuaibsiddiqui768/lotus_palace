const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/auth',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);

  res.on('data', (chunk) => {
    try {
      const response = JSON.parse(chunk.toString());
      console.log('Response:', JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('Raw response:', chunk.toString());
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();