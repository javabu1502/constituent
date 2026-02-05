/**
 * Playwright browser management for form automation
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import type { BrowserOptions } from './types';
import * as fs from 'fs';
import * as path from 'path';

// Realistic user agents
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];

let browserInstance: Browser | null = null;

/**
 * Get or create a browser instance
 */
export async function getBrowser(options: BrowserOptions = {}): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  browserInstance = await chromium.launch({
    headless: options.headless ?? true,
    slowMo: options.slowMo ?? 0,
  });

  return browserInstance;
}

/**
 * Create a new browser context with realistic settings
 */
export async function createContext(browser: Browser): Promise<BrowserContext> {
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  const context = await browser.newContext({
    userAgent,
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
    // Emulate a real browser
    javaScriptEnabled: true,
    hasTouch: false,
    isMobile: false,
  });

  return context;
}

/**
 * Create a new page in the given context
 */
export async function createPage(context: BrowserContext, timeout?: number): Promise<Page> {
  const page = await context.newPage();

  if (timeout) {
    page.setDefaultTimeout(timeout);
  }

  // Add some basic evasion
  await page.addInitScript(() => {
    // Override the navigator.webdriver property
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });

  return page;
}

/**
 * Take a screenshot of the page
 * Returns base64 encoded PNG
 */
export async function takeScreenshot(
  page: Page,
  options?: { fullPage?: boolean; path?: string }
): Promise<string> {
  const screenshot = await page.screenshot({
    type: 'png',
    fullPage: options?.fullPage ?? false,
  });

  const base64 = screenshot.toString('base64');

  // Optionally save to file
  if (options?.path) {
    const dir = path.dirname(options.path);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(options.path, screenshot);
  }

  return base64;
}

/**
 * Navigate to a URL and wait for the page to load
 */
export async function navigateTo(page: Page, url: string): Promise<void> {
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  // Wait a bit for any dynamic content to load
  await page.waitForTimeout(1000);
}

/**
 * Close a browser context
 */
export async function closeContext(context: BrowserContext): Promise<void> {
  await context.close();
}

/**
 * Shutdown the browser completely
 */
export async function shutdownBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * Wait for a selector to appear on the page
 */
export async function waitForSelector(
  page: Page,
  selector: string,
  timeout?: number
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: timeout ?? 10000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if an element exists on the page
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  const element = await page.$(selector);
  return element !== null;
}

/**
 * Scroll the page to make sure all content is visible
 */
export async function scrollPage(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
}
