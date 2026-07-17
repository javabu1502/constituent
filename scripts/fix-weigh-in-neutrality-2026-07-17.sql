-- Weigh In neutrality/accuracy audit fixes (2026-07-17), user-approved:
-- 1. SAVE (sv9k4x): CRS summary shows the bill ALSO requires photo ID to
--    vote (not just proof of citizenship to register) — headline+desc now
--    cover both. Also fixes a FALSE status claim: Congress.gov latest
--    action is "Referred to the House Committee on House Administration"
--    (Jan 30, 2026) — the bill has NOT passed the House.
-- 2. Medicaid (5r9t2v): rules are enacted but NOT in effect (start
--    Jan 1, 2027 per KFF tracker, verified 2026-07-17) — was present
--    tense "add"; question is now whether they take effect.
-- 3. KIDS (k7d3n2): "required to protect kids" = supporters' framing.
-- 4. CLARITY (clr8ty): "clear federal rules" presupposes the pro case.
-- 5. Fed (protect-fed-independence): "stay independent of politics"
--    frames one side's characterization as the baseline.
-- Guarded on current headlines so a re-run is a no-op.
-- Run: npx supabase db query --linked --file scripts/fix-weigh-in-neutrality-2026-07-17.sql

begin;

update campaigns set
  headline = 'Should voters have to prove citizenship to register and show ID to vote?',
  description = 'The SAVE America Act (H.R. 7296) would require documentary proof of U.S. citizenship to register for federal elections, require photo identification to vote in them, and direct states to remove noncitizens from voter rolls. Supporters say it protects election integrity; critics say it could burden millions of eligible citizens. It is pending in committee in the House. Where do you stand?'
where slug = 'proof-of-citizenship-to-register-save-sv9k4x'
  and headline = 'Should voters have to show proof of citizenship to register?';

update campaigns set
  headline = 'Should Medicaid''s New Work Requirements Take Effect?',
  description = 'The 2025 reconciliation law added work reporting, twice-yearly eligibility checks, and narrower eligibility to Medicaid, taking effect January 1, 2027, with some states starting early. Supporters call it program integrity; opponents say paperwork will drop eligible people from coverage. Congress could let the rules stand or roll them back. Where do you stand?'
where slug = 'stop-the-medicaid-coverage-cliff-5r9t2v'
  and headline = 'Should Medicaid Add Work Requirements and More Checks?';

update campaigns set
  headline = 'Should platforms face federal safety rules for minors online?'
where slug = 'should-platforms-protect-kids-online-k7d3n2'
  and headline = 'Should online platforms be legally required to protect kids?';

update campaigns set
  headline = 'Should Congress pass the CLARITY Act''s crypto framework?'
where slug = 'should-congress-set-crypto-rules-clr8ty'
  and headline = 'Should Congress set clear federal rules for crypto?';

update campaigns set
  headline = 'How Much Say Should Elected Officials Have Over the Fed?'
where slug = 'protect-fed-independence'
  and headline = 'Should the Federal Reserve Stay Independent of Politics?';

commit;
