/**
 * Type definitions for form automation module
 */

/**
 * A single form field identified by Claude Vision
 */
export interface FormField {
  /** CSS selector to locate this field */
  selector: string;
  /** Type of form field */
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'hidden';
  /** Human-readable label for this field */
  label: string;
  /** Field name attribute if available */
  name?: string;
  /** Whether this field is required */
  required: boolean;
  /** For select/radio: available options */
  options?: string[];
  /** What kind of data this field expects */
  dataType?: 'firstName' | 'lastName' | 'fullName' | 'email' | 'phone' | 'street' | 'city' | 'state' | 'zip' | 'topic' | 'subject' | 'message' | 'prefix' | 'other';
  /** Placeholder text if any */
  placeholder?: string;
  /** Max length if specified */
  maxLength?: number;
}

/**
 * Analysis result from Claude Vision
 */
export interface FormAnalysis {
  /** All identified form fields */
  fields: FormField[];
  /** CSS selector for the submit button */
  submitButtonSelector: string;
  /** Whether a CAPTCHA was detected */
  hasCaptcha: boolean;
  /** Type of CAPTCHA if detected */
  captchaType?: 'recaptcha' | 'hcaptcha' | 'image' | 'other';
  /** Whether this is a multi-page form */
  isMultiPage: boolean;
  /** If multi-page, selector for the next button */
  nextButtonSelector?: string;
  /** Current page number (1-indexed) */
  currentPage?: number;
  /** Total pages if detectable */
  totalPages?: number;
  /** Any additional notes from Claude */
  notes?: string;
  /** Raw confidence score (0-1) */
  confidence: number;
}

/**
 * Constituent data to fill into forms
 */
export interface ConstituentData {
  /** Prefix (Mr., Mrs., Ms., Dr., etc.) */
  prefix?: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Email address */
  email: string;
  /** Phone number */
  phone?: string;
  /** Street address */
  street: string;
  /** City */
  city: string;
  /** State (2-letter code) */
  state: string;
  /** ZIP code */
  zip: string;
  /** The issue/topic being written about */
  topic: string;
  /** Email subject line */
  subject: string;
  /** The full message body */
  message: string;
}

/**
 * Result of a form submission attempt
 */
export interface SubmissionResult {
  /** Whether the submission was successful */
  success: boolean;
  /** Status of the submission */
  status: 'success' | 'captcha_required' | 'validation_error' | 'network_error' | 'unknown_error';
  /** Error type for programmatic handling */
  errorType?: 'captcha' | 'validation' | 'network' | 'timeout' | 'unknown';
  /** Human-readable message about what happened */
  message: string;
  /** Screenshot of the result page (base64 encoded) */
  screenshotBase64?: string;
  /** If there was a confirmation number */
  confirmationNumber?: string;
  /** If there were validation errors, which fields */
  validationErrors?: { field: string; error: string }[];
  /** Time taken in milliseconds */
  timeTakenMs: number;
  /** Number of pages filled (for multi-page forms) */
  pagesFilled: number;
  /** Representative ID (bioguide ID) if known */
  representativeId?: string;
  /** The form URL that was attempted */
  formUrl?: string;
}

/**
 * CAPTCHA audit result for a single representative
 */
export interface CaptchaAuditResult {
  /** Bioguide ID */
  bioguideId: string;
  /** Representative name */
  name: string;
  /** Contact form URL */
  formUrl: string;
  /** Whether CAPTCHA was detected */
  hasCaptcha: boolean;
  /** Type of CAPTCHA if detected */
  captchaType?: 'recaptcha' | 'hcaptcha' | 'image' | 'text' | 'other';
  /** Whether the form loaded successfully */
  loadedSuccessfully: boolean;
  /** Error message if failed to load */
  error?: string;
  /** Timestamp of the audit */
  auditedAt: string;
}

/**
 * Summary of CAPTCHA audit results
 */
export interface CaptchaAuditSummary {
  /** Total number of forms audited */
  total: number;
  /** Number with CAPTCHAs */
  withCaptcha: number;
  /** Number without CAPTCHAs */
  withoutCaptcha: number;
  /** Number that failed to load */
  failedToLoad: number;
  /** Timestamp of the audit */
  auditedAt: string;
  /** Individual results */
  results: CaptchaAuditResult[];
}

/**
 * Representative info for form lookup
 */
export interface RepresentativeInfo {
  /** Bioguide ID (e.g., 'S000033') */
  bioguideId: string;
  /** Full name */
  name: string;
  /** Contact form URL */
  contactFormUrl: string;
  /** Official website */
  website?: string;
}

/**
 * Browser configuration options
 */
export interface BrowserOptions {
  /** Run in headless mode */
  headless?: boolean;
  /** Slow down operations by this many ms (for debugging) */
  slowMo?: number;
  /** Timeout for operations in ms */
  timeout?: number;
  /** Take screenshots at each step */
  screenshotSteps?: boolean;
  /** Directory to save screenshots */
  screenshotDir?: string;
}

/**
 * Configuration for the analyzer
 */
export interface AnalyzerConfig {
  /** Anthropic API key */
  apiKey: string;
  /** Model to use */
  model?: string;
  /** Max tokens for response */
  maxTokens?: number;
}
