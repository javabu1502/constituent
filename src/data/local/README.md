# Local officials data

Hand-verified rosters of elected county commissions, city councils, and school
boards, one file per state (`nv.json`). Google's Civic Information
representatives endpoint shut down in April 2025, so this file IS the source.

Resolution (`src/lib/local-officials.ts`): the Census geocoder returns the
address's county (5-digit FIPS), incorporated place (7-digit GEOID; absent for
unincorporated areas, where the county commission is the local government) and
unified school district (7-digit GEOID). Each body here carries the matching
`geoid`; every seat of a matching body is returned (at-large v1, no ward
precision yet).

Seat fields: `name`, `title`, `district` (label as the body uses it), `party`
(null when nonpartisan), `email` (individual; `emailIsShared: true` when it is
the body's inbox), `contactFormUrl`, `phone`, `website`, `photoUrl`, `termEnd`,
`sourceUrl`, `verifiedAt` (YYYY-MM-DD), `unverified` (true = name known, not
confirmed on an official page this cycle; still shown, never emailed).

Refresh after every general election (next: November 3, 2026; new terms start
January 2027) and on resignations/appointments. Never invent an email.
