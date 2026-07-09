-- MyDemocracy — Neutral "Where Do You Stand" reframe (2026-07-09)
-- Rewrites all 13 public advocacy campaigns to neutral question headlines,
-- neutral descriptions, and a fair case_for / case_against, and nulls the
-- old directional message_template (the participant's own stance now drives
-- message generation).
--
-- Storytelling campaigns are deliberately untouched: their copy is the
-- context storytellers consented to.
--
-- PREREQUISITE: migration 20260709000000_campaign_neutral_framing.sql.
-- Run via: npx supabase db query --linked --file scripts/reframe-campaigns-neutral-2026-07-09.sql

begin;

update campaigns set
  headline = 'Should Voters Have to Prove Citizenship to Register?',
  description = 'Several proposals would require documentary proof of citizenship to register to vote. Supporters say it protects election integrity; opponents say it blocks eligible voters over paperwork. Where do you stand?',
  case_for = 'Supporters say requiring proof of citizenship is a common-sense safeguard that strengthens confidence in elections, deters noncitizen registration, and brings registration in line with other activities that require ID.',
  case_against = 'Opponents point to federal data showing noncitizen registration is vanishingly rare, and warn the rules mostly block eligible voters — married women who changed names, rural voters, seniors — who lack easy access to documents.',
  message_template = null,
  updated_at = now()
where slug = 'prevent-voter-suppression-vote-no-on-the-save-act-bqq31c' and campaign_type = 'advocacy';

update campaigns set
  headline = 'Should the Federal Reserve Stay Independent of Politics?',
  description = 'Pressure is growing on the Federal Reserve to set interest rates with an eye on the political calendar. Some see independence as essential to stable prices; others say an unelected central bank should answer more directly to voters. Where do you stand?',
  case_for = 'Supporters of independence say rate decisions driven by data rather than elections are what keep inflation anchored, and that countries whose central banks answer to politicians have historically paid for it with runaway prices.',
  case_against = 'Critics argue the Fed makes decisions that shape every family''s cost of living with little democratic accountability, and that elected officials should have more say over — and visibility into — such consequential policy.',
  message_template = null,
  updated_at = now()
where slug = 'protect-fed-independence' and campaign_type = 'advocacy';

update campaigns set
  headline = 'What Should Immigration Reform Look Like?',
  description = 'Congress remains deadlocked between enforcement-first approaches and comprehensive reform that pairs border security with legal pathways. Both sides agree the current system is broken. Where do you stand?',
  case_for = 'Advocates of comprehensive reform say pairing border security with due process and workable legal pathways is the only durable fix — enforcement alone hasn''t worked in thirty years, and the economy depends on orderly legal immigration.',
  case_against = 'Advocates of enforcement-first argue the border must be demonstrably secure before any legalization, that past comprehensive deals traded amnesty for enforcement that never came, and that legal pathways should be narrowed until then.',
  message_template = null,
  updated_at = now()
where slug = 'humane-immigration-reform' and campaign_type = 'advocacy';

update campaigns set
  headline = 'Should Congress Be Required to Pass Full-Year Budgets?',
  description = 'Congress has governed through shutdown threats and short-term stopgaps for years. Some want rules that force full-year appropriations; others say those pressure points are one of the few tools a minority has. Where do you stand?',
  case_for = 'Supporters say ending the shutdown cycle would protect federal workers and services, save money wasted on crisis management, and force Congress to do its most basic job on a predictable schedule.',
  case_against = 'Skeptics note that funding deadlines are among the only leverage lawmakers have to force negotiation on hard issues, and that automatic funding mechanisms could entrench spending with even less debate.',
  message_template = null,
  updated_at = now()
where slug = 'end-the-shutdown-cycle-pass-a-real-budget' and campaign_type = 'advocacy';

update campaigns set
  headline = 'Should Congress Restore the Enhanced ACA Subsidies?',
  description = 'Enhanced Affordable Care Act subsidies expired at the start of 2026 and average marketplace premiums for subsidized enrollees have more than doubled — from about $888 to roughly $1,900 a year. A House-passed extension is stalled in the Senate. Where do you stand?',
  case_for = 'Supporters say restoring the credits keeps millions of working families insured, prevents a wave of coverage losses, and costs far less than the downstream price of uncompensated care.',
  case_against = 'Opponents argue the enhanced credits were designed as temporary pandemic relief, cost tens of billions a year, mask underlying premium growth rather than fixing it, and mostly flow through to insurers.',
  message_template = null,
  updated_at = now()
where slug = 'protect-healthcare-restore-aca-subsidies' and campaign_type = 'advocacy';

update campaigns set
  headline = 'Should Congress Have to Vote Before Military Action?',
  description = 'The Constitution gives Congress the power to declare war, but presidents of both parties have launched military operations without a vote. Some want the War Powers Act enforced strictly; others say the commander-in-chief needs flexibility. Where do you stand?',
  case_for = 'Supporters of a required vote say sending Americans into conflict is the gravest decision government makes, the Constitution assigns it to Congress, and open debate prevents open-ended wars nobody authorized.',
  case_against = 'Others argue modern threats move faster than Congress, that presidents need latitude to respond to attacks and protect forces, and that telegraphing deliberations can hand adversaries an advantage.',
  message_template = null,
  updated_at = now()
where slug = 'authorize-military-force-demand-congress-vote-on-iran' and campaign_type = 'advocacy';

