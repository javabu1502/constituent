-- Refresh the stale tariffs weigh-in (audit item F2). Its old premise
-- ("presidents set tariffs through executive authority") was overtaken by
-- Learning Resources v. Trump (SCOTUS, 6-3, 2026-02-20): IEEPA does not
-- authorize the President to impose tariffs; those tariffs ended 2026-02-24.
-- The live question is now genuinely before Congress (Section 122 caps
-- universal tariffs at 150 days absent a congressional vote). Updates copy +
-- both sources to live, correctly-leaned ones. Facts verified 2026-07-20.
-- Run: npx supabase db query --linked --file scripts/refresh-tariffs-campaign-2026-07-20.sql

begin;

update campaigns set
  description = 'In Learning Resources v. Trump (2026), the Supreme Court ruled the President can''t use emergency powers to impose tariffs, ending those tariffs and reaffirming that tariff power belongs to Congress. The President still sets some tariffs under other trade laws, like Section 122, which caps them at 150 days unless Congress votes to extend. The question is back before Congress: reclaim control of tariffs, or leave the President room to act. Where do you stand?',
  case_for = 'Supporters of congressional control say the Constitution assigns trade and taxing power to Congress, tariffs are taxes that raise prices on families, and decisions this big deserve open debate and a recorded vote rather than one person acting alone.',
  case_against = 'Supporters of executive flexibility say a President needs to move fast and speak with one voice to negotiate with other countries, and that requiring a congressional vote on every tariff would tie the country''s hands at the bargaining table.',
  source_for_label = 'Cato Institute (favors congressional control)',
  source_for_url = 'https://www.cato.org/briefing-paper/presidential-tariff-powers-need-reform',
  source_against_label = 'Supreme Court dissent (argued the President holds this authority)',
  source_against_url = 'https://www.supremecourt.gov/opinions/25pdf/24-1287_4gcj.pdf'
where slug = 'demand-a-vote-on-tariffs-7p3q8w';

commit;
