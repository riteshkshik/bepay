const http = require('http');

const POST = (data, key) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/payments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Idempotency-Key': key
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
};

async function runTests() {
  const key1 = 'key_' + Math.random().toString(36).substring(7);
  const payload1 = {
    amount: 100,
    currency: 'USD',
    beneficiary: { name: 'Alice', account: '123' }
  };

  console.log('--- Test 1: Happy Path ---');
  const res1 = await POST(payload1, key1);
  console.log('Status:', res1.status);
  console.log('Body:', res1.body);
  if (res1.status === 200 && res1.body.id) console.log('PASS');
  else console.log('FAIL');

  console.log('\n--- Test 2: Idempotency Replay (Same Key, Same Payload) ---');
  const res2 = await POST(payload1, key1);
  console.log('Status:', res2.status);
  console.log('Body:', res2.body);
  if (res2.status === 200 && res2.body.id === res1.body.id) console.log('PASS');
  else console.log('FAIL');

  console.log('\n--- Test 3: Idempotency Conflict (Same Key, Diff Payload) ---');
  const payload2 = { ...payload1, amount: 200 };
  const res3 = await POST(payload2, key1);
  console.log('Status:', res3.status);
  console.log('Body:', res3.body);
  if (res3.status === 409) console.log('PASS');
  else console.log('FAIL');
}

runTests().catch(console.error);
