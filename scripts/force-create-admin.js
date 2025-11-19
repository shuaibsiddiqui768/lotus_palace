const http = require('http');

// First try to delete any existing admin, then create new one
const deleteExisting = () => {
  console.log('Checking for existing admins...');
  // Since we can't directly delete, let's just try to create
  createAdmin();
};

const createAdmin = () => {
  console.log('Creating admin with correct email...');

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
    console.log(`Create Status: ${res.statusCode}`);

    res.on('data', (chunk) => {
      try {
        const response = JSON.parse(chunk.toString());
        console.log('Create Response:', response);
        if (response.success) {
          console.log('✅ Admin created successfully!');
          console.log('Email: admin@foodmenu.com');
          console.log('Password: admin123');
          testLogin();
        } else {
          console.log('❌ Create failed:', response.message);
        }
      } catch (e) {
        console.log('Parse error:', e.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Create Error:', error.message);
  });

  req.write(data);
  req.end();
};

const testLogin = () => {
  console.log('Testing login...');

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
    console.log(`Login Status: ${res.statusCode}`);

    res.on('data', (chunk) => {
      try {
        const response = JSON.parse(chunk.toString());
        console.log('Login Response:', response);
        if (response.success) {
          console.log('✅ Login successful!');
        } else {
          console.log('❌ Login failed:', response.message);
        }
      } catch (e) {
        console.log('Parse error:', e.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Login Error:', error.message);
  });

  req.write(data);
  req.end();
};

deleteExisting();