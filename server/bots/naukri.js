const puppeteer = require('puppeteer');
const Application = require('../models/Application');

const delay = (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));

async function runNaukriBot(config) {
  const { skills, location, maxJobs, userId } = config;
  const results = { success: 0, failed: 0, skipped: 0, applications: [] };

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationEnabled',
      '--disable-blink-features=AutomationControlled'
    ],
  });

  try {
    const page = await browser.newPage();
    
    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Login logic
    await page.goto('https://www.naukri.com/nlogin/login', { waitUntil: 'networkidle2' });
    
    // Check if we hit a captcha immediately (sometimes Naukri uses Cloudflare or other checks)
    if (await page.$('.captcha') || await page.title().then(t => t.toLowerCase().includes('security'))) {
      throw new Error('captcha_detected');
    }

    // Fallback login for dev
    const testEmail = process.env.NAUKRI_TEST_EMAIL;
    const testPass = process.env.NAUKRI_TEST_PASS;
    
    if (testEmail && testPass) {
      await page.waitForSelector('#usernameField', { timeout: 10000 }).catch(() => null);
      if (await page.$('#usernameField')) {
        await page.type('#usernameField', testEmail, { delay: 50 });
        await page.type('#passwordField', testPass, { delay: 50 });
        
        const loginBtn = await page.$('button[type="submit"]');
        if (loginBtn) {
           await Promise.all([
             loginBtn.click(),
             page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
           ]);
        }
      } else {
        throw new Error('Login form not found');
      }
    } else {
      console.log('No test credentials provided, relying on existing session (which is not implemented yet).');
      throw new Error('missing_credentials');
    }

    if (await page.$('.captcha') || await page.title().then(t => t.toLowerCase().includes('security'))) {
      throw new Error('captcha_detected');
    }

    // Search jobs
    const keyword = skills && skills.length > 0 ? encodeURIComponent(skills[0]) : 'Software Engineer';
    const loc = location ? encodeURIComponent(location) : 'anywhere';
    // Format: naukri.com/jobs-in-{location}?k={skill}&experience=1-6
    const searchUrl = `https://www.naukri.com/jobs-in-${loc}?k=${keyword}&experience=1-6`;
    
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });
    
    // Wait for job cards (can be article.jobTupleHeader or .jobTuple)
    await page.waitForSelector('.jobTuple, article.jobTupleHeader', { timeout: 10000 }).catch(() => null);
    
    const jobCards = await page.$$('.jobTuple, article.jobTupleHeader');
    const jobsToProcess = Math.min(jobCards.length, maxJobs || 5);

    for (let i = 0; i < jobsToProcess; i++) {
      let currentApp = { userId, platform: 'naukri', jobTitle: 'Unknown Job', company: 'Unknown Company', status: 'failed' };
      
      try {
        const cards = await page.$$('.jobTuple, article.jobTupleHeader');
        if (!cards[i]) continue;

        // Naukri usually opens jobs in a new tab when clicked. We need to handle this.
        // Get the href of the job title link instead of clicking the card directly if possible.
        const linkEl = await cards[i].$('a.title');
        if (!linkEl) {
           currentApp.status = 'failed';
           currentApp.notes = 'Could not find job link';
           results.failed++;
           continue;
        }

        const url = await page.evaluate(el => el.href, linkEl);
        currentApp.jobTitle = await page.evaluate(el => el.innerText.trim(), linkEl);
        
        const companyEl = await cards[i].$('a.comp-name');
        if (companyEl) {
          currentApp.company = await page.evaluate(el => el.innerText.trim(), companyEl);
        }

        // Open new tab manually to keep control flow simple
        const jobPage = await browser.newPage();
        await jobPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await jobPage.goto(url, { waitUntil: 'networkidle2' });
        await delay(2000, 4000);

        // Check button status
        const applyBtn = await jobPage.$('#apply-button');
        const applyOnCompanySiteBtn = await jobPage.$('#company-site-button');
        const alreadyApplied = await jobPage.evaluate(() => {
           return document.body.innerText.includes('Already Applied');
        });

        if (alreadyApplied) {
          currentApp.status = 'skipped';
          currentApp.notes = 'Already applied';
          results.skipped++;
        } else if (applyOnCompanySiteBtn) {
          currentApp.status = 'skipped';
          currentApp.notes = 'Apply on company site';
          results.skipped++;
        } else if (applyBtn) {
          // Direct apply
          await applyBtn.click();
          await delay(2000, 3000);
          
          // Check for confirm modal
          const confirmBtn = await jobPage.$('.apply-message button');
          if (confirmBtn) {
             await confirmBtn.click();
             await delay(1000, 2000);
          }
          
          currentApp.status = 'success';
          results.success++;
        } else {
          currentApp.status = 'skipped';
          currentApp.notes = 'No valid apply button found';
          results.skipped++;
        }

        await jobPage.close();
      } catch (err) {
        currentApp.status = 'failed';
        currentApp.notes = err.message;
        results.failed++;
      } finally {
        // Save immediately
        const savedApp = await Application.create(currentApp);
        results.applications.push(savedApp);
        await delay(2000, 4000);
      }
    }

  } catch (error) {
    console.error('Naukri Bot Error:', error);
    if (error.message === 'captcha_detected') {
      throw error; // Re-throw to be handled by runner
    }
  } finally {
    await browser.close();
  }

  return results;
}

module.exports = { runNaukriBot };
