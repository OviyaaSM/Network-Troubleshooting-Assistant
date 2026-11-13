import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const puppeteer = require('../backend/node_modules/puppeteer');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const screenshotsDir = path.join(rootDir, 'docs', 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('[Script] Starting Backend Server...');
  const backendProc = spawn('node', ['server.js'], {
    cwd: path.join(rootDir, 'backend'),
    env: { ...process.env, PORT: '5000', NODE_ENV: 'production' },
    stdio: 'inherit'
  });

  console.log('[Script] Starting Frontend Preview Server...');
  const frontendProc = spawn('npx', ['vite', 'preview', '--port', '5173'], {
    cwd: path.join(rootDir, 'frontend'),
    shell: true,
    stdio: 'inherit'
  });

  await sleep(4000);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('[Script] Launching Headless Chrome Browser...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    console.log('[Script] Navigating to Dashboard...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await sleep(2000);
    await page.screenshot({ path: path.join(screenshotsDir, 'dashboard.png') });
    console.log('[Screenshot] Saved dashboard.png');

    // 1. Go to Network Diagnosis
    console.log('[Script] Navigating to Network Diagnosis...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Network Diagnosis'));
      if (btn) btn.click();
    });
    await sleep(1500);
    await page.screenshot({ path: path.join(screenshotsDir, 'network-diagnosis.png') });
    console.log('[Screenshot] Saved network-diagnosis.png');

    // Start a diagnosis to get results
    console.log('[Script] Running Diagnosis...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Start Diagnosis'));
      if (btn) btn.click();
    });
    await sleep(4000);
    await page.screenshot({ path: path.join(screenshotsDir, 'diagnostic-results.png') });
    console.log('[Screenshot] Saved diagnostic-results.png');

    // 2. Go to Troubleshooting Assistant
    console.log('[Script] Navigating to Troubleshooting Assistant...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Troubleshooting Assistant'));
      if (btn) btn.click();
    });
    await sleep(1500);

    // Click prompt
    await page.evaluate(() => {
      const promptBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Identify devices with connectivity issues'));
      if (promptBtn) promptBtn.click();
    });
    await sleep(2500);
    await page.screenshot({ path: path.join(screenshotsDir, 'troubleshooting-assistant.png') });
    console.log('[Screenshot] Saved troubleshooting-assistant.png');

    // 3. Go to Network Topology
    console.log('[Script] Navigating to Network Topology...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Network Topology'));
      if (btn) btn.click();
    });
    await sleep(1500);
    await page.screenshot({ path: path.join(screenshotsDir, 'network-topology.png') });
    console.log('[Screenshot] Saved network-topology.png');

    // 4. Go to Diagnostic History
    console.log('[Script] Navigating to Diagnostic History...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Diagnostic History'));
      if (btn) btn.click();
    });
    await sleep(1500);
    await page.screenshot({ path: path.join(screenshotsDir, 'diagnostic-history.png') });
    console.log('[Screenshot] Saved diagnostic-history.png');

    // 5. Go to FLAT Engine & DFA
    console.log('[Script] Navigating to FLAT Engine & DFA...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('FLAT Engine & DFA'));
      if (btn) btn.click();
    });
    await sleep(1500);
    await page.screenshot({ path: path.join(screenshotsDir, 'flat-dfa-visualization.png') });
    console.log('[Screenshot] Saved flat-dfa-visualization.png');

    console.log('[Script] All 7 screenshots captured successfully!');
  } catch (err) {
    console.error('[Script] Error capturing screenshots:', err);
  } finally {
    await browser.close();
    backendProc.kill();
    frontendProc.kill();
    process.exit(0);
  }
}

main();
