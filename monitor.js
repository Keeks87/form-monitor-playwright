const { chromium } = require('playwright');
const { google } = require('googleapis');
const fs = require('fs');

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_JSON);
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const SHEET_ID = process.env.SHEET_ID;
const SHEET_NAME = 'Sheet1';

async function logToSheet(row) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:D`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] }
  });
}

async function runMonitor() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const formUrl = 'https://your-form-url-here';
  const timestamp = new Date().toISOString();

  try {
    const start = Date.now();
    await page.goto(formUrl, { waitUntil: 'domcontentloaded' });

    // Adjust selectors to match your form
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password1"]', 'TestPassword123!');
    await page.fill('input[name="password2"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'load' });

    const end = Date.now();
    const loadTime = end - start;
    await logToSheet([timestamp, formUrl, loadTime, '✅ Success']);
    console.log(`✅ Loaded in ${loadTime}ms`);
  } catch (err) {
    await logToSheet([timestamp, formUrl, 'N/A', `❌ ${err.message}`]);
    console.error('❌ Error:', err.message);
  } finally {
    await browser.close();
  }
}

runMonitor();
