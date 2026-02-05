/**
 * Form submission and verification
 *
 * Handles clicking submit and verifying the result using Claude Vision.
 */

import type { Page } from 'playwright';
import type { FormAnalysis, SubmissionResult, AnalyzerConfig } from './types';
import { takeScreenshot } from './browser';

/**
 * Submit a form and verify the result
 */
export async function submitForm(
  page: Page,
  analysis: FormAnalysis,
  config: AnalyzerConfig
): Promise<SubmissionResult> {
  const startTime = Date.now();

  try {
    // Try multiple strategies to find the submit button
    const submitStrategies = [
      // Use Claude's suggestion if provided (but clean up invalid CSS selectors)
      analysis.submitButtonSelector?.replace(/:contains\([^)]+\)/g, ''),
      // Common submit button patterns
      'button:has-text("Submit")',
      'button:has-text("Send")',
      'button:has-text("Send Message")',
      'input[type="submit"]',
      'button[type="submit"]',
      '#edit-submit',
      '.btn-primary[type="submit"]',
    ].filter(Boolean) as string[];

    let submitButton = null;
    let usedSelector = '';

    for (const selector of submitStrategies) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 })) {
          submitButton = button;
          usedSelector = selector;
          break;
        }
      } catch {
        // Try next selector
      }
    }

    if (!submitButton) {
      throw new Error('Could not find submit button with any strategy');
    }

    console.log(`Clicking submit button: ${usedSelector}`);

    // Click the submit button
    await Promise.all([
      // Wait for navigation or network idle
      page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
        // Some forms don't navigate, just show a message
      }),
      submitButton.click(),
    ]);

    // Wait a moment for any JS to update the page
    await page.waitForTimeout(2000);

    // Take a screenshot of the result
    const screenshotBase64 = await takeScreenshot(page, { fullPage: true });

    // Analyze the result using Claude Vision
    const verificationResult = await verifySubmission(page, screenshotBase64, config);

    return {
      ...verificationResult,
      screenshotBase64,
      timeTakenMs: Date.now() - startTime,
      pagesFilled: 1, // For single-page forms
    };
  } catch (error) {
    console.error('Submit error:', error);

    // Take a screenshot of the error state
    let screenshotBase64: string | undefined;
    try {
      screenshotBase64 = await takeScreenshot(page, { fullPage: true });
    } catch {
      // Ignore screenshot errors
    }

    return {
      success: false,
      status: 'network_error',
      message: `Submission failed: ${error}`,
      screenshotBase64,
      timeTakenMs: Date.now() - startTime,
      pagesFilled: 1,
    };
  }
}

/**
 * System prompt for submission verification
 */
const VERIFICATION_PROMPT = `You are analyzing a screenshot of a web page that was shown after submitting a congressional contact form.

Your task is to determine whether the form submission was SUCCESSFUL or FAILED.

Look for:
- SUCCESS indicators: "Thank you", "Message sent", "Your message has been received", confirmation numbers, green checkmarks, success messages
- FAILURE indicators: Error messages (red text), "Please fix the following errors", validation errors, CAPTCHA challenges, "required field" warnings

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "success": true|false,
  "status": "success" | "captcha_required" | "validation_error" | "network_error" | "unknown_error",
  "message": "Brief description of what you see",
  "confirmationNumber": "if visible, the confirmation/reference number" | null,
  "validationErrors": [{"field": "field name", "error": "error message"}] | null
}`;

/**
 * Verify submission result using Claude Vision
 */
