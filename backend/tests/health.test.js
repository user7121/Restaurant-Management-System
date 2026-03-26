/**
 * tests/health.test.js
 * Lightweight smoke test — no extra test framework needed.
 * Starts the Express server, hits /api/health, then exits.
 *
 * Exit 0 = pass, Exit 1 = fail.
 */

'use strict';

const http = require('http');

// Give the DB connection (db.js) a moment to fail fast if env vars are missing
// before we try to ping the health route.
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
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('\n=== Backend Health Tests ===\n');

  try {
    const { status, body } = await get(`${BASE}/api/health`);
    const json = JSON.parse(body);

    assert('GET /api/health returns HTTP 200', status === 200);
    assert('Response has success:true',        json.success === true);
    assert('Response has a timestamp',         typeof json.timestamp === 'string');
    assert('Response has a message',           typeof json.message === 'string');
  } catch (err) {
    console.error('  ✗  Request to /api/health failed:', err.message);
    failed++;
  }

  console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

// Wait a moment for the server to bind
setTimeout(runTests, 1500);
