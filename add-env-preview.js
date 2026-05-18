const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Use the sirubin token
const token = 'puOymIh3y5f1w3ePG6rZh4qLbwsEv5SZDD2eWkc6kyhA15S4';

// Read service account
const saPath = path.join(__dirname, 'service-account', 'kedinasan-e5317-firebase-adminsdk-fbsvc-79852a38b0.json');
const sa = fs.readFileSync(saPath, 'utf8');

const body = {
  target: ['preview'],
  key: 'FIREBASE_SERVICE_ACCOUNT_KEY',
  value: sa,
  type: 'encrypted'
};

const https = require('https');
const data = JSON.stringify(body);

const options = {
  hostname: 'api.vercel.com',
  path: '/v10/projects/prj_fzbahfa61Pr8CNYKZOM9vwJUg3M/env',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(body);
  });
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
