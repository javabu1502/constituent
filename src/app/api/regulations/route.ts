import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/regulations?agency=EPA&topic=environment&page=1
 *
 * Fetches open comment periods and recent proposed rules from the Federal Register API.
 * No API key required.
 */

interface FederalRegisterDocument {
  document_number: string;
  title: string;
  type: string;
  abstract: string | null;
  html_url: string;
  pdf_url: string;
  publication_date: string;
  agencies: { name: string; id: number; slug: string }[];
  comment_url: string | null;
  comments_close_on: string | null;
  docket_ids: string[];
  regulation_id_numbers: string[];
  subtype: string | null;
}

interface RegulationResult {
  id: string;
  title: string;
  abstract: string | null;
  agency: string;
  agencySlug: string;
  type: string;
  publishedDate: string;
  commentDeadline: string | null;
  commentUrl: string | null;
  federalRegisterUrl: string;
  docketId: string | null;
  isOpen: boolean;
  daysLeft: number | null;
}

const FR_API = 'https://www.federalregister.gov/api/v1';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const agency = searchParams.get('agency') || '';
  const topic = searchParams.get('topic') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const mode = searchParams.get('mode') || 'open'; // 'open' | 'recent' | 'executive_orders'

  try {
    let url: string;

    if (mode === 'executive_orders') {
      // Fetch recent executive orders
      url = `${FR_API}/documents.json?conditions[type][]=PRESDOCU&conditions[presidential_document_type][]=executive_order&order=newest&per_page=20&page=${page}&fields[]=document_number&fields[]=title&fields[]=type&fields[]=abstract&fields[]=html_url&fields[]=pdf_url&fields[]=publication_date&fields[]=agencies&fields[]=subtype`;
    } else {
      // Build conditions for proposed rules / open comment periods
      const conditions: string[] = [];

      if (mode === 'open') {
        // Only proposed rules with open comment periods
        conditions.push('conditions[type][]=PRORULE');
        conditions.push('conditions[comment_date][is_not_null]=1');

        // Calculate date window: comments_close_on >= today
        const today = new Date().toISOString().split('T')[0];
        conditions.push(`conditions[comment_date][gte]=${today}`);
      } else {
        // Recent proposed + final rules
        conditions.push('conditions[type][]=PRORULE');
        conditions.push('conditions[type][]=RULE');
      }

      if (agency) {
        conditions.push(`conditions[agencies][]=${encodeURIComponent(agency)}`);
      }
      if (topic) {
        conditions.push(`conditions[term]=${encodeURIComponent(topic)}`);
      }

      const fields = [
        'document_number', 'title', 'type', 'abstract', 'html_url',
        'pdf_url', 'publication_date', 'agencies', 'comment_url',
        'comments_close_on', 'docket_ids', 'regulation_id_numbers', 'subtype',
      ].map((f) => `fields[]=${f}`).join('&');

      url = `${FR_API}/documents.json?${conditions.join('&')}&order=newest&per_page=20&page=${page}&${fields}`;
    }

    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('[regulations] Federal Register API error:', response.status);
      return NextResponse.json(
        { error: 'Failed to fetch regulations' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const now = new Date();

    const regulations: RegulationResult[] = (data.results || []).map((doc: FederalRegisterDocument) => {
      const commentDeadline = doc.comments_close_on || null;
      let isOpen = false;
      let daysLeft: number | null = null;

      if (commentDeadline) {
        const deadline = new Date(commentDeadline + 'T23:59:59');
        isOpen = deadline >= now;
        daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) daysLeft = 0;
      }

      return {
        id: doc.document_number,
        title: doc.title,
        abstract: doc.abstract,
        agency: doc.agencies?.[0]?.name || 'Unknown Agency',
        agencySlug: doc.agencies?.[0]?.slug || '',
        type: doc.subtype || doc.type,
        publishedDate: doc.publication_date,
        commentDeadline,
        commentUrl: doc.comment_url || (doc.docket_ids?.[0] ? `https://www.regulations.gov/docket/${doc.docket_ids[0]}` : null),
        federalRegisterUrl: doc.html_url,
        docketId: doc.docket_ids?.[0] || null,
        isOpen,
        daysLeft,
      };
    });

    return NextResponse.json({
      regulations,
      totalCount: data.count || 0,
      totalPages: data.total_pages || 1,
      currentPage: page,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch (err) {
    console.error('[regulations] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch regulations' },
      { status: 500 }
    );
  }
}
