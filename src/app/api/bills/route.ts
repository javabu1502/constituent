import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/bills?state=NV&query=housing&page=1
 *
 * Searches state legislation via the Open States GraphQL API (v3).
 * Requires OPENSTATES_API_KEY env var.
 * Returns simplified bill objects: id, title, identifier, session, subjects, status, url.
 */

interface BillResult {
  id: string;
  identifier: string;
  title: string;
  session: string;
  subjects: string[];
  updatedAt: string;
  url: string;
  sponsor: string | null;
  latestAction: string | null;
  latestActionDate: string | null;
}

const GRAPHQL_ENDPOINT = 'https://v3.openstates.org/graphql';

const BILLS_QUERY = `
  query SearchBills($state: String!, $query: String!, $first: Int!, $after: String) {
    bills(
      jurisdiction: $state
      searchQuery: $query
      first: $first
      after: $after
      sort: "updated_desc"
    ) {
      edges {
        node {
          id
          identifier
          title
          session {
            identifier
          }
          subject
          updatedAt
          openstatesUrl
          sponsorships(first: 1) {
            edges {
              node {
                name
              }
            }
          }
          actions(last: 1) {
            edges {
              node {
                description
                date
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

export async function GET(request: NextRequest) {
  const apiKey = process.env.OPENSTATES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Bill search is not configured. Missing OPENSTATES_API_KEY.' },
      { status: 503 }
    );
  }

  const { searchParams } = request.nextUrl;
  const state = searchParams.get('state');
  const query = searchParams.get('query');
  const after = searchParams.get('after') || null;

  if (!state || !query) {
    return NextResponse.json(
      { error: 'Both state and query parameters are required' },
      { status: 400 }
    );
  }

  // Open States uses lowercase two-letter jurisdiction codes
  const jurisdiction = state.length === 2 ? state.toLowerCase() : state.toLowerCase();

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        query: BILLS_QUERY,
        variables: {
          state: jurisdiction,
          query,
          first: 10,
          after,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[bills] Open States API error:', response.status, errText);
      return NextResponse.json(
        { error: 'Failed to search bills' },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data.errors) {
      console.error('[bills] GraphQL errors:', data.errors);
      return NextResponse.json(
        { error: 'Failed to search bills' },
        { status: 502 }
      );
    }

    const billsData = data.data?.bills;
    if (!billsData) {
      return NextResponse.json({ bills: [], totalCount: 0, hasNextPage: false, endCursor: null });
    }

    const bills: BillResult[] = billsData.edges.map((edge: { node: Record<string, unknown> }) => {
      const node = edge.node as {
        id: string;
        identifier: string;
        title: string;
        session: { identifier: string };
        subject: string[];
        updatedAt: string;
        openstatesUrl: string;
        sponsorships: { edges: { node: { name: string } }[] };
        actions: { edges: { node: { description: string; date: string } }[] };
      };

      const sponsor = node.sponsorships?.edges?.[0]?.node?.name || null;
      const latestAction = node.actions?.edges?.[0]?.node?.description || null;
      const latestActionDate = node.actions?.edges?.[0]?.node?.date || null;

      return {
        id: node.id,
        identifier: node.identifier,
        title: node.title,
        session: node.session?.identifier || '',
        subjects: node.subject || [],
        updatedAt: node.updatedAt,
        url: node.openstatesUrl || `https://openstates.org/${jurisdiction}/bills/${node.session?.identifier}/${node.identifier}/`,
        sponsor,
        latestAction,
        latestActionDate,
      };
    });

    return NextResponse.json({
      bills,
      totalCount: billsData.totalCount,
      hasNextPage: billsData.pageInfo.hasNextPage,
      endCursor: billsData.pageInfo.endCursor,
    });
  } catch (err) {
    console.error('[bills] Error:', err);
    return NextResponse.json(
      { error: 'Failed to search bills' },
      { status: 500 }
    );
  }
}