update campaigns set
  headline = 'Should Federal Dollars Favor Transit and Walkability?',
  description = 'Federal transportation funding still flows overwhelmingly to car infrastructure. Some want safe streets, transit, and mixed-use development prioritized; others say roads serve how most Americans actually travel. Where do you stand?',
  case_for = 'Supporters say pedestrian deaths are climbing while demand for walkable neighborhoods outstrips supply, and that balanced funding gives communities real choices beyond car dependence.',
  case_against = 'Others note most Americans commute by car, especially outside big metros, and argue federal dollars should follow actual travel patterns — with transit and walkability decided and funded locally.',
  message_template = null,
  updated_at = now()
where slug = 'develop-mixed-use-and-walkable-communities-co5nb4' and campaign_type = 'advocacy';

update campaigns set
  headline = 'How Should America Regulate AI?',
  description = 'Congress is weighing federal AI rules — and whether to preempt the state laws already on the books. Some want strong national guardrails; others warn heavy rules could slow innovation or lock in weak protections. Where do you stand?',
  case_for = 'Supporters of strong federal guardrails want transparency, safety testing, and protection from deepfakes and algorithmic discrimination — accountability for a technology reshaping work and civic life.',
  case_against = 'Skeptics warn that sweeping rules could entrench the biggest incumbents, slow beneficial innovation, and that preempting state protections with a weak federal standard could leave people with fewer rights than they have today.',
  message_template = null,
  updated_at = now()
where slug = 'real-guardrails-for-ai-9k2m4x' and campaign_type = 'advocacy';

update campaigns set
  headline = 'Who Should Control Tariffs: Congress or the President?',
  description = 'A key tariff authority is up for renewal, reopening a constitutional question: how much trade power should presidents wield without a vote? Tariffs raise prices on everyday goods but are also a negotiating lever. Where do you stand?',
  case_for = 'Supporters of congressional votes say the Constitution assigns trade power to Congress, tariffs are taxes on families, and decisions that raise prices deserve open debate and accountability.',
  case_against = 'Others argue presidents need speed and flexibility to negotiate with foreign powers, and that requiring votes on every tariff would weaken America''s hand at the bargaining table.',
  message_template = null,
  updated_at = now()
where slug = 'demand-a-vote-on-tariffs-7p3q8w' and campaign_type = 'advocacy';

update campaigns set
  headline = 'Should Medicaid Add Work Requirements and More Checks?',
  description = 'New rules add work reporting, twice-yearly eligibility checks, and narrower eligibility to Medicaid. Supporters call it program integrity; opponents say paperwork will drop eligible people from coverage. Where do you stand?',
  case_for = 'Supporters argue that work requirements encourage employment, that regular checks keep the program for those who truly qualify, and that Medicaid''s growth requires guardrails to stay sustainable.',
  case_against = 'Opponents point to states where similar rules dropped thousands of eligible working people over paperwork, note most Medicaid adults already work, and say the savings come from churn, not fraud.',
  message_template = null,
  updated_at = now()
where slug = 'stop-the-medicaid-coverage-cliff-5r9t2v' and campaign_type = 'advocacy';

update campaigns set
  headline = 'Should Members of Congress Be Allowed to Trade Stocks?',
  description = 'Members of Congress vote on laws that move markets while trading individual stocks. Bipartisan majorities of voters back a ban, but Congress hasn''t passed one. Where do you stand?',
  case_for = 'Supporters of a ban say lawmakers shouldn''t profit from information their office gives them, that even lawful trades corrode public trust, and that index funds and blind trusts preserve every legitimate investment option.',
  case_against = 'Opponents argue disclosure rules already exist and should simply be enforced, that a ban could deter qualified people from serving, and that restricting family members'' finances raises fairness questions.',
  message_template = null,
  updated_at = now()
where slug = 'ban-congressional-stock-trading-8h4n6c' and campaign_type = 'advocacy';

update campaigns set
  headline = 'Should Medicare Negotiate More Drug Prices?',
  description = 'Medicare has begun negotiating prices on a small set of drugs. Congress could expand that authority to many more medications — or pull it back. Americans pay more for prescriptions than any other wealthy country. Where do you stand?',
  case_for = 'Supporters say expanded negotiation and out-of-pocket caps would bring US prices toward what other countries pay and end the choice between medication and groceries for seniors.',
  case_against = 'Opponents argue negotiation at Medicare''s scale is effectively price-setting, which could shrink the research pipeline for new cures — and note most breakthrough drugs are developed for the US market first.',
  message_template = null,
  updated_at = now()
where slug = 'lower-drug-prices-medicare-3w7k1z' and campaign_type = 'advocacy';

update campaigns set
  headline = 'Should the Federal Government Subsidize Child Care?',
  description = 'In much of the country child care costs more than rent or in-state tuition, and federal support has stalled while waitlists grow. Some want major federal investment; others say subsidies inflate costs or crowd out family choices. Where do you stand?',
  case_for = 'Supporters say assistance and cost caps keep parents — especially mothers — in the workforce, that quality early care pays off for decades, and that the market alone has plainly failed to deliver affordable care.',
  case_against = 'Skeptics argue subsidies chase rising prices without fixing supply, can favor center-based care over relatives and stay-at-home parents, and that states and employers are better placed to tailor solutions.',
  message_template = null,
  updated_at = now()
where slug = 'pass-the-child-care-for-working-families-act-oz6pan' and campaign_type = 'advocacy';

commit;
