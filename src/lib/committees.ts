/**
 * Congressional committee lookup — House + Senate committees and their
 * membership, from the vendored unitedstates/congress-legislators data
 * (committees-current.yaml + committee-membership-current.yaml, refreshed by
 * scripts/refresh-federal-data.ts). Members are keyed by bioguide ID, the same
 * key our federal legislator data uses, so campaign stage targeting can check
 * "is this constituent's rep on the committee?" with a set lookup.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'legislators', 'federal');

export interface CommitteeSubcommittee {
  /** Full membership key: parent thomas_id + sub id (e.g. HSAG15). */
  id: string;
  name: string;
}

export interface Committee {
  /** 4-char thomas_id (HSAG, SSAF, ...). H* = House, S* = Senate, J* = Joint. */
  id: string;
  name: string;
  chamber: 'house' | 'senate' | 'joint';
  url: string | null;
  subcommittees: CommitteeSubcommittee[];
}

export interface CommitteeMember {
  bioguide: string;
  name: string;
  /** 'majority' | 'minority' as published; null if absent. */
  party: string | null;
  rank: number | null;
  /** Chairman / Ranking Member / etc. when the member holds a post. */
  title: string | null;
}

type RawCommittee = {
  type: 'house' | 'senate' | 'joint';
  name: string;
  thomas_id: string;
  url?: string;
  subcommittees?: Array<{ name: string; thomas_id: string }>;
};

type RawMember = { name: string; party?: string; rank?: number; title?: string; bioguide?: string };

let committeesCache: Map<string, Committee> | null = null;
let membershipCache: Map<string, CommitteeMember[]> | null = null;

function loadCommittees(): Map<string, Committee> {
  if (committeesCache) return committeesCache;
  committeesCache = new Map();

  const file = path.join(DATA_DIR, 'committees-current.yaml');
  if (!fs.existsSync(file)) {
    console.warn('[committees] committees-current.yaml not found — run npm run refresh-federal');
    return committeesCache;
  }

  const raw = yaml.parse(fs.readFileSync(file, 'utf-8')) as RawCommittee[];
  for (const c of raw) {
    if (!c.thomas_id || !c.name) continue;
    committeesCache.set(c.thomas_id, {
      id: c.thomas_id,
      name: c.name,
      chamber: c.type,
      url: c.url ?? null,
      subcommittees: (c.subcommittees ?? []).map((s) => ({ id: `${c.thomas_id}${s.thomas_id}`, name: s.name })),
    });
  }
  return committeesCache;
}

function loadMembership(): Map<string, CommitteeMember[]> {
  if (membershipCache) return membershipCache;
  membershipCache = new Map();

  const file = path.join(DATA_DIR, 'committee-membership-current.yaml');
  if (!fs.existsSync(file)) {
    console.warn('[committees] committee-membership-current.yaml not found — run npm run refresh-federal');
    return membershipCache;
  }

  const raw = yaml.parse(fs.readFileSync(file, 'utf-8')) as Record<string, RawMember[]>;
  for (const [committeeId, members] of Object.entries(raw)) {
    membershipCache.set(
      committeeId,
      members
        .filter((m) => m.bioguide)
        .map((m) => ({
          bioguide: m.bioguide!,
          name: m.name,
          party: m.party ?? null,
          rank: m.rank ?? null,
          title: m.title ?? null,
        }))
    );
  }
  return membershipCache;
}

/** All main committees, optionally filtered by chamber, sorted by name. */
export function listCommittees(chamber?: Committee['chamber']): Committee[] {
  const all = [...loadCommittees().values()];
  const filtered = chamber ? all.filter((c) => c.chamber === chamber) : all;
  return filtered.sort((a, b) => a.name.localeCompare(b.name));
}

/** Look up one committee (main committees only; subcommittees live on the parent). */
export function getCommittee(id: string): Committee | null {
  return loadCommittees().get(id) ?? null;
}

/**
 * Members of a committee or subcommittee, by membership key (HSAG, HSAG15...).
 * Empty array when the id is unknown — callers treat that as "no targeting".
 */
export function getCommitteeMembers(committeeId: string): CommitteeMember[] {
  return loadMembership().get(committeeId) ?? [];
}

/** Is this bioguide ID on the given committee/subcommittee? */
export function isCommitteeMember(bioguideId: string, committeeId: string): boolean {
  return getCommitteeMembers(committeeId).some((m) => m.bioguide === bioguideId);
}

/** Clear caches (tests / after a data refresh). */
export function clearCommitteesCache(): void {
  committeesCache = null;
  membershipCache = null;
}
