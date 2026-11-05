import { describe, it, expect, afterEach } from 'vitest';
import { senderAddress, isConstituentEmailEnabled } from '../resend';

const original = process.env.RESEND_FROM_EMAIL;
afterEach(() => {
  if (original === undefined) delete process.env.RESEND_FROM_EMAIL;
  else process.env.RESEND_FROM_EMAIL = original;
});

describe('senderAddress (a From header cannot carry a newline)', () => {
  it('strips the trailing newline `vercel env add` stores', () => {
    process.env.RESEND_FROM_EMAIL = 'notifications@mydemocracy.app\n';
    expect(senderAddress()).toBe('notifications@mydemocracy.app');
  });
  it('strips surrounding whitespace from a pasted value', () => {
    process.env.RESEND_FROM_EMAIL = '  notifications@mydemocracy.app  ';
    expect(senderAddress()).toBe('notifications@mydemocracy.app');
  });
  it('falls back when unset or blank', () => {
    delete process.env.RESEND_FROM_EMAIL;
    expect(senderAddress()).toBe('notifications@mydemocracy.app');
    process.env.RESEND_FROM_EMAIL = '   ';
    expect(senderAddress()).toBe('notifications@mydemocracy.app');
    expect(senderAddress('onboarding@resend.dev')).toBe('onboarding@resend.dev');
  });
  it('passes a good value through unchanged', () => {
    process.env.RESEND_FROM_EMAIL = 'login@mydemocracy.app';
    expect(senderAddress()).toBe('login@mydemocracy.app');
  });
});

describe('isConstituentEmailEnabled still gates on the sandbox sender', () => {
  it('stays off for resend.dev, even with stray whitespace', () => {
    expect(isConstituentEmailEnabled({ RESEND_API_KEY: 'k', RESEND_FROM_EMAIL: 'onboarding@resend.dev\n' })).toBe(false);
  });
  it('turns on for the verified domain', () => {
    expect(isConstituentEmailEnabled({ RESEND_API_KEY: 'k', RESEND_FROM_EMAIL: 'notifications@mydemocracy.app' })).toBe(true);
  });
  it('stays off with no key', () => {
    expect(isConstituentEmailEnabled({ RESEND_FROM_EMAIL: 'notifications@mydemocracy.app' })).toBe(false);
  });
});
