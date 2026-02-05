/**
 * Targeted test for Mark Amodei's contact form
 *
 * This form has a specific multi-step flow:
 * 1. Address verification (validates you're in the district)
 * 2. Contact information
 * 3. Message composition
 *
 * Run with: npx tsx src/lib/form-automation/test-amodei.ts
 */

import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { chromium, type Page, type Browser, type BrowserContext } from 'playwright';

const SCREENSHOT_DIR = path.join(process.cwd(), 'test-screenshots');

// Jared's real info
const CONSTITUENT = {
  prefix: 'Mr.',
  firstName: 'Jared',
  lastName: 'Busker',
  email: 'jared@test.com',
  phone: '7755550123',
  street: '100 N Virginia St',
  city: 'Reno',
  state: 'Nevada',
  stateCode: 'NV',
  zip: '89501',
  topic: 'Technology',
  subject: 'Support for Open Source Software in Government',
  message: `Dear Representative Amodei,

As your constituent in Reno, I am writing to express my support for increased adoption of open source software in federal government operations.

Open source software offers significant benefits:
- Cost savings through reduced licensing fees
- Improved security through transparent, auditable code
- Greater flexibility and customization for government needs
- Support for American innovation and technology leadership

I urge you to support legislation that encourages federal agencies to evaluate and adopt open source solutions where appropriate.

Thank you for your continued service to Nevada's 2nd Congressional District.

Respectfully,
Jared Busker
Reno, NV`,
};

async function saveScreenshot(page: Page, name: string): Promise<void> {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: true
  });
  console.log(`  Screenshot saved: ${name}.png`);
}