async function verifySubmission(
  page: Page,
  screenshotBase64: string,
  config: AnalyzerConfig
): Promise<Pick<SubmissionResult, 'success' | 'status' | 'message' | 'confirmationNumber' | 'validationErrors'>> {
  // Also check the page content for common success/error patterns
  const pageText = await page.evaluate(() => document.body.innerText);
  const pageTextLower = pageText.toLowerCase();

  // Quick heuristic checks
  const hasSuccessText =
    pageTextLower.includes('thank you') ||
    pageTextLower.includes('message sent') ||
    pageTextLower.includes('has been received') ||
    pageTextLower.includes('successfully submitted') ||
    pageTextLower.includes('we have received');

  const hasErrorText =
    pageTextLower.includes('error') ||
    pageTextLower.includes('required') ||
    pageTextLower.includes('invalid') ||
    pageTextLower.includes('please correct') ||
    pageTextLower.includes('please fix');

  const hasCaptcha =
    pageTextLower.includes('captcha') ||
    pageTextLower.includes('verify you are human') ||
    pageTextLower.includes('recaptcha');

  // If we have clear success indicators and no error indicators, trust the heuristic
  if (hasSuccessText && !hasErrorText && !hasCaptcha) {
    return {
      success: true,
      status: 'success',
      message: 'Form submitted successfully (detected "thank you" message)',
      confirmationNumber: undefined,
      validationErrors: undefined,
    };
  }

  // If we have clear error indicators, trust the heuristic
  if (hasErrorText && !hasSuccessText) {
    return {
      success: false,
      status: 'validation_error',
      message: 'Form submission failed (detected error messages)',
      confirmationNumber: undefined,
      validationErrors: undefined,
    };
  }

  // If we detect captcha
  if (hasCaptcha) {
    return {
      success: false,
      status: 'captcha_required',
      message: 'CAPTCHA verification required',
      confirmationNumber: undefined,
      validationErrors: undefined,
    };
  }

  // Use Claude Vision for more nuanced analysis
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model || 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: screenshotBase64,
                },
              },
              {
                type: 'text',
                text: VERIFICATION_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();

    let responseText = '';
    for (const block of data.content || []) {
      if (block.type === 'text') {
        responseText += block.text;
      }
    }

    // Parse the JSON response
    const parsed = parseVerificationResponse(responseText);
    return parsed;
  } catch (error) {
    console.error('Claude verification failed:', error);

    // Fall back to a conservative "unknown" result
    return {
      success: false,
      status: 'unknown_error',
      message: 'Unable to verify submission result',
      confirmationNumber: undefined,
      validationErrors: undefined,
    };
  }
}

/**
 * Parse Claude's verification response
 */
function parseVerificationResponse(
  responseText: string
): Pick<SubmissionResult, 'success' | 'status' | 'message' | 'confirmationNumber' | 'validationErrors'> {
  // Clean up the response
  let cleaned = responseText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');

  const jsonStart = cleaned.indexOf('{');
  if (jsonStart > 0) {
    cleaned = cleaned.slice(jsonStart);
  }

  try {
    const parsed = JSON.parse(cleaned);

    return {
      success: Boolean(parsed.success),
      status: validateStatus(parsed.status),
      message: String(parsed.message || 'No message'),
      confirmationNumber: parsed.confirmationNumber ? String(parsed.confirmationNumber) : undefined,
      validationErrors: Array.isArray(parsed.validationErrors)
        ? parsed.validationErrors.map((e: { field?: string; error?: string }) => ({
            field: String(e.field || 'unknown'),
            error: String(e.error || 'unknown error'),
          }))
        : undefined,
    };
  } catch {
    return {
      success: false,
      status: 'unknown_error',
      message: 'Failed to parse verification response',
      confirmationNumber: undefined,
      validationErrors: undefined,
    };
  }
}

/**
 * Validate status value
 */
function validateStatus(status: unknown): SubmissionResult['status'] {
  const validStatuses = ['success', 'captcha_required', 'validation_error', 'network_error', 'unknown_error'];
  const statusStr = String(status);
  if (validStatuses.includes(statusStr)) {
    return statusStr as SubmissionResult['status'];
  }
  return 'unknown_error';
}

/**
 * Handle multi-page form navigation
 */
export async function goToNextPage(
  page: Page,
  analysis: FormAnalysis
): Promise<boolean> {
  if (!analysis.isMultiPage) {
    return false;
  }

  // Try multiple strategies to find the next button
  const nextButtonStrategies = [
    // Use Claude's suggestion if provided (but clean up invalid CSS selectors)
    analysis.nextButtonSelector?.replace(/:contains\([^)]+\)/g, ''),
    // Common patterns for "next" buttons
    'button:has-text("Next")',
    'button:has-text("GO TO NEXT STEP")',
    'button:has-text("Continue")',
    'input[value*="Next" i]',
    'input[value*="GO TO NEXT STEP" i]',
    'input[value*="Continue" i]',
    '#edit-submit',
    '.btn-primary',
    'button[type="submit"]',
  ].filter(Boolean) as string[];

  for (const selector of nextButtonStrategies) {
    try {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 1000 })) {
        console.log(`Found next button with selector: ${selector}`);

        await Promise.all([
          page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {}),
          button.click(),
        ]);

        await page.waitForTimeout(1500);
        return true;
      }
    } catch {
      // Try next selector
    }
  }

  console.error('Failed to find next button with any strategy');
  return false;
}
