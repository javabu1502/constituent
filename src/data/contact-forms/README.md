# Vendored congressional contact-form definitions

Step-by-step definitions for filling the contact form of every US senator
whose office is not on Communicating With Congress, taken from
[unitedstates/contact-congress](https://github.com/unitedstates/contact-congress),
which is dedicated to the public domain under CC0 1.0.

Snapshotted on 2026-11-13, one file per bioguide id.

## Why vendored rather than fetched

These say what we type into a congressional office's form on a
constituent's behalf. Fetching them at send time would let an edit in
somebody else's repository change what we submit, in a constituent's name,
with no review. Updating is deliberate: re-run the snapshot, read the diff,
run the dry run.

## Staleness is the risk, not availability

A definition that has gone stale does not error. It fills the wrong field,
or silently matches nothing, and the page still returns 200. That is how the
first production webform send came to type into a site search box.

Several of these were last touched in 2023. So nothing here is trusted on
its own: every send is checked against the `success` matcher in the
definition, and anything else is a failure, never a delivery.

`npx tsx scripts/contact-form-dryrun.ts` walks every definition against the
live page and reports which still bind.
