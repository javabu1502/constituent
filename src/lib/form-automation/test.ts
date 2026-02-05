/**
 * Test script for form automation module
 *
 * Run with: npx tsx src/lib/form-automation/test.ts
 */

import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import {
  submitToRepresentative,
  lookupRepresentative,
  findRepresentativesWithForms,
  analyzeFormOnly,
  shutdown,
} from './index';

import type { ConstituentData } from './types';
import type { AutomationConfig } from './index';

// Real constituent data for testing
const TEST_CONSTITUENT: ConstituentData = {
  prefix: 'Mr.',
  firstName: 'Jared',
  lastName: 'Busker',
  email: 'jared@test.com',
  phone: '775-555-0123',
  street: '100 N Virginia St',
  city: 'Reno',
  state: 'NV',
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

// Test configuration
const TEST_CONFIG: AutomationConfig = {
  browser: {
    headless: false, // Set to false so we can watch it work
    slowMo: 150, // Slow down operations for visibility
    timeout: 60000,
    screenshotSteps: true,
    screenshotDir: path.join(process.cwd(), 'test-screenshots'),
  },
  analyzer: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-sonnet-4-20250514',
  },
  submit: true, // REAL SUBMISSION
  debugDir: path.join(process.cwd(), 'test-screenshots'),
};

async function main() {
  console.log('='.repeat(60));
  console.log('Form Automation Test Script');
  console.log('='.repeat(60));

  // Check for API key
  if (!TEST_CONFIG.analyzer.apiKey) {
    console.error('\nError: ANTHROPIC_API_KEY not set in .env.local');
    process.exit(1);
  }

  // Create screenshots directory
  if (TEST_CONFIG.debugDir) {
    fs.mkdirSync(TEST_CONFIG.debugDir, { recursive: true });
    console.log(`\nScreenshots will be saved to: ${TEST_CONFIG.debugDir}`);
  }

  // Find representatives with contact forms
  console.log('\n--- Finding representatives with contact forms ---');
  const reps = await findRepresentativesWithForms();
  console.log(`Found ${reps.length} representatives with contact forms`);

  // Show a few examples
  console.log('\nFirst 5 representatives:');
  for (const rep of reps.slice(0, 5)) {
    console.log(`  - ${rep.name} (${rep.bioguideId}): ${rep.contactFormUrl}`);
  }

  // Test with a specific representative
  // Using Mark Amodei (NV-2) as the test subject - Jared's actual representative
  const testBioguideId = 'A000369'; // Mark Amodei

  console.log(`\n--- Looking up representative ${testBioguideId} ---`);
  const repInfo = await lookupRepresentative(testBioguideId);

  if (!repInfo) {
    console.error(`Could not find representative with bioguide ID: ${testBioguideId}`);
    await shutdown();
    process.exit(1);
  }

  console.log(`Name: ${repInfo.name}`);
  console.log(`Contact Form (from data): ${repInfo.contactFormUrl}`);
  console.log(`Website: ${repInfo.website || 'N/A'}`);

  // Override with current working URL (the data has outdated URLs)
  const actualContactFormUrl = 'https://amodei.house.gov/email-me';
  console.log(`Using actual URL: ${actualContactFormUrl}`);

  // Test form analysis only first
  console.log('\n--- Analyzing form (without filling) ---');
  try {
    const analysis = await analyzeFormOnly(actualContactFormUrl, TEST_CONFIG);

    console.log('\nForm Analysis Results:');
    console.log(`  Fields found: ${analysis.fields.length}`);
    console.log(`  Has CAPTCHA: ${analysis.hasCaptcha}`);
    console.log(`  Is multi-page: ${analysis.isMultiPage}`);
    console.log(`  Submit button: ${analysis.submitButtonSelector}`);
    console.log(`  Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);

    if (analysis.notes) {
      console.log(`  Notes: ${analysis.notes}`);
    }

    console.log('\n  Fields:');
    for (const field of analysis.fields) {
      console.log(`    - ${field.label} (${field.type}, ${field.dataType})`);
      console.log(`      Selector: ${field.selector}`);
      console.log(`      Required: ${field.required}`);
      if (field.options) {
        console.log(`      Options: ${field.options.slice(0, 5).join(', ')}${field.options.length > 5 ? '...' : ''}`);
      }
    }
  } catch (error) {
    console.error('Form analysis failed:', error);
  }

  // Now test the full flow (REAL SUBMISSION)
  console.log('\n--- Testing full automation flow (REAL SUBMISSION) ---');
  console.log('NOTE: This will fill AND SUBMIT the form for real!');
  console.log('Watch the browser window to see it in action...\n');

  try {
    const result = await submitToRepresentative(
      actualContactFormUrl,
      TEST_CONSTITUENT,
      TEST_CONFIG
    );

    console.log('\n--- Automation Result ---');
    console.log(`Success: ${result.success}`);
    console.log(`Status: ${result.status}`);
    console.log(`Message: ${result.message}`);
    console.log(`Time taken: ${result.timeTakenMs}ms`);
    console.log(`Pages filled: ${result.pagesFilled}`);

    if (result.confirmationNumber) {
      console.log(`Confirmation: ${result.confirmationNumber}`);
    }

    if (result.validationErrors) {
      console.log('Validation errors:');
      for (const err of result.validationErrors) {
        console.log(`  - ${err.field}: ${err.error}`);
      }
    }
  } catch (error) {
    console.error('Automation failed:', error);
  }

  // Cleanup
  console.log('\n--- Shutting down ---');
  await shutdown();

  console.log('\nTest complete!');
  console.log(`Check ${TEST_CONFIG.debugDir} for screenshots.`);
}

// Run the test
main().catch((error) => {
  console.error('Test failed:', error);
  shutdown().finally(() => process.exit(1));
});
