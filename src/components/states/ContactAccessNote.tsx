import Link from 'next/link';
import { stateContactAccess } from '@/lib/contact-access';

/**
 * What it actually takes to reach this state's legislature.
 *
 * Every state page listed legislators and said nothing about whether a person
 * can write to them, which is the next thing anybody wants to know. We have
 * measured it for all 7,344 of them, so this is the one line on the page that
 * no other site can write.
 *
 * Deliberately two sentences and muted. The point is to answer the question
 * and get out of the way, not to add another card to a page that already has
 * nine sections.
 */
export function ContactAccessNote({ stateCode, stateName }: { stateCode: string; stateName: string }) {
  const access = stateContactAccess(stateCode);
  if (!access || access.legislators === 0) return null;

  return (
    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
      {access.noneAtAll ? (
        <>
          None of {stateName}&apos;s {access.legislators} state legislators publish a contact form you can
          fill in. Nearly all publish an email address instead.
        </>
      ) : (
        <>
          {access.withForm} of {stateName}&apos;s {access.legislators} state legislators publish a contact
          form you can fill in. The rest publish an email address instead.
        </>
      )}{' '}
      <Link
        href="/research/how-hard-is-it-to-contact-your-legislature"
        className="text-purple-600 dark:text-purple-400 hover:underline"
      >
        See how we measured this
      </Link>
      .
    </p>
  );
}
