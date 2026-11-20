/**
 * Turn the document templates in docs/ into signable PDFs for one organization.
 *
 * The templates carry blanks rather than a customer's name, so every org that
 * asks for paperwork needs the same three substitutions made by hand. Doing it
 * by hand is how a draft goes out with the wrong fee or the previous org's
 * name still in it, which is worse than a typo when the thing gets signed.
 *
 * What it fills:
 *   - the Customer blank in the Agreement and the Addendum
 *   - the first-term fee in section 4 of the Agreement
 *
 * What it deliberately leaves blank: the Effective Date and both signature
 * blocks. Section 4 invoices the fee on the Effective Date, so that date is
 * the signing date and not ours to assume.
 *
 * Usage:
 *   npx tsx scripts/build-org-documents.ts \
 *     --slug weca \
 *     --customer "Wisconsin Early Childhood Association" \
 *     --fee 1200 \
 *     --docs agreement,dpa,overview
 *
 * --out defaults to ~/Desktop/mydemocracy-documents/<slug>.
 * --docs defaults to all three.
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const TODAY = new Date().toISOString().slice(0, 10);

type DocKey = 'agreement' | 'dpa' | 'overview';

const DOCS: Record<
  DocKey,
  { source: string; outName: string; title: string; isContract: boolean }
> = {
  agreement: {
    source: 'docs/SERVICE-AGREEMENT-TEMPLATE.md',
    outName: `My-Democracy-Platform-Services-Agreement-${TODAY}.pdf`,
    title: 'Platform Services Agreement',
    isContract: true,
  },
  dpa: {
    source: 'docs/DPA-TEMPLATE.md',
    outName: `My-Democracy-Data-Processing-Addendum-${TODAY}.pdf`,
    title: 'Data Processing Addendum',
    isContract: true,
  },
  overview: {
    // Not a contract and not customer-specific: the same document goes to
    // every org that runs a security review, so it carries no Customer blank.
    source: 'docs/SECURITY-OVERVIEW.md',
    outName: `My-Democracy-Security-Overview-${TODAY}.pdf`,
    title: 'Security and Privacy Overview',
    isContract: false,
  },
};

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

/**
 * Fill the customer-specific blanks.
 *
 * Each pattern is asserted to appear exactly once. A template edit that
 * renames a blank should fail loudly here rather than quietly ship a PDF with
 * an empty customer name.
 */
function fill(
  md: string,
  source: string,
  customer: string,
  fee: string | null,
  isContract: boolean
): string {
  const subs: Array<{ find: string; replace: string; required: boolean }> = [
    {
      // The Customer blank in the parties clause, in both the Agreement and
      // the Addendum. The signature-block blanks look the same, so match on
      // the ("Customer") that only follows this one.
      find: '**______________________** ("Customer").',
      replace: `**${customer}** ("Customer").`,
      required: isContract,
    },
    {
      find: 'The fee for Customer\'s first term is **$__________**',
      replace: `The fee for Customer's first term is **$${fee}**`,
      required: false, // Agreement only, and only when a fee was given.
    },
  ];

  let out = md;
  for (const { find, replace, required } of subs) {
    const count = out.split(find).length - 1;
    if (count === 0) {
      if (required) throw new Error(`${source}: expected to find ${JSON.stringify(find)} and did not`);
      continue;
    }
    if (count > 1) throw new Error(`${source}: ${JSON.stringify(find)} appears ${count} times, expected 1`);
    if (find.includes('$__________') && fee === null) continue;
    out = out.replace(find, replace);
  }
  return out;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Bold and inline code, after escaping. */
const inline = (s: string) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

/**
 * Markdown to HTML for the subset these documents use: h1-h3, pipe tables,
 * dash bullets, lettered clauses, horizontal rules, bold and inline code.
 *
 * Lettered clauses ("a. ...") are the reason this is not a one-liner. They are
 * not an ordered list in markdown, so a generic renderer joins them into one
 * paragraph and the clause structure of section 1 disappears.
 */
function render(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let i = 0;

  const flushParagraph = (buf: string[]) => {
    if (buf.length) {
      const text = buf.join(' ');
      // A paragraph that is nothing but bold text is a label rather than
      // prose: the party names over each signature block. Give it room above
      // so the two blocks do not run together on the signature page.
      const isLabel = /^\*\*[^*]+\*\*$/.test(text.trim());
      html.push(`<p${isLabel ? ' class="block-label"' : ''}>${inline(text)}</p>`);
    }
    buf.length = 0;
  };

  const para: string[] = [];

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*$/.test(line)) {
      flushParagraph(para);
      i++;
      continue;
    }

    if (/^---+\s*$/.test(line)) {
      flushParagraph(para);
      html.push('<hr>');
      i++;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushParagraph(para);
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    // Pipe table: a header row, a separator row, then body rows.
    if (line.startsWith('|') && /^\|[\s:|-]+\|?\s*$/.test(lines[i + 1] ?? '')) {
      flushParagraph(para);
      const cells = (row: string) =>
        row.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const body: string[][] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        body.push(cells(lines[i]));
        i++;
      }
      // Some tables in the overview are two-column key/value with an empty
      // header. Rendering an empty <thead> leaves a blank band, so drop it.
      const headerIsEmpty = head.every((c) => c === '');
      const thead = headerIsEmpty
        ? ''
        : `<thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>`;
      const rows = body
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
        .join('');
      html.push(`<table>${thead}<tbody>${rows}</tbody></table>`);
      continue;
    }

    // Bullets and lettered clauses, each with 2-3 space continuation lines.
    const item = line.match(/^(?:-\s+|([a-z])\.\s+)(.*)$/);
    if (item) {
      flushParagraph(para);
      const lettered = Boolean(item[1]);
      const items: Array<{ marker: string | null; text: string[] }> = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(?:-\s+|([a-z])\.\s+)(.*)$/);
        if (m && Boolean(m[1]) === lettered) {
          items.push({ marker: m[1] ?? null, text: [m[2]] });
          i++;
        } else if (/^\s{2,}\S/.test(lines[i]) && items.length) {
          items[items.length - 1].text.push(lines[i].trim());
          i++;
        } else {
          break;
        }
      }
      if (lettered) {
        // Keep the document's own letters rather than renumbering, so a
        // cross-reference to "section 5(c)" still points at the right clause.
        html.push(
          `<dl class="clauses">${items
            .map((it) => `<dt>${it.marker}.</dt><dd>${inline(it.text.join(' '))}</dd>`)
            .join('')}</dl>`
        );
      } else {
        html.push(
          `<ul>${items.map((it) => `<li>${inline(it.text.join(' '))}</li>`).join('')}</ul>`
        );
      }
      continue;
    }

    para.push(line.trim());
    i++;
  }
  flushParagraph(para);
  return html.join('\n');
}

