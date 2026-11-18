/**
 * Make a user-supplied string safe to interpolate into a PostgREST filter.
 *
 * `.or()` takes a filter expression, not a value. Its grammar separates
 * conditions with commas, groups them with parentheses, and splits each
 * condition on dots into column.operator.value. So a search box wired
 * straight into it hands the caller the predicate:
 *
 *   q = "zzzz,slug.like.*demo*"
 *   -> or(headline.ilike.%zzzz,slug.like.*demo*%, ...)
 *
 * which returned every demo campaign on production while matching nothing a
 * user typed. The select list and the status filter still applied, so this
 * never leaked a column the endpoint does not return, but it let anyone
 * evaluate arbitrary predicates against the campaigns table and read the
 * answer off the result count.
 *
 * Dots stay. PostgREST splits a condition on its first two dots only, so
 * everything after them is the value and "H.R. 1234" searches as typed.
 * Commas, parens and quotes are the ones that end a condition or start
 * another, and nobody searches a campaign list for those.
 */

/** Characters that end a condition, group one, or quote one. */
const FILTER_SYNTAX = /[,()"'\\]/g;
/** PostgREST maps `*` to `%` in like/ilike, so both are wildcards. */
const WILDCARDS = /[%*]/g;

export function sanitizeFilterValue(input: string): string {
  return input.replace(FILTER_SYNTAX, ' ').replace(WILDCARDS, ' ').replace(/\s+/g, ' ').trim();
}
