// State legislator email delivery (paid advocacy-org path). STAGED — not wired
// into any live flow and not deployed. See GO-CHECKLIST.md.
//
//   const email = buildStateEmail(input);          // build + validate (pure)
//   const result = await sendStateEmail(input);     // send via Resend
//   const results = await sendStateBatch(inputs);   // paced batch
//
// Env: RESEND_API_KEY, RESEND_FROM_EMAIL (on an authenticated sending domain).

export * from './types';
export { buildStateEmail, StateEmailError, type BuiltStateEmail } from './email';
export {
  resolveTargetChannel, buildOverrideMap, withOverride,
  type StateChannel, type EmailOverrides,
} from './resolve';
export { sendStateEmail, sendStateBatch, type StateSendResult } from './send';
