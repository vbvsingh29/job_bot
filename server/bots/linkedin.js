const puppeteer = require('puppeteer');
const Application = require('../models/Application');

const delay = (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));

async function runLinkedInBot(config) {
  const { email, password, skills, location, maxJobs, userId } = config;
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
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });
    
    // Check if we hit a captcha immediately
    if (await page.$('#captcha-internal')) {
      throw new Error('captcha_detected');
    }

    // Determine login credentials (config first, fallback to env)
    const loginEmail = email || process.env.LINKEDIN_EMAIL;
    const loginPass = password || process.env.LINKEDIN_PASS;
    
    if (loginEmail && loginPass) {
      await page.waitForSelector('#username', { timeout: 10000 }).catch(() => null);
      if (await page.$('#username')) {
        await page.type('#username', loginEmail, { delay: 50 });
        await page.type('#password', loginPass, { delay: 50 });
        await page.click('[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
      } else {
        throw new Error('Login form not found');
      }
    } else {
      console.log('No credentials provided for LinkedIn login.');
      throw new Error('missing_credentials');
    }

    if (await page.title().then(t => t.toLowerCase().includes('security'))) {
      throw new Error('captcha_detected');
    }

    // Search jobs
    // We'll use the first skill for the search query
    const keyword = skills && skills.length > 0 ? encodeURIComponent(skills[0]) : 'Software Engineer';
    const loc = location ? encodeURIComponent(location) : 'Worldwide';
    const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${keyword}&location=${loc}&f_AL=true`;
    
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });
    
    // Wait for job cards
    await page.waitForSelector('.job-card-container', { timeout: 10000 }).catch(() => null);
    
    const jobCards = await page.$$('.job-card-container');
    const jobsToProcess = Math.min(jobCards.length, maxJobs || 5);

    for (let i = 0; i < jobsToProcess; i++) {
      let currentApp = { userId, platform: 'linkedin', jobTitle: 'Unknown Job', company: 'Unknown Company', status: 'failed' };
      
      try {
        const cards = await page.$$('.job-card-container');
        if (!cards[i]) continue;

        await cards[i].click();
        await delay(2000, 3500);

        // Extract job details
        const titleEl = await page.$('.jobs-details-top-card__job-title');
        if (titleEl) {
          currentApp.jobTitle = await page.evaluate(el => el.innerText.trim(), titleEl);
        }

        const companyEl = await page.$('.jobs-details-top-card__company-url');
        if (companyEl) {
          currentApp.company = await page.evaluate(el => el.innerText.trim(), companyEl);
        }

        // Look for Easy Apply button
        const easyApplyBtn = await page.$('.jobs-apply-button--top-card button');
        
        if (!easyApplyBtn) {
          currentApp.status = 'skipped';
          currentApp.notes = 'No Easy Apply button found or already applied';
          results.skipped++;
        } else {
          await easyApplyBtn.click();
          await delay(1500, 2500);
          
          // Handle modal steps
          let maxSteps = 10;
          let isSubmitted = false;
          
          while (maxSteps > 0 && !isSubmitted) {
            maxSteps--;
            const submitBtn = await page.$('button[aria-label="Submit application"]');
            
            if (submitBtn) {
              await submitBtn.click();
              isSubmitted = true;
              currentApp.status = 'success';
              results.success++;
              await delay(2000, 3000);
              
              // Close success modal if exists
              const dismissBtn = await page.$('button[aria-label="Dismiss"]');
              if (dismissBtn) await dismissBtn.click();
              
            } else {
              const nextBtn = await page.$('button[aria-label="Continue to next step"]');
              if (nextBtn) {
                await nextBtn.click();
                await delay(1000, 2000);
              } else {
                // Cannot proceed
                currentApp.status = 'skipped';
                currentApp.notes = 'Could not find Next or Submit button in modal';
                results.skipped++;
                
                // Try to close modal
                const closeBtn = await page.$('button[aria-label="Dismiss"]');
                if (closeBtn) {
                  await closeBtn.click();
                  await delay(500, 1000);
                  const confirmClose = await page.$('button[data-control-name="discard_application_confirm_btn"]');
                  if (confirmClose) await confirmClose.click();
                }
                break;
              }
            }
          }
        }
      } catch (err) {
        currentApp.status = 'failed';
        currentApp.notes = err.message;
        results.failed++;
      } finally {
        // Save immediately
        const savedApp = await Application.create(currentApp);
        results.applications.push(savedApp);
        await delay(2000, 3500);
      }
    }

  } catch (error) {
    console.error('LinkedIn Bot Error:', error);
    if (error.message === 'captcha_detected') {
      throw error; // Re-throw to be handled by runner
    }
  } finally {
    await browser.close();
  }

  return results;
}

module.exports = { runLinkedInBot };
