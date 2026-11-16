# My Democracy: Security and Privacy Overview

**Prepared for:** vendor security review
**Operated by:** My Democracy LLC
**Last updated:** 2026-11-16
**Contact:** jared@mydemocracy.app

This document stands in place of a SOC 2 or ISO 27001 report. It covers the
same ground a SIG Lite questionnaire does. If your team would rather send its
own questionnaire, we will complete it.

---

## 1. Summary

My Democracy is a web platform that lets an organization run a letter writing
campaign and lets constituents send messages to their elected officials. It
delivers messages to congressional offices through the official U.S. House and
U.S. Senate Communicating With Congress (CWC) systems.

| | |
|---|---|
| Legal entity | My Democracy LLC (single member, Nevada) |
| Product | Web application, no installed software, no mobile app |
| Certifications held | None (see section 2) |
| Production data location | United States only |
| Database | Supabase on AWS `us-east-2`, Columbus, Ohio |
| Application compute | Vercel `iad1`, Northern Virginia |
| Encryption | AES-256 at rest, TLS 1.2+ in transit |
| Third-party penetration test | Not performed to date |
| Cyber liability insurance | Not currently carried |

---

## 2. Certifications and inherited controls

My Democracy LLC does not hold SOC 2 Type II or ISO/IEC 27001 certification.
We are a small company and have not completed a formal audit.

The infrastructure the platform runs on is independently certified, and a
meaningful share of the control surface is inherited from those providers:

| Provider | Role | Attestations |
|---|---|---|
| Amazon Web Services | Underlying cloud for both providers below | SOC 1/2/3, ISO 27001, ISO 27017/27018, FedRAMP, PCI DSS |
| Supabase | Database, authentication, storage | SOC 2 Type II, HIPAA eligible |
| Vercel | Application hosting and edge network | SOC 2 Type II, ISO 27001 |

**Inherited from providers:** physical and environmental security, hypervisor
and host hardening, network isolation, encryption at rest, patching of the
database engine and runtime, DDoS protection, backup infrastructure.

**Our responsibility:** application authorization logic, row level security
policies, secret management, access control for the production project,
subprocessor selection, data retention, and incident response.

---

## 3. Architecture and data flow

The platform is a Next.js application deployed on Vercel. There is no
customer-managed infrastructure and nothing is installed on your network.

A participant in a campaign:

1. Opens a campaign page and enters their address.
2. The address is geocoded to find their congressional district and state
   legislative districts.
3. They write a message, optionally with AI assistance.
4. An automated compliance check reviews the message before it leaves.
5. The message is queued and delivered to the chosen office through CWC, or,
   for the small number of Senate offices that do not accept CWC, through that
   office's own contact form.
6. A delivery record is retained as the receipt for that communication.

Delivery runs on a scheduled job every five minutes rather than inline with the
request, so a participant's submission is never blocked by an office outage.

---

## 4. Application security

**Authorization model.** Every database table holding participant or account
data has row level security enabled (29 tables as of this writing). Application
reads and writes run through a privileged server side client that is never
exposed to the browser. The browser only ever holds a public anonymous key,
which is locked out of participant data by policy.

**Security review practice.** We have not commissioned a third-party
penetration test. We run internal security audits. The most recent, completed
2026-10-23, reviewed every database table for read exposure under the public
anonymous API key. That audit confirmed that participant and account data is
not reachable with the anonymous key, and that row level security is enforced
on every table holding it. Audit findings are remediated and recorded in
version control as reviewed database migrations.

**Automated testing.** The codebase carries 122 automated test suites. Four
test API endpoints specifically for authorization bypass, covering the AI
drafting, bill summary, local official lookup, and voter information routes.
Tests run on every change through GitHub Actions before deployment.

**Abuse controls.** Bot protection (Cloudflare Turnstile) gates the AI
features. Rate limits cap how many messages one person can send to one office,
so that no single actor can flood an office through the platform. For visitors
without an account, these limits key on a one-way hash of the IP or email
address. The raw value is never stored for this purpose and the hash cannot be
reversed. These logs purge automatically after 30 days.

**Change management.** All changes go through version control and an automated
review on pull request. Database schema changes are applied as reviewed,
versioned migration files.

---

## 5. Data residency

All production data and all backups are stored in the United States. No
production data is stored, processed, or replicated outside the United States.

| Asset | Provider | Region |
|---|---|---|
| Database, auth, file storage | Supabase (AWS) | `us-east-2`, Columbus, Ohio |
| Automated backups | Supabase managed | Same region as primary |
| Application compute | Vercel | `iad1`, Northern Virginia |
| Static assets and edge cache | Vercel CDN | Global edge, no personal data cached |