async function fillAmodeiForm(page: Page): Promise<boolean> {
  console.log('\n=== Step 1: Address Verification ===');

  // Fill street address
  console.log('Filling street address...');
  await page.fill('#edit-address-lookup-address-line1', CONSTITUENT.street);
  await page.waitForTimeout(300);

  // Fill city
  console.log('Filling city...');
  await page.fill('#edit-address-lookup-locality', CONSTITUENT.city);
  await page.waitForTimeout(300);

  // Wait for state dropdown to be enabled (form validates address first)
  console.log('Waiting for state dropdown to be enabled...');
  const stateSelect = page.locator('#edit-address-lookup-administrative-area');

  // Try to wait for it to be enabled, with retries
  let stateEnabled = false;
  for (let i = 0; i < 20; i++) {
    const isDisabled = await stateSelect.isDisabled();
    if (!isDisabled) {
      stateEnabled = true;
      break;
    }
    await page.waitForTimeout(500);
  }

  if (!stateEnabled) {
    console.log('State dropdown did not become enabled. Trying to proceed anyway...');
    // The state might already be pre-selected to Nevada
  } else {
    console.log('Selecting state (Nevada)...');
    try {
      await stateSelect.selectOption({ label: 'Nevada' });
    } catch (e) {
      console.log('Could not select state, may already be selected');
    }
  }

  await saveScreenshot(page, '01-address-filled');

  // Click "Go To Next Step"
  console.log('Clicking "Go To Next Step"...');
  const nextButton = page.locator('#edit-submit');
  await nextButton.click();

  // Wait for navigation
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  await saveScreenshot(page, '02-after-address');

  // Check if we're on a different page
  const currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);

  // Check for any error messages
  const errorText = await page.locator('.messages--error, .error-message, .alert-danger').textContent().catch(() => '');
  if (errorText) {
    console.log(`Error message found: ${errorText}`);
    return false;
  }

  // Look for the next form fields (contact info page)
  console.log('\n=== Step 2: Contact Information ===');

  // Try to find contact form fields
  const prefixField = page.locator('select[name*="prefix"], select[name*="title"], #edit-field-prefix');
  const firstNameField = page.locator('input[name*="first_name"], input[name*="firstname"], #edit-field-first-name');
  const lastNameField = page.locator('input[name*="last_name"], input[name*="lastname"], #edit-field-last-name');
  const emailField = page.locator('input[name*="email"], input[type="email"]');
  const phoneField = page.locator('input[name*="phone"], input[type="tel"]');

  // Check if we're on the contact form page
  if (await firstNameField.count() > 0 || await emailField.count() > 0) {
    console.log('Found contact form fields!');

    // Fill prefix if available
    if (await prefixField.count() > 0 && await prefixField.isVisible()) {
      console.log('Filling prefix...');
      try {
        await prefixField.selectOption({ label: CONSTITUENT.prefix });
      } catch {
        await prefixField.selectOption({ label: 'Mr.' });
      }
    }

    // Fill first name
    if (await firstNameField.count() > 0 && await firstNameField.isVisible()) {
      console.log('Filling first name...');
      await firstNameField.fill(CONSTITUENT.firstName);
    }

    // Fill last name
    if (await lastNameField.count() > 0 && await lastNameField.isVisible()) {
      console.log('Filling last name...');
      await lastNameField.fill(CONSTITUENT.lastName);
    }

    // Fill email
    if (await emailField.count() > 0 && await emailField.isVisible()) {
      console.log('Filling email...');
      await emailField.first().fill(CONSTITUENT.email);
    }

    // Fill phone
    if (await phoneField.count() > 0 && await phoneField.isVisible()) {
      console.log('Filling phone...');
      await phoneField.first().fill(CONSTITUENT.phone);
    }

    await saveScreenshot(page, '03-contact-filled');

    // Look for next button
    const nextBtn2 = page.locator('input[value*="Next" i], button:has-text("Next"), #edit-submit');
    if (await nextBtn2.count() > 0) {
      console.log('Clicking next button...');
      await nextBtn2.first().click();
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }
  }

  await saveScreenshot(page, '04-after-contact');

  // Look for message fields
  console.log('\n=== Step 3: Message Composition ===');

  const topicField = page.locator('select[name*="topic"], select[name*="issue"], select[name*="subject"]');
  const subjectField = page.locator('input[name*="subject"], #edit-field-subject');
  const messageField = page.locator('textarea[name*="message"], textarea[name*="comment"], #edit-field-message');

  if (await messageField.count() > 0 || await topicField.count() > 0) {
    console.log('Found message form fields!');

    // Fill topic
    if (await topicField.count() > 0 && await topicField.isVisible()) {
      console.log('Filling topic...');
      try {
        await topicField.selectOption({ label: CONSTITUENT.topic });
      } catch {
        // Try first option
        const options = await topicField.locator('option').allTextContents();
        console.log(`Available topics: ${options.slice(0, 5).join(', ')}...`);
        if (options.length > 1) {
          await topicField.selectOption({ index: 1 });
        }
      }
    }

    // Fill subject
    if (await subjectField.count() > 0 && await subjectField.isVisible()) {
      console.log('Filling subject...');
      await subjectField.fill(CONSTITUENT.subject);
    }

    // Fill message
    if (await messageField.count() > 0 && await messageField.isVisible()) {
      console.log('Filling message...');
      await messageField.fill(CONSTITUENT.message);
    }

    await saveScreenshot(page, '05-message-filled');

    // Look for submit button
    const submitBtn = page.locator('input[value*="Submit" i], input[value*="Send" i], button:has-text("Submit"), button:has-text("Send")');
    if (await submitBtn.count() > 0) {
      console.log('\n=== Submitting Form ===');
      await submitBtn.first().click();

      // Wait for submission
      await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(3000);

      await saveScreenshot(page, '06-submitted');

      // Check for success message
      const pageText = await page.textContent('body') || '';
      const pageLower = pageText.toLowerCase();

      if (pageLower.includes('thank you') || pageLower.includes('message sent') || pageLower.includes('has been received')) {
        console.log('\n✅ SUCCESS! Form submitted successfully!');
        return true;
      } else if (pageLower.includes('error') || pageLower.includes('required')) {
        console.log('\n❌ FAILED - Validation errors detected');
        return false;
      }
    }
  }

  // If we get here, we might still be on the address page
  const pageText = await page.textContent('body') || '';
  console.log('\nCurrent page content preview:');
  console.log(pageText.substring(0, 500) + '...');

  return false;
}

async function main() {
  console.log('============================================================');
  console.log('Amodei Contact Form Test');
  console.log('============================================================');
  console.log(`\nConstituent: ${CONSTITUENT.firstName} ${CONSTITUENT.lastName}`);
  console.log(`Address: ${CONSTITUENT.street}, ${CONSTITUENT.city}, ${CONSTITUENT.stateCode} ${CONSTITUENT.zip}`);
  console.log(`Email: ${CONSTITUENT.email}`);

  // Create screenshots directory
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  console.log('\nLaunching browser...');
  const browser: Browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });

  const context: BrowserContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page: Page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    console.log('\nNavigating to Amodei contact form...');
    await page.goto('https://amodei.house.gov/email-me', { waitUntil: 'networkidle' });

    await saveScreenshot(page, '00-initial');

    const success = await fillAmodeiForm(page);

    if (success) {
      console.log('\n============================================================');
      console.log('FORM SUBMISSION SUCCESSFUL!');
      console.log('============================================================');
    } else {
      console.log('\n============================================================');
      console.log('Form submission may have failed or requires manual review.');
      console.log('Check the screenshots in:', SCREENSHOT_DIR);
      console.log('============================================================');
    }

  } catch (error) {
    console.error('\nError during form automation:', error);
    await saveScreenshot(page, 'error');
  } finally {
    // Keep browser open for a moment to see final state
    console.log('\nKeeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);

    await context.close();
    await browser.close();
  }
}

main().catch(console.error);
