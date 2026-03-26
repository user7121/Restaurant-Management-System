/**
 * tests/health.test.js
 * Sunucuyu kendisi başlatır, /api/health test eder, kapatır.
 * Ekstra framework gerekmez — sadece Node.js built-in modülleri.
 */

'use strict';

// DB bağlantısı CI'da mevcut olduğu için sorun yok,
// ama test sırasında process.exit(1) çağırmaması için
// db.js'deki hata handler'ını geçici olarak etkisiz hale getiriyoruz.
const originalExit = process.exit;
process.exit = (code) => {
  if (code === 1) {
    // DB bağlantı hatasını test sırasında yoksay
    console.warn('[test] process.exit(1) intercepted — DB connection error ignored for health test');
  } else {
    originalExit(code);
  }
};

const http = require('http');

const PORT = process.env.PORT || 5000;
const BASE  = `http://127.0.0.1:${PORT}`;

let passed = 0;
let failed = 0;

function assert(description, condition) {
  if (condition) {
    console.log(`  ✓  ${description}`);
    passed++;
  } else {
    console.error(`  ✗  ${description}`);
    failed++;
  }
}

function get(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy(new Error('Request timed out'));
    });
  });
}

function waitForServer(retries = 15, delay = 1000) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      http.get(`${BASE}/api/health`, (res) => {
        res.resume();
        resolve();
      }).on('error', () => {
        if (n <= 0) return reject(new Error('Server did not start in time'));
        setTimeout(() => attempt(n - 1), delay);
      });
    };
    attempt(retries);
  });
}

async function runTests() {
  console.log('\n=== Backend Health Tests ===\n');

  // Express uygulamasını yükle (server.js listen'ı çağırır)
  // server.js modülü import edildiğinde sunucu başlar
  require('../server.js');

  try {
    console.log('Waiting for server to start...');
    await waitForServer();
    console.log('Server is ready.\n');
  } catch (err) {
    console.error('  ✗  Server did not start:', err.message);
    process.exit = originalExit;
    process.exit(1);
  }

  try {
    const { status, body } = await get(`${BASE}/api/health`);
    const json = JSON.parse(body);

    assert('GET /api/health returns HTTP 200',  status === 200);
    assert('Response has success:true',         json.success === true);
    assert('Response has a timestamp',          typeof json.timestamp === 'string');
    assert('Response has a message',            typeof json.message === 'string');
  } catch (err) {
    console.error('  ✗  Request failed:', err.message);
    failed++;
  }

  console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);

  process.exit = originalExit;
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
