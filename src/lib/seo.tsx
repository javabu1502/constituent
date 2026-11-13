export function FaqJsonLd({ items }: { items: { question: string; answer: string }[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function HowToJsonLd({
  name,
  description,
  steps,
}: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; href: string }[] }) {
  const baseUrl = 'https://www.mydemocracy.app';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${baseUrl}${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * Structured data for a page whose substance is a measurement.
 *
 * Google and the answer engines treat a dataset differently from an article:
 * it is something to cite rather than something to rank. A page carrying
 * numbers nobody else has is the one kind of page worth marking up this way.
 */
export function DatasetJsonLd({
  name,
  description,
  dateModified,
  measurementCount,
  url,
}: {
  name: string;
  description: string;
  /** YYYY-MM-DD. Access data goes stale, so saying when it was taken is part of the claim. */
  dateModified: string;
  measurementCount: number;
  url: string;
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Dataset',
          name,
          description,
          dateModified,
          url,
          creator: { '@type': 'Organization', name: 'My Democracy', url: 'https://www.mydemocracy.app' },
          license: 'https://creativecommons.org/licenses/by/4.0/',
          isAccessibleForFree: true,
          variableMeasured: `Contact-form availability for ${measurementCount} state legislators`,
        }),
      }}
    />
  );
}
