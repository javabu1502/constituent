/**
 * Form analysis using Claude Vision
 *
 * Takes screenshots of contact forms and uses Claude to identify
 * all form fields, their types, and how to fill them.
 */

import type { Page } from 'playwright';
import type { FormAnalysis, FormField, AnalyzerConfig } from './types';
import { takeScreenshot, scrollPage } from './browser';

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 4096;

/**
 * System prompt for Claude Vision form analysis
 */
const FORM_ANALYSIS_PROMPT = `You are an expert at analyzing web forms. You will be shown a screenshot of a congressional contact form page.

Your task is to identify ALL form fields on the page and return a detailed JSON structure describing them.

For each form field, identify:
1. A CSS selector that can be used to locate it (prefer ID selectors like "#fieldId", then name selectors like "[name='field']", then more specific selectors)
2. The field type (text, email, tel, textarea, select, radio, checkbox, hidden)
3. The human-readable label
4. Whether it's required (look for asterisks, "required" text, or required attribute)
5. For dropdowns/selects: list ALL the available options exactly as they appear
6. What kind of data this field expects (firstName, lastName, fullName, email, phone, street, city, state, zip, topic, subject, message, prefix, or other)

Also identify:
- The submit button selector
- Whether there's a CAPTCHA (reCAPTCHA, hCaptcha, image CAPTCHA, etc.)
- Whether this is a multi-page form (has "Next" or "Continue" instead of "Submit")
- If multi-page, the next button selector

CRITICAL: You MUST respond with ONLY valid JSON. No markdown, no explanation, just the JSON object.

The JSON structure should be:
{
  "fields": [
    {
      "selector": "#field-id or [name='fieldname'] or other CSS selector",
      "type": "text|email|tel|textarea|select|radio|checkbox|hidden",
      "label": "Field Label",
      "name": "field_name if available",
      "required": true|false,
      "options": ["option1", "option2"] // only for select/radio
      "dataType": "firstName|lastName|fullName|email|phone|street|city|state|zip|topic|subject|message|prefix|other",
      "placeholder": "placeholder text if any",
      "maxLength": 500 // if specified
    }
  ],
  "submitButtonSelector": "#submit or button[type='submit']",
  "hasCaptcha": false,
  "captchaType": null,
  "isMultiPage": false,
  "nextButtonSelector": null,
  "currentPage": 1,
  "totalPages": 1,
  "notes": "Any important observations",
  "confidence": 0.95
}`;

/**
 * Analyze a contact form page using Claude Vision
 */
export async function analyzeForm(
  page: Page,
  config: AnalyzerConfig
): Promise<FormAnalysis> {
  // Scroll the page to make sure we capture everything
  await scrollPage(page);

  // Take a full-page screenshot
  const screenshotBase64 = await takeScreenshot(page, { fullPage: true });

  // Call Claude Vision API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model || DEFAULT_MODEL,
      max_tokens: config.maxTokens || DEFAULT_MAX_TOKENS,
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
              text: FORM_ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Extract text from response
  let responseText = '';
  for (const block of data.content || []) {
    if (block.type === 'text') {
      responseText += block.text;
    }
  }

  // Parse the JSON response
  const analysis = parseAnalysisResponse(responseText);

  return analysis;
}

/**
 * Parse Claude's response into a FormAnalysis object
 */