Backups are taken automatically by Supabase as daily physical backups on a
rolling seven day retention window, held in the same region as the primary.
Point-in-time recovery is not currently enabled.

---

## 6. Subprocessors

The list below is complete and current as of 2026-11-16, verified against the
application source. It is split by whether a service can receive personal data.

### 6a. Can receive personal data

| Subprocessor | What it receives | Purpose |
|---|---|---|
| Supabase | All account, campaign, message, and delivery data | Database, authentication, storage |
| Vercel | HTTP request data including IP address | Application hosting. Analytics are cookie free and carry no personal identifiers |
| Anthropic | Message text, participant first name, issue, and the official's public details | AI drafting assistance. Contractually prohibited from training on this data, deleted within 30 days |
| Resend | Recipient email address and message content | Transactional email: account notices, opted-in campaign updates, story permission requests |
| Cloudflare | IP address and browser signals | Turnstile bot protection on AI features |
| Google Maps Places | Address text as typed | Address autocomplete |
| Google Civic Information | Full address | Elected official and voter information lookup |
| U.S. Census Bureau | Full address | Geocoding address to congressional and state legislative district |
| GitHub Actions | Queued message and contact details for a single submission | Runs the worker that files messages on the Senate contact forms that do not accept CWC |

### 6b. Public reference data only, receive no personal data

Congress.gov API, Open States, LegiScan, FEC API, Senate LDA Reports, Google
News RSS, U.S. Census American Community Survey. These are queried for bill
text, voting records, committee rosters, and district statistics. No
participant information is sent to any of them.

### 6c. Destination, not a subprocessor

The U.S. House and U.S. Senate **Communicating With Congress** systems are
where a message is delivered, at the participant's direction. Their name,
address, email, and message go to the office they selected. Each office then
handles that message under its own rules. This is the purpose of the platform
rather than an ancillary data sharing arrangement.

### 6d. Not used

The platform uses no third-party analytics, session recording, error
monitoring, advertising, or data broker services beyond those listed above.
There is no Google Analytics, no Segment, no Sentry, no PostHog, no advertising
pixel of any kind.

---

## 7. Data retention and deletion

| Data | Retention |
|---|---|
| Account data | Until the account is deleted by the user |
| Message and delivery records | Retained as the receipt for a communication to a government office (see note) |
| Abuse and rate limit logs (hashed) | 30 days, purged automatically |
| AI generation event logs | 30 days, purged automatically |
| Backups | Supabase managed rolling window |

A user can delete their account and associated data at any time from profile
settings, or by emailing us.

**Note on message records.** The platform retains a record of messages sent to
a congressional office, independent of the sponsoring organization's access to
them, because that record is the delivery receipt for a communication with a
government office. This is stated in the Data Processing Addendum rather than
left implicit, because it is the point most likely to matter to a partner's
data policy.

---

## 8. Access control

Production access is limited to the owner of My Democracy LLC. There are no
other administrators and no contractor or offshore access to production data.

Multi-factor authentication is required on every account that reaches
production. The Supabase account holding the production database and
authentication service is protected by a time-based one-time password
authenticator, with single-use recovery codes issued and held separately. The
GitHub account holding the source repository and the deployment pipeline, and
the Vercel account holding the production hosting environment, each require a
second factor.

Secrets are held in the hosting provider's encrypted environment variable store
and in a local environment file that is excluded from version control. No
credential is committed to the repository.

---

## 9. Incident response

In the event of a breach affecting a partner's data, My Democracy LLC will:

1. Contain the incident and preserve evidence.
2. Notify the affected partner without undue delay and within 72 hours of
   becoming aware.
3. Provide what is known: nature of the incident, categories and approximate
   number of records involved, likely consequences, and remediation taken.
4. Cooperate with the partner's own notification obligations.
5. Deliver a written post-incident summary once the investigation closes.

This commitment is contractual under section 7 of the Data Processing Addendum.

---

## 10. Known gaps

Stated plainly so your team does not have to find them:

| Gap | Status |
|---|---|
| SOC 2 Type II / ISO 27001 | Not held. No audit currently in progress |
| Third-party penetration test | Not performed. Will scope one if required for approval |
| Cyber liability insurance | Not currently carried. Will place coverage before signature if required |
| Formal written security policy set | Practices are in place and documented here, not yet in a formal policy manual |
| Point-in-time recovery | Not enabled. Daily backups with seven day retention are in place |
| Backup restore testing | No restore has been exercised from a production backup to date |
