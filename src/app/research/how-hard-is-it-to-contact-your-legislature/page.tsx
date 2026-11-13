import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd, DatasetJsonLd, FaqJsonLd } from '@/lib/seo';
import { nationalContactAccess } from '@/lib/contact-access';
import { US_STATES } from '@/lib/constants';

const n = nationalContactAccess();
const NAME_OF = new Map<string, string>(US_STATES.map((s) => [s.code as string, s.name as string]));

export const metadata: Metadata = {
  title: 'How Hard Is It to Contact Your State Legislature? We Measured All 7,344 | My Democracy',
  description: `We checked the published contact page of every state legislator in the country. ${n.withForm} of ${n.legislators} have a contact form a constituent can use, which is ${n.withFormPercent} percent. In ${n.statesWithNone.length} states and territories, not one does.`,
  keywords: [
    'contact state legislator', 'state legislator email', 'can I email my state representative',
    'state legislature contact form', 'how to contact state senator', 'legislator contact form study',
  ],
  openGraph: {
    title: 'We checked the contact page of all 7,344 state legislators',
    description: `${n.withForm} have a usable contact form. That is ${n.withFormPercent} percent. In ${n.statesWithNone.length} jurisdictions, not one does.`,
    type: 'article',
  },
};

const PATH = '/research/how-hard-is-it-to-contact-your-legislature';

function Stat({ figure, label }: { figure: string; label: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{figure}</div>
      <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{label}</div>
    </div>
  );
}

export default function ContactAccessResearchPage() {
  const noneList = n.statesWithNone.map((c) => NAME_OF.get(c) ?? c);

  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Research', href: '/research' }, { name: 'Contacting your legislature', href: PATH }]} />
      <DatasetJsonLd
        name="State legislator contact-form availability, United States"
        description={`Contact-page check for all ${n.legislators} state legislators across ${n.jurisdictions} jurisdictions.`}
        dateModified={n.measuredOn}
        measurementCount={n.legislators}
        url={`https://www.mydemocracy.app${PATH}`}
      />
      <FaqJsonLd
        items={[
          {
            question: 'Can I email my state legislator?',
            answer: `Usually not through a form on their own page. Of ${n.legislators} state legislators, ${n.withForm} publish a contact form a constituent can fill in, which is ${n.withFormPercent} percent. In ${n.statesWithNone.length} jurisdictions none do. Most publish an email address instead.`,
          },
          {
            question: 'Which states have no legislator contact forms at all?',
            answer: `${n.statesWithNone.map((c) => NAME_OF.get(c) ?? c).join(', ')}. Measured ${n.measuredOn}.`,
          },
          {
            question: 'Can I email my US Senator?',
            answer: `${n.senate.onCwc} of the 100 Senate offices accept constituent mail through the official Communicating with Congress system. Of the ${n.senate.offCwc} that do not, ${n.senate.realForms} publish a page that is actually a message form.`,
          },
        ]}
      />

      <article className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/guides" className="text-sm text-purple-600 dark:text-purple-400 hover:underline">All guides</Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          How hard is it to contact your state legislature?
        </h1>
        <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">
          We checked the published contact page of every state legislator in the country. Most of them
          do not have a form you can write in.
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Measured {n.measuredOn}.</p>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat figure={n.legislators.toLocaleString()} label="legislators checked" />
          <Stat figure={n.withForm.toLocaleString()} label="with a usable form" />
          <Stat figure={`${n.withFormPercent}%`} label="of the total" />
          <Stat figure={String(n.statesWithNone.length)} label="jurisdictions with none" />
        </div>

        <h2 className="mt-10 text-2xl font-bold text-gray-900 dark:text-white">What we found</h2>
        <p className="mt-3 text-gray-700 dark:text-gray-300">
          Of {n.legislators.toLocaleString()} state legislators across {n.jurisdictions} jurisdictions,{' '}
          {n.withForm.toLocaleString()} publish a contact form a constituent can fill in. That is{' '}
          {n.withFormPercent} percent. Of those forms, {n.captchaFree.toLocaleString()} can be used without
          solving a CAPTCHA, which matters for anyone using a screen reader or a slow connection.
        </p>
        <p className="mt-3 text-gray-700 dark:text-gray-300">
          Another {n.unreachable.toLocaleString()} contact pages did not load at all when we checked them,
          or blocked the check.
        </p>
        <p className="mt-3 text-gray-700 dark:text-gray-300">
          In {n.statesWithNone.length} jurisdictions, not one legislator publishes a usable contact form:{' '}
          {noneList.join(', ')}.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900 dark:text-white">The US Senate</h2>
        <p className="mt-3 text-gray-700 dark:text-gray-300">
          {n.senate.onCwc} of the 100 Senate offices accept constituent mail through Communicating with
          Congress, the official system. The other {n.senate.offCwc} are not on it. We checked each of
          their contact pages by hand in October 2026. {n.senate.realForms} of them hold a page that is
          actually a message form. The rest look like contact pages and are landing pages, search boxes,
          or forms that cannot be submitted.
        </p>
        <p className="mt-3 text-gray-700 dark:text-gray-300">
          Not being on the system is usually a vendor or a technology decision inside an office. We did
          not ask why, and this is not a measure of how much an office wants to hear from people.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900 dark:text-white">What this means if you want to write</h2>
        <p className="mt-3 text-gray-700 dark:text-gray-300">
          A missing form does not mean you cannot reach your legislator. Nearly all of them publish an
          email address, and in many states that is the only route in. The practical problem is that
          finding the right address, and knowing which of your several legislators to write to, is left
          to you.
        </p>
        <p className="mt-3 text-gray-700 dark:text-gray-300">
          You can <Link href="/representatives" className="text-purple-600 dark:text-purple-400 hover:underline">
          look up every official who represents your address</Link>, federal, state and local, and write to
          them from here.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900 dark:text-white">Method</h2>
        <p className="mt-3 text-gray-700 dark:text-gray-300">
          We took the contact page each legislator publishes, requested it, and looked at what came back.
          A page counts as having a usable form when it carries a form with a message field, rather than a
          search box or a newsletter signup. A page counts as unreachable when the request failed or the
          host blocked it. Senate pages for offices not on Communicating with Congress were additionally
          opened in a browser and checked by hand, because a page can carry a form that no person can
          actually submit.
        </p>
        <p className="mt-3 text-gray-700 dark:text-gray-300">
          This is a snapshot, and it goes out of date as offices change their sites. We re-run it and
          publish what changed. If you work in an office and this is wrong about your page, tell us and we
          will re-check it.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-gray-900 dark:text-white">Limits</h2>
        <ul className="mt-3 list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>A form that exists may still fail when submitted. We did not send messages through them.</li>
          <li>A page that blocked our request may work fine in a browser.</li>
          <li>We checked the contact page each chamber publishes. An office may offer another route we did not see.</li>
          <li>We do not report any of this by party. Access is a technical question and cutting it that way would make it a different one.</li>
        </ul>
      </article>
    </div>
  );
}