function parseAnalysisResponse(responseText: string): FormAnalysis {
  // Clean up the response - remove any markdown code blocks
  let cleaned = responseText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');

  // Try to find JSON in the response
  const jsonStart = cleaned.indexOf('{');
  if (jsonStart > 0) {
    cleaned = cleaned.slice(jsonStart);
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse Claude response:', cleaned);
    throw new Error(`Failed to parse form analysis response: ${e}`);
  }

  // Validate and transform the response
  const fields: FormField[] = [];

  if (Array.isArray(parsed.fields)) {
    for (const field of parsed.fields) {
      if (field.selector && field.type) {
        fields.push({
          selector: String(field.selector),
          type: validateFieldType(field.type),
          label: String(field.label || ''),
          name: field.name ? String(field.name) : undefined,
          required: Boolean(field.required),
          options: Array.isArray(field.options) ? field.options.map(String) : undefined,
          dataType: validateDataType(field.dataType),
          placeholder: field.placeholder ? String(field.placeholder) : undefined,
          maxLength: typeof field.maxLength === 'number' ? field.maxLength : undefined,
        });
      }
    }
  }

  return {
    fields,
    submitButtonSelector: String(parsed.submitButtonSelector || 'button[type="submit"]'),
    hasCaptcha: Boolean(parsed.hasCaptcha),
    captchaType: parsed.captchaType ? validateCaptchaType(parsed.captchaType) : undefined,
    isMultiPage: Boolean(parsed.isMultiPage),
    nextButtonSelector: parsed.nextButtonSelector ? String(parsed.nextButtonSelector) : undefined,
    currentPage: typeof parsed.currentPage === 'number' ? parsed.currentPage : 1,
    totalPages: typeof parsed.totalPages === 'number' ? parsed.totalPages : undefined,
    notes: parsed.notes ? String(parsed.notes) : undefined,
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
  };
}

/**
 * Validate field type
 */
function validateFieldType(type: unknown): FormField['type'] {
  const validTypes = ['text', 'email', 'tel', 'textarea', 'select', 'radio', 'checkbox', 'hidden'];
  const typeStr = String(type).toLowerCase();
  if (validTypes.includes(typeStr)) {
    return typeStr as FormField['type'];
  }
  return 'text';
}

/**
 * Validate data type
 */
function validateDataType(dataType: unknown): FormField['dataType'] {
  const validTypes = [
    'firstName', 'lastName', 'fullName', 'email', 'phone',
    'street', 'city', 'state', 'zip', 'topic', 'subject', 'message', 'prefix', 'other'
  ];
  const typeStr = String(dataType);
  if (validTypes.includes(typeStr)) {
    return typeStr as FormField['dataType'];
  }
  return 'other';
}

/**
 * Validate captcha type
 */
function validateCaptchaType(captchaType: unknown): FormAnalysis['captchaType'] {
  const validTypes = ['recaptcha', 'hcaptcha', 'image', 'other'];
  const typeStr = String(captchaType).toLowerCase();
  if (validTypes.includes(typeStr)) {
    return typeStr as FormAnalysis['captchaType'];
  }
  return 'other';
}

/**
 * Try to enhance the analysis by also parsing the page's HTML
 * This can help fill in gaps from the screenshot analysis
 */
export async function enhanceAnalysisFromDOM(
  page: Page,
  analysis: FormAnalysis
): Promise<FormAnalysis> {
  // Get all form elements from the page
  const domFields = await page.evaluate(() => {
    const forms = document.querySelectorAll('form');
    const fields: Array<{
      selector: string;
      type: string;
      name: string;
      id: string;
      required: boolean;
      options: string[];
    }> = [];

    forms.forEach((form) => {
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach((input) => {
        const el = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        let selector = '';
        if (el.id) {
          selector = `#${el.id}`;
        } else if (el.name) {
          selector = `[name="${el.name}"]`;
        }

        const options: string[] = [];
        if (el.tagName === 'SELECT') {
          const select = el as HTMLSelectElement;
          for (let i = 0; i < select.options.length; i++) {
            const opt = select.options[i];
            if (opt.value) {
              options.push(opt.text || opt.value);
            }
          }
        }

        if (selector) {
          fields.push({
            selector,
            type: el.type || el.tagName.toLowerCase(),
            name: el.name,
            id: el.id,
            required: el.required || el.hasAttribute('required'),
            options,
          });
        }
      });
    });

    return fields;
  });

  // Merge DOM data with Claude's analysis
  for (const domField of domFields) {
    const existing = analysis.fields.find(
      (f) => f.selector === domField.selector || f.name === domField.name
    );

    if (!existing && domField.selector) {
      // Add fields Claude might have missed
      analysis.fields.push({
        selector: domField.selector,
        type: validateFieldType(domField.type),
        label: domField.name || domField.id || '',
        name: domField.name,
        required: domField.required,
        options: domField.options.length > 0 ? domField.options : undefined,
        dataType: 'other',
      });
    } else if (existing && domField.options.length > 0 && !existing.options) {
      // Add options Claude might have missed
      existing.options = domField.options;
    }
  }

  return analysis;
}
