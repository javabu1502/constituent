/**
 * State legislative committee lookup — vendored from the openstates/people
 * repo by scripts/refresh-state-committees.ts (src/data/state-committees/,
 * one JSON per state). Member ids are full ocd-person ids, the same ids our
 * state legislator data and the participate flow's Official.id use, so
 * committee targeting is a set lookup — identical shape to the federal
 * committees lib, keyed by state.
 */
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'state-committees');

export interface StateCommittee {
  /** Bare uuid (URL-safe; ocd-organization/ prefix stripped at vendor time). */
  id: string;
  name: string;
  chamber: 'upper' | 'lower' | 'legislature';
  classification: string;
  /** Full ocd-person ids. */
  members: string[];
}

const cache = new Map<string, StateCommittee[]>();

function loadState(stateCode: string): StateCommittee[] {
  const code = stateCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return [];
  const hit = cache.get(code);
  if (hit) return hit;

  const file = path.join(DATA_DIR, `${code}.json`);
  if (!fs.existsSync(file)) {
    cache.set(code, []);
    return [];
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf-8')) as StateCommittee[];
    cache.set(code, parsed);
    return parsed;
  } catch (err) {
    console.error(`[state-committees] Failed to parse ${code}.json:`, err);
    cache.set(code, []);
    return [];
  }
}

/** Main committees for a state (subcommittees excluded), sorted by name. */
export function listStateCommittees(stateCode: string): StateCommittee[] {
  return loadState(stateCode).filter((c) => c.classification === 'committee');
}

export function getStateCommittee(stateCode: string, id: string): StateCommittee | null {
  return loadState(stateCode).find((c) => c.id === id) ?? null;
}

/** Full ocd-person ids on a committee; empty when unknown. */
export function getStateCommitteeMembers(stateCode: string, id: string): string[] {
  return getStateCommittee(stateCode, id)?.members ?? [];
}

export function isStateCommitteeMember(personId: string, stateCode: string, committeeId: string): boolean {
  return getStateCommitteeMembers(stateCode, committeeId).includes(personId);
}

/** Clear cache (tests / after a data refresh). */
export function clearStateCommitteesCache(): void {
  cache.clear();
}
