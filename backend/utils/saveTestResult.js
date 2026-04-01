const fs = require('fs').promises;
const path = require('path');

const TEST_RESULTS_DIR = path.join(__dirname, '../test-results');

async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function saveTestResult(result) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const dirPath = path.join(TEST_RESULTS_DIR, timestamp);
  
  await ensureDir(dirPath);
  
  // Save JSON result
  const jsonPath = path.join(dirPath, `${result.site.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
  await fs.writeFile(jsonPath, JSON.stringify(result, null, 2));
  
  // Save screenshot
  if (result.screenshot) {
    const screenshotPath = path.join(dirPath, `${result.site.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
    const imgBuffer = Buffer.from(result.screenshot, 'base64');
    await fs.writeFile(screenshotPath, imgBuffer);
  }
  
  console.log(`Saved result: ${jsonPath}`);
  return { jsonPath, screenshotPath: result.screenshot ? screenshotPath : null };
}

async function getLatestResultForSite(siteName) {
  try {
    const entries = await fs.readdir(TEST_RESULTS_DIR, { withFileTypes: true });
    const dirs = entries.filter(entry => entry.isDirectory())
      .sort((a, b) => b.name.localeCompare(a.name)) // newest first
      .map(dir => path.join(TEST_RESULTS_DIR, dir.name));
    
    for (const dir of dirs) {
      const files = await fs.readdir(dir);
      const jsonFile = files.find(f => f.startsWith(siteName.replace(/[^a-zA-Z0-9]/g, '_')) && f.endsWith('.json'));
      if (jsonFile) {
        const filePath = path.join(dir, jsonFile);
        const data = await fs.readFile(filePath, 'utf8');
        return { ...JSON.parse(data), reportDir: dir };
      }
    }
  } catch (error) {
    console.error('getLatestResultForSite error:', error.message);
  }
  return null;
}

module.exports = { saveTestResult, getLatestResultForSite };

