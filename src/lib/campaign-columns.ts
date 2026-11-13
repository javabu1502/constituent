/**
 * The columns the campaign page and the embed both need.
 *
 * They had the same long literal copied into each file, and the copies
 * drifted: recipient_email was added to the table and read by the
 * participation flow, but neither select asked for it, so it arrived
 * undefined and the Reno case address was silently dropped from the
 * recipient list. The page rendered fine and simply offered one fewer
 * message, which is why it took a screenshot to catch.
 *
 * One constant, so adding a column is one edit and the two surfaces cannot
 * disagree again. Written as a single literal rather than a joined array
 * because the Supabase client infers the row type from the literal.
 */
export const CAMPAIGN_PAGE_COLUMNS =
  'id, slug, headline, description, issue_area, issue_subtopic, target_level, direction, status, campaign_type, visibility, message_template, bill_level, bill_state, bill_ref, bill_title, bill_url, story_prompt, usage_statement, usage_tags, attribution_options, edit_revoke_policy, action_count, story_count, created_at, org_name, org_url, org_logo_url, brand_color, custom_domain, case_for, case_against, source_for_label, source_for_url, source_against_label, source_against_url, is_bill_specific, bill_congress, bill_type, bill_number, support_count, oppose_count, undecided_count, is_official, parent_campaign_id, stage_goal, target_filter, language, recipient_email, letter_body' as const;
