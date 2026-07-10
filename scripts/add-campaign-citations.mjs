#!/usr/bin/env node
/**
 * MyDemocracy — Populate campaign citations (2026-07-09)
 *
 * Adds, for each campaign: the specific bill (title + number) and its
 * Congress.gov link, plus ONE credible source per side, labeled by lean.
 * All bill numbers/orgs were verified via web research (July 2026).
 *
 * PREREQUISITE: run supabase/migrations/20260709010000_campaign_citations.sql first.
 *
 * NOTE: .env.local in this repo does not carry SUPABASE_SECRET_KEY; the
 * canonical execution path is the generated SQL twin
 * (scripts/add-campaign-citations-2026-07-09.sql) via
 * `npx supabase db query --linked --file ...`. This script is kept as the
 * data source of truth: the SQL is generated from CITATIONS below.
 *
 * USAGE:
 *   node scripts/add-campaign-citations.mjs --dry-run
 *   node scripts/add-campaign-citations.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DRY_RUN = process.argv.includes("--dry-run");
const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && m[2]) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
  return env;
}
const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

const C = "https://www.congress.gov/bill/119th-congress";

export const CITATIONS = [
  {
    slug: "ban-congressional-stock-trading-8h4n6c",
    bill_title: "ETHICS Act, H.R. 4890",
    bill_url: `${C}/house-bill/4890`,
    source_for_label: "Campaign Legal Center (supports a ban)",
    source_for_url: "https://campaignlegal.org/update/solving-the-congressional-stock-trading-problem",
    source_against_label: "Competitive Enterprise Institute (limited-government view)",
    source_against_url: "https://cei.org",
  },
  {
    slug: "lower-drug-prices-medicare-3w7k1z",
    bill_title: "Lowering Drug Costs for American Families Act, H.R. 6166",
    bill_url: `${C}/house-bill/6166`,
    source_for_label: "AARP (supports negotiation)",
    source_for_url: "https://www.aarp.org/advocacy/how-aarp-fights-for-lower-drug-prices/",
    source_against_label: "PhRMA (pharmaceutical industry, opposes)",
    source_against_url: "https://phrma.org",
  },
  {
    slug: "demand-a-vote-on-tariffs-7p3q8w",
    bill_title: "Trade Review Act of 2025, S. 1272",
    bill_url: `${C}/senate-bill/1272`,
    source_for_label: "Cato Institute (favors congressional control)",
    source_for_url: "https://www.cato.org/briefing-paper/presidential-tariff-powers-need-reform",
    source_against_label: "The White House (favors executive flexibility)",
    source_against_url: "https://www.whitehouse.gov",
  },
  {
    slug: "authorize-military-force-demand-congress-vote-on-iran",
    bill_title: "No single bill — representative measure: S.J.Res. 172",
    bill_url: `${C}/senate-joint-resolution/172`,
    source_for_label: "Quincy Institute (favors congressional authorization)",
    source_for_url: "https://quincyinst.org",
    source_against_label: "Foundation for Defense of Democracies (favors executive latitude)",
    source_against_url: "https://www.fdd.org",
  },
  {
    slug: "protect-healthcare-restore-aca-subsidies",
    bill_title: "Bipartisan Premium Tax Credit Extension Act, H.R. 5145",
    bill_url: `${C}/house-bill/5145`,
    source_for_label: "Families USA (supports extending subsidies)",
    source_for_url: "https://familiesusa.org",
    source_against_label: "Heritage Foundation (opposes extension)",
    source_against_url: "https://www.heritage.org/health-care-reform/commentary/extending-enhanced-obamacare-subsidies-would-be-costly-ineffective",
  },
  {
    slug: "prevent-voter-suppression-vote-no-on-the-save-act-bqq31c",
    bill_title: "SAVE Act, H.R. 22",
    bill_url: `${C}/house-bill/22`,
    source_for_label: "Heritage Foundation (supports the requirement)",
    source_for_url: "https://www.heritage.org/press/heritage-applauds-house-passage-legislation-protect-elections",
    source_against_label: "League of Women Voters (opposes as a barrier)",
    source_against_url: "https://www.lwv.org/save-act",
  },
  {
    slug: "stop-the-medicaid-coverage-cliff-5r9t2v",
    bill_title: "One Big Beautiful Bill Act, H.R. 1 (P.L. 119-21)",
    bill_url: `${C}/house-bill/1`,
    source_for_label: "Foundation for Government Accountability (supports work requirements)",
    source_for_url: "https://thefga.org",
    source_against_label: "Center on Budget and Policy Priorities (warns of coverage loss)",
    source_against_url: "https://www.cbpp.org/research/health/medicaid-work-requirements-cant-be-fixed",
  },
  {
    slug: "real-guardrails-for-ai-9k2m4x",
    bill_title: "No single bill — ongoing debate over federal AI rules and state preemption",
    bill_url: `${C}/house-bill/1`,
    source_for_label: "R Street Institute (favors federal preemption)",
    source_for_url: "https://www.rstreet.org/outreach/coalition-letter-urging-federal-preemption-of-certain-ai-state-laws-and-regulations/",
    source_against_label: "Center for American Progress (opposes preempting state laws)",
    source_against_url: "https://www.americanprogress.org/article/moratoriums-and-federal-preemption-of-state-artificial-intelligence-laws-pose-serious-risks/",
  },
  {
    slug: "no-data-centers-w7bwco",
    bill_title: "No single bill — ongoing debate (see CRS overview)",
    bill_url: "https://www.congress.gov/crs-product/R48646",
    source_for_label: "GRID Act sponsors (large users pay grid costs)",
    source_for_url: "https://www.consumeraffairs.com/news/senate-bill-would-make-ai-data-centers-pay-for-power-grid-upgrades-051926.html",
    source_against_label: "U.S. Chamber of Commerce (warns of investment/cost burden)",
    source_against_url: "https://www.uschamber.com",
  },
  {
    slug: "tell-your-child-care-story-xqqt5m",
    bill_title: "Child Care for Working Families Act, S. 2295",
    bill_url: `${C}/senate-bill/2295`,
    source_for_label: "First Five Years Fund (supports federal investment)",
    source_for_url: "https://www.ffyf.org",
    source_against_label: "Cato Institute (opposes federal subsidy expansion)",
    source_against_url: "https://www.cato.org",
  },
  {
    slug: "end-the-shutdown-cycle-pass-a-real-budget",
    bill_title: "No single bill — appropriations process (see CRFB tracker)",
    bill_url: "https://www.crfb.org/blogs/appropriations-watch-fy-2026",
    source_for_label: "Committee for a Responsible Federal Budget (favors ending brinkmanship)",
    source_for_url: "https://www.crfb.org/blogs/congress-could-end-government-shutdown-drama-once-and-all",
    source_against_label: "Center on Budget and Policy Priorities (defends robust appropriations)",
    source_against_url: "https://www.cbpp.org",
  },
  {
    slug: "protect-fed-independence",
    bill_title: "Federal Reserve Transparency Act of 2025 (\"Audit the Fed\"), H.R. 24",
    bill_url: `${C}/house-bill/24`,
    source_for_label: "Brookings Institution (defends Fed independence)",
    source_for_url: "https://www.brookings.edu/articles/audit-the-fed-is-not-about-auditing-the-fed/",
    source_against_label: "Cato Institute (favors more accountability/audit)",
    source_against_url: "https://www.cato.org/blog/should-gao-audit-fed-cato-cmfa-forum",
  },
  {
    slug: "develop-mixed-use-and-walkable-communities-co5nb4",
    bill_title: "BUILD America 250 Act, H.R. 8870",
    bill_url: `${C}/house-bill/8870`,
    source_for_label: "Transportation for America (favors transit/safe streets)",
    source_for_url: "https://t4america.org/reauthorization/",
    source_against_label: "ARTBA (road-builders, highway-focused)",
    source_against_url: "https://www.artba.org/news/artbas-first-look-house-surface-transportation-reauthorization-proposal/",
  },
  {
    slug: "humane-immigration-reform",
    bill_title: "Dignity Act of 2025, H.R. 4393",
    bill_url: `${C}/house-bill/4393`,
    source_for_label: "American Immigration Council (favors comprehensive reform)",
    source_for_url: "https://www.americanimmigrationcouncil.org/blog/legislators-immigration-reform-reintroduced-dignidad-act/",
    source_against_label: "Federation for American Immigration Reform (enforcement-first)",
    source_against_url: "https://www.fairus.org/legislation/congress/flaws-in-dignity-act-push-for-amnesty",
  },
  {
    slug: "how-should-us-regulate-crypto-cr7m2x",
    bill_title: "CLARITY Act (Digital Asset Market Clarity Act), H.R. 3633",
    bill_url: `${C}/house-bill/3633`,
    source_for_label: "Coinbase (industry, favors a clear framework)",
    source_for_url: "https://www.coinbase.com",
    source_against_label: "Americans for Financial Reform (warns on consumer protection)",
    source_against_url: "https://ourfinancialsecurity.org/resources/fact-sheet-afr-fact-sheet-on-the-clarity-act-a-crypto-cash-grab-that-is-a-consumer-catastrophe/",
  },
  {
    slug: "national-data-privacy-law-pv4k9w",
    bill_title: "American Privacy Rights Act, H.R. 8818 (118th Cong. — not yet reintroduced)",
    bill_url: "https://www.congress.gov/bill/118th-congress/house-bill/8818",
    source_for_label: "EPIC (favors a strong federal privacy floor)",
    source_for_url: "https://epic.org/documents/epic-statement-for-the-record-on-american-privacy-rights-act/",
    source_against_label: "U.S. Chamber of Commerce (opposes private right of action)",
    source_against_url: "https://www.uschamber.com/technology/u-s-chamber-coalition-letter-opposing-h-r-8818-the-american-privacy-rights-act",
  },
  {
    slug: "big-tech-self-preferencing-tp8n3v",
    bill_title: "American Innovation and Choice Online Act (AICOA), S. 4746",
    bill_url: `${C}/senate-bill/4746`,
    source_for_label: "Consumer Reports (supports curbing self-preferencing)",
    source_for_url: "https://advocacy.consumerreports.org/press_release/consumer-reports-applauds-reintroduction-of-the-american-innovation-and-choice-online-act-in-the-us-senate/",
    source_against_label: "CCIA (tech industry, opposes)",
    source_against_url: "https://ccianet.org/library/coalition-letter-opposing-the-american-innovation-and-choice-online-act-aicoa/",
  },
  {
    slug: "tackle-the-housing-shortage-hs5r2k",
    bill_title: "ROAD to Housing Act of 2025, S. 2651",
    bill_url: `${C}/senate-bill/2651`,
    source_for_label: "National Association of Home Builders (favors more supply)",
    source_for_url: "https://www.nahb.org",
    source_against_label: "Cato Institute (opposes federal overreach vs. local zoning)",
    source_against_url: "https://www.cato.org/briefing-paper/road-more-federal-control-how-congress-misdiagnosing-americas-housing-problems",
  },
  {
    slug: "build-energy-projects-faster-ep6m4z",
    bill_title: "SPEED Act, H.R. 4776",
    bill_url: `${C}/house-bill/4776`,
    source_for_label: "ClearPath Action (favors cutting permitting red tape)",
    source_for_url: "https://clearpathaction.org/standardizing-permitting-and-expediting-economic-development-speed-act-h-r-4776/",
    source_against_label: "Sierra Club (warns it weakens environmental review)",
    source_against_url: "https://www.sierraclub.org/press-releases/2025/11/house-natural-resources-committee-considers-speed-act-groups-stand-strong",
  },
  {
    slug: "keep-social-security-solvent-ss3k7n",
    bill_title: "Social Security 2100 Act, H.R. 9519",
    bill_url: `${C}/house-bill/9519`,
    source_for_label: "Social Security Works (favors expanding benefits / lifting the cap)",
    source_for_url: "https://larson.house.gov/social-security-2100",
    source_against_label: "Committee for a Responsible Federal Budget (critiques as insufficient)",
    source_against_url: "https://www.crfb.org/social-security",
  },
];

async function main() {
  if (!SUPABASE_URL || !KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
    process.exit(1);
  }
  const REST = `${SUPABASE_URL}/rest/v1`;
  const headers = {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  console.log(`\nCampaign citations ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"}\n`);
  for (const c of CITATIONS) {
    const { slug, ...fields } = c;
    if (DRY_RUN) {
      console.log(`WOULD UPDATE  ${slug}  →  ${fields.bill_title}`);
      continue;
    }
    const res = await fetch(`${REST}/campaigns?slug=eq.${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(fields),
    });
    const body = await res.json();
    if (!res.ok) console.error(`FAIL ${slug}: ${res.status} ${JSON.stringify(body)}`);
    else if (!body.length) console.warn(`WARN  no row matched slug ${slug}`);
    else console.log(`UPDATED  ${slug}  →  ${fields.bill_title}`);
  }
  console.log(`\nDone.${DRY_RUN ? " (no changes written)" : ""}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
