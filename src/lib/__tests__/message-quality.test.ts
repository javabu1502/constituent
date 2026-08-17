import { describe, expect, it } from 'vitest';
import { auditMessageQuality, hasBlockingIssue } from '../message-quality';

const GOOD =
  'Dear Senator Smith,\n\nAs your constituent in Reno, I want you to know how the cost of child care has hit my family. We pay more for day care than for our mortgage, and my wife turned down a promotion because the new hours had no care options. This is not a budgeting problem we can solve alone.\n\nI respectfully ask you to support expanding the child care subsidy program this session.\n\nSincerely,\nPat Doe';

describe('auditMessageQuality', () => {
  it('passes a good constituent message clean', () => {
    expect(auditMessageQuality(GOOD, { source: 'user' })).toEqual([]);
  });

  it('blocks directed threats but not policy mentions of violence', () => {
    expect(hasBlockingIssue(auditMessageQuality(GOOD + ' If you ignore this you will regret it.'))).toBe(true);
    expect(hasBlockingIssue(auditMessageQuality('Gun violence kills thousands of Americans every year. ' + GOOD))).toBe(false);
  });

  it('blocks AI leakage and placeholders', () => {
    expect(hasBlockingIssue(auditMessageQuality('As an AI language model I cannot write this.'))).toBe(true);
    expect(hasBlockingIssue(auditMessageQuality(GOOD.replace('Reno', '[CITY]')))).toBe(true);
  });

  it('warns on profanity, vote threats, caps, and exclamation stacking without blocking', () => {
    const noisy = GOOD + ' This is BULLSHIT AND YOU KNOW IT!!!! Fix it or you will lose my vote!';
    const issues = auditMessageQuality(noisy);
    expect(hasBlockingIssue(issues)).toBe(false);
    const codes = issues.map((i) => i.code);
    expect(codes).toContain('profanity');
    expect(codes).toContain('vote_threat');
    expect(codes).toContain('exclamations');
  });

  it('warns on unsourced research claims only for AI drafts', () => {
    const claim = GOOD + ' Decades of research shows this works.';
    expect(auditMessageQuality(claim, { source: 'ai' }).map((i) => i.code)).toContain('unsourced_claim');
    expect(auditMessageQuality(claim, { source: 'user' }).map((i) => i.code)).not.toContain('unsourced_claim');
  });

  it('warns when there is no ask', () => {
    const noAsk = 'Dear Senator Smith,\n\nChild care in this state is broken and my family is living proof of it, week in and week out, and everyone pretends it is fine but it is not fine at all, things keep getting worse for working families like mine across every county and nobody with power seems moved by any of it.\n\nSincerely,\nPat Doe';
    expect(auditMessageQuality(noAsk).map((i) => i.code)).toContain('no_ask');
  });
});

describe('detectUnsupportedIdentityClaims (the fabricated-veteran bug)', () => {
  it('flags "I served this country" when the user only asked for VA hospitals', async () => {
    const { detectUnsupportedIdentityClaims } = await import('../message-quality');
    const draft = "I'm a veteran, and access to VA healthcare is something I feel strongly about. I served this country, and so did thousands of others. When we come home, we deserve care.";
    const claims = detectUnsupportedIdentityClaims(draft, "we need more VA hospitals it's the right thing to do");
    expect(claims).toContain('veteran / military service');
  });

  it('writing ABOUT veterans does not license writing AS one', async () => {
    const { detectUnsupportedIdentityClaims } = await import('../message-quality');
    const claims = detectUnsupportedIdentityClaims('I served this country and earned these benefits.', 'veterans deserve better healthcare access');
    expect(claims).toContain('veteran / military service');
  });

  it('first-person support in the user own words licenses the claim', async () => {
    const { detectUnsupportedIdentityClaims } = await import('../message-quality');
    expect(detectUnsupportedIdentityClaims("I'm a veteran and the drive to the VA is brutal.", 'I served in the Army and now drive 3 hours to the VA')).toEqual([]);
    expect(detectUnsupportedIdentityClaims('As a mom, my kids need this program.', "my daughter's daycare closed last month")).toEqual([]);
  });

  it('flags borrowed parenthood and profession claims', async () => {
    const { detectUnsupportedIdentityClaims } = await import('../message-quality');
    expect(detectUnsupportedIdentityClaims('As a mother, my kids deserve safe schools.', 'schools need more funding')).toContain('parent');
    // Caring about teacher pay does not make the writer a teacher.
    expect(detectUnsupportedIdentityClaims('I teach in this district and my students are struggling.', 'teacher pay is too low here')).toContain('teacher');
    expect(detectUnsupportedIdentityClaims('I teach in this district and my students are struggling.', 'I teach middle school and my pay has been flat for years')).not.toContain('teacher');
    expect(detectUnsupportedIdentityClaims('My patients cannot afford insulin.', 'insulin prices are out of control')).toContain('healthcare worker');
  });

  it('clean issue-based drafts pass', async () => {
    const { detectUnsupportedIdentityClaims } = await import('../message-quality');
    expect(detectUnsupportedIdentityClaims('Veterans in my community drive hours for care they earned. That is not a system working as it should.', 'we need more VA hospitals')).toEqual([]);
  });
});
