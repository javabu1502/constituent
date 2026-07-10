-- Dormant structured bill identifiers (2026-07-09).
-- Derived from the verified citation dataset (scripts/add-campaign-citations.mjs).
-- Populated ONLY where a clear single bill exists; "no single bill" issues get
-- none. is_bill_specific stays false everywhere — no bill appears in the UI
-- until a campaign is explicitly flagged.
-- Run via: npx supabase db query --linked --file scripts/set-dormant-bill-ids-2026-07-09.sql

begin;

-- Ensure the default is applied everywhere explicitly.
update campaigns set is_bill_specific = false where is_bill_specific is distinct from false;

update campaigns set bill_congress = 119, bill_type = 'hr', bill_number = '4890' where slug = 'ban-congressional-stock-trading-8h4n6c';
update campaigns set bill_congress = 119, bill_type = 'hr', bill_number = '6166' where slug = 'lower-drug-prices-medicare-3w7k1z';
update campaigns set bill_congress = 119, bill_type = 's',  bill_number = '1272' where slug = 'demand-a-vote-on-tariffs-7p3q8w';
update campaigns set bill_congress = 119, bill_type = 'hr', bill_number = '5145' where slug = 'protect-healthcare-restore-aca-subsidies';
update campaigns set bill_congress = 119, bill_type = 'hr', bill_number = '22'   where slug = 'prevent-voter-suppression-vote-no-on-the-save-act-bqq31c';
update campaigns set bill_congress = 119, bill_type = 'hr', bill_number = '1'    where slug = 'stop-the-medicaid-coverage-cliff-5r9t2v';
update campaigns set bill_congress = 119, bill_type = 's',  bill_number = '2295' where slug = 'tell-your-child-care-story-xqqt5m';
update campaigns set bill_congress = 119, bill_type = 's',  bill_number = '2295' where slug = 'pass-the-child-care-for-working-families-act-oz6pan';
update campaigns set bill_congress = 119, bill_type = 'hr', bill_number = '24'   where slug = 'protect-fed-independence';
update campaigns set bill_congress = 119, bill_type = 'hr', bill_number = '8870' where slug = 'develop-mixed-use-and-walkable-communities-co5nb4';
update campaigns set bill_congress = 119, bill_type = 'hr', bill_number = '4393' where slug = 'humane-immigration-reform';
update campaigns set bill_congress = 119, bill_type = 'hr', bill_number = '3633' where slug = 'how-should-us-regulate-crypto-cr7m2x';
update campaigns set bill_congress = 118, bill_type = 'hr', bill_number = '8818' where slug = 'national-data-privacy-law-pv4k9w';
update campaigns set bill_congress = 119, bill_type = 's',  bill_number = '4746' where slug = 'big-tech-self-preferencing-tp8n3v';
update campaigns set bill_congress = 119, bill_type = 's',  bill_number = '2651' where slug = 'tackle-the-housing-shortage-hs5r2k';
update campaigns set bill_congress = 119, bill_type = 'hr', bill_number = '4776' where slug = 'build-energy-projects-faster-ep6m4z';
update campaigns set bill_congress = 119, bill_type = 'hr', bill_number = '9519' where slug = 'keep-social-security-solvent-ss3k7n';

commit;
