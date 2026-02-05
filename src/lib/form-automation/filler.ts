/**
 * Form filling logic
 *
 * Maps constituent data to form fields and fills them using Playwright.
 */

import type { Page } from 'playwright';
import type { FormAnalysis, FormField, ConstituentData } from './types';

/**
 * Fill a form with constituent data
 */
export async function fillForm(
  page: Page,
  analysis: FormAnalysis,
  data: ConstituentData
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  for (const field of analysis.fields) {
    try {
      const value = getValueForField(field, data);

      if (value !== null) {
        await fillField(page, field, value);
        console.log(`Filled field "${field.label}" (${field.dataType}) with value`);
      } else if (field.required) {
        errors.push(`No value found for required field: ${field.label}`);
      }
    } catch (err) {
      const message = `Failed to fill field "${field.label}": ${err}`;
      console.error(message);
      errors.push(message);
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Get the appropriate value from constituent data for a field
 */
function getValueForField(field: FormField, data: ConstituentData): string | null {
  // First try to match by dataType
  switch (field.dataType) {
    case 'firstName':
      return data.firstName;
    case 'lastName':
      return data.lastName;
    case 'fullName':
      return `${data.firstName} ${data.lastName}`;
    case 'email':
      return data.email;
    case 'phone':
      return data.phone || null;
    case 'street':
      return data.street;
    case 'city':
      return data.city;
    case 'state':
      return data.state;
    case 'zip':
      return data.zip;
    case 'topic':
      return data.topic;
    case 'subject':
      return data.subject;
    case 'message':
      return data.message;
    case 'prefix':
      return data.prefix || null;
  }

  // If dataType is 'other' or not set, try to infer from label
  const label = field.label.toLowerCase();
  const name = (field.name || '').toLowerCase();

  if (label.includes('first') && label.includes('name') || name.includes('first')) {
    return data.firstName;
  }
  if (label.includes('last') && label.includes('name') || name.includes('last')) {
    return data.lastName;
  }
  if ((label.includes('name') && !label.includes('first') && !label.includes('last')) || name === 'name') {
    return `${data.firstName} ${data.lastName}`;
  }
  if (label.includes('email') || name.includes('email')) {
    return data.email;
  }
  if (label.includes('phone') || label.includes('tel') || name.includes('phone')) {
    return data.phone || null;
  }
  if (label.includes('street') || label.includes('address') && !label.includes('city') || name.includes('street') || name.includes('address')) {
    return data.street;
  }
  if (label.includes('city') || name.includes('city')) {
    return data.city;
  }
  if (label.includes('state') || name.includes('state')) {
    return data.state;
  }
  if (label.includes('zip') || label.includes('postal') || name.includes('zip')) {
    return data.zip;
  }
  if (label.includes('topic') || label.includes('issue') || label.includes('subject') || name.includes('topic') || name.includes('issue')) {
    return data.topic;
  }
  if (label.includes('subject') || name.includes('subject')) {
    return data.subject;
  }
  if (label.includes('message') || label.includes('comment') || name.includes('message') || name.includes('comment')) {
    return data.message;
  }
  if (label.includes('prefix') || label.includes('title') || name.includes('prefix')) {
    return data.prefix || null;
  }

  return null;
}

/**
 * Fill a single form field
 */
async function fillField(page: Page, field: FormField, value: string): Promise<void> {
  const { selector, type, options } = field;

  // Wait for the element to be visible
  await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });

  // Wait for the element to be enabled (some forms enable fields via JS)
  const element = page.locator(selector);
  let attempts = 0;
  while (attempts < 10) {
    const isDisabled = await element.isDisabled().catch(() => false);
    if (!isDisabled) break;
    await page.waitForTimeout(300);
    attempts++;
  }

  switch (type) {
    case 'text':
    case 'email':
    case 'tel':
      await page.fill(selector, value);
      break;

    case 'textarea':
      await page.fill(selector, value);
      break;

    case 'select':
      if (options && options.length > 0) {
        // Find the best matching option
        const bestMatch = findBestOptionMatch(value, options);
        if (bestMatch) {
          await page.selectOption(selector, { label: bestMatch });
        } else {
          // Try selecting by value directly
          try {
            await page.selectOption(selector, value);
          } catch {
            // Try the first non-empty option as a fallback
            const firstOption = options.find(o => o && o.trim() !== '');
            if (firstOption) {
              await page.selectOption(selector, { label: firstOption });
            }
          }
        }
      } else {
        // No options known, try to select by value
        await page.selectOption(selector, value);
      }
      break;

    case 'radio':
      // For radio buttons, we need to click the right option
      if (options && options.length > 0) {
        const bestMatch = findBestOptionMatch(value, options);
        if (bestMatch) {
          // Try to find and click the radio button with this value
          const radioSelector = `${selector}[value="${bestMatch}"], input[type="radio"][value="${bestMatch}"]`;
          try {
            await page.click(radioSelector);
          } catch {
            // If that fails, try clicking by label
            await page.click(`label:has-text("${bestMatch}")`);
          }
        }
      }
      break;

    case 'checkbox':
      // For checkboxes, check it if the value is truthy
      if (value && value.toLowerCase() !== 'false' && value !== '0') {
        await page.check(selector);
      }
      break;

    case 'hidden':
      // Can't fill hidden fields directly in most cases
      break;
  }
}

/**
 * Find the best matching option in a dropdown using fuzzy matching
 */
function findBestOptionMatch(value: string, options: string[]): string | null {
  const valueLower = value.toLowerCase().trim();

  // Exact match first
  const exactMatch = options.find(
    (opt) => opt.toLowerCase().trim() === valueLower
  );
  if (exactMatch) return exactMatch;

  // Contains match
  const containsMatch = options.find(
    (opt) => opt.toLowerCase().includes(valueLower) || valueLower.includes(opt.toLowerCase())
  );
  if (containsMatch) return containsMatch;

  // Word overlap match
  const valueWords = valueLower.split(/\s+/);
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const option of options) {
    const optionWords = option.toLowerCase().split(/\s+/);
    let score = 0;

    for (const vWord of valueWords) {
      for (const oWord of optionWords) {
        if (vWord === oWord) {
          score += 2;
        } else if (oWord.includes(vWord) || vWord.includes(oWord)) {
          score += 1;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = option;
    }
  }

  // Only return if we have at least some match
  if (bestScore > 0) {
    return bestMatch;
  }

  return null;
}

/**
 * Map state code to full state name for dropdowns that use full names
 */
export function getStateName(stateCode: string): string {
  const states: Record<string, string> = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'DC': 'District of Columbia', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii',
    'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine',
    'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
    'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska',
    'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico',
    'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
    'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island',
    'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas',
    'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
    'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  };
  return states[stateCode.toUpperCase()] || stateCode;
}

/**
 * Pre-process constituent data to handle common variations
 */
export function preprocessData(data: ConstituentData): ConstituentData {
  return {
    ...data,
    // Ensure state can be matched as either code or full name
    state: data.state.length === 2 ? getStateName(data.state) : data.state,
    // Clean up phone number
    phone: data.phone ? data.phone.replace(/[^\d+]/g, '') : undefined,
    // Ensure ZIP is just the 5-digit version for most forms
    zip: data.zip.substring(0, 5),
  };
}