const STYLE = `
  @page { size: letter; margin: 0.9in 0.85in; }
  * { box-sizing: border-box; }
  body {
    font: 10.5pt/1.55 "Georgia", "Times New Roman", serif;
    color: #15181d; margin: 0;
  }
  h1 {
    font-size: 19pt; line-height: 1.25; margin: 0 0 1.3em;
    letter-spacing: -0.01em;
  }
  h2 {
    font-size: 12pt; margin: 1.9em 0 0.6em;
    padding-bottom: 0.3em; border-bottom: 1px solid #d8dde4;
    page-break-after: avoid;
  }
  h3 { font-size: 10.5pt; margin: 1.4em 0 0.4em; page-break-after: avoid; }
  p { margin: 0 0 0.85em; orphans: 3; widows: 3; }
  p.block-label { margin-top: 1.9em; page-break-after: avoid; }
  hr + p.block-label { margin-top: 0; }
  strong { font-weight: 700; }
  code {
    font: 9pt/1.4 "SFMono-Regular", Menlo, Consolas, monospace;
    background: #f3f5f8; border-radius: 2px;
    /* Vertical padding only: horizontal padding opens a gap before a
       following comma, which reads as a stray space in a region name. */
    padding: 0.1em 0;
  }
  hr { border: 0; border-top: 1px solid #d8dde4; margin: 1.8em 0; }
  ul { margin: 0 0 0.9em; padding-left: 1.2em; }
  li { margin-bottom: 0.35em; }
  /* Lettered clauses: the document's own letter in the margin. */
  dl.clauses { margin: 0 0 0.9em; padding: 0; }
  dl.clauses dt {
    float: left; width: 1.6em; font-weight: 600; clear: left;
  }
  dl.clauses dd { margin: 0 0 0.45em 1.6em; }
  table {
    width: 100%; border-collapse: collapse; margin: 0.6em 0 1.2em;
    font-size: 9.5pt; page-break-inside: avoid;
  }
  th, td {
    text-align: left; vertical-align: top; padding: 0.42em 0.6em;
    border-bottom: 1px solid #e3e7ec;
  }
  th { font-weight: 700; border-bottom: 1.5px solid #c3cad3; }
  td:first-child { font-weight: 600; width: 32%; }
  thead { display: table-header-group; }
`;

async function main() {
  const customer = arg('customer');
  const slug = arg('slug');
  if (!customer || !slug) {
    throw new Error('--customer and --slug are required');
  }
  const fee = arg('fee') ? Number(arg('fee')).toLocaleString('en-US') : null;
  const keys = (arg('docs') ?? 'agreement,dpa,overview').split(',').map((k) => k.trim()) as DocKey[];
  for (const k of keys) if (!(k in DOCS)) throw new Error(`unknown doc "${k}"`);

  const outDir = arg('out') ?? path.join(os.homedir(), 'Desktop', 'mydemocracy-documents', slug);
  fs.mkdirSync(outDir, { recursive: true });

  if (keys.includes('agreement') && fee === null) {
    console.warn('warning: no --fee given, so the first-term fee stays blank in the Agreement\n');
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (const key of keys) {
      const def = DOCS[key];
      const md = fill(
        fs.readFileSync(def.source, 'utf8'),
        def.source,
        customer,
        fee,
        def.isContract
      );
      const body = render(md);
      const html = `<!doctype html><html><head><meta charset="utf-8">
        <title>${esc(def.title)}</title><style>${STYLE}</style></head>
        <body>${body}</body></html>`;

      await page.setContent(html, { waitUntil: 'load' });
      const out = path.join(outDir, def.outName);
      await page.pdf({
        path: out,
        format: 'Letter',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `<div style="font:8pt Georgia,serif;color:#7b8694;width:100%;
          padding:0 0.85in;display:flex;justify-content:space-between;">
          <span>${esc(customer)} and My Democracy LLC &middot; ${esc(def.title)}</span>
          <span class="pageNumber"></span></div>`,
      });
      const kb = Math.round(fs.statSync(out).size / 1024);
      console.log(`  ${def.outName}  (${kb} KB)`);
    }
  } finally {
    await browser.close().catch(() => {});
  }

  console.log(`\n${keys.length} document(s) in ${outDir}`);
  console.log('Effective Date and both signature blocks are intentionally blank.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
