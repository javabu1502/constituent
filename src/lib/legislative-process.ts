/**
 * How a bill becomes law, per jurisdiction.
 *
 * The org dashboard draws a bill's position on the path it actually travels.
 * That path is not the same everywhere:
 *
 *   - Chambers have different names. Most states call the lower chamber the
 *     House of Representatives, but seven do not.
 *   - Nebraska has no lower chamber at all. It is the only unicameral state
 *     legislature, so its path has one floor vote, not two.
 *   - A bill starts in the chamber its number belongs to. H.R. 2184 goes
 *     House then Senate; S. 4825 goes Senate then House. Drawing a fixed
 *     "House then Senate" track puts half of all Senate bills in the wrong
 *     place.
 *   - States end at the governor, Congress ends at the president.
 *
 * Positions returned here are indexes into the `stages` array of the same
 * track, so a caller never has to know how long the track is.
 */

export type Chamber = 'lower' | 'upper';

/** Lower-chamber names that are not "House of Representatives". */
const LOWER_CHAMBER_NAMES: Record<string, string> = {
  CA: 'Assembly',
  NV: 'Assembly',
  NY: 'Assembly',
  WI: 'Assembly',
  NJ: 'General Assembly',
  MD: 'House of Delegates',
  VA: 'House of Delegates',
  WV: 'House of Delegates',
};

/** Short forms for a progress track, where space is tight. */
const LOWER_CHAMBER_SHORT: Record<string, string> = {
  CA: 'Assembly',
  NV: 'Assembly',
  NY: 'Assembly',
  WI: 'Assembly',
  NJ: 'Assembly',
  MD: 'Delegates',
  VA: 'Delegates',
  WV: 'Delegates',
};

/** The one unicameral state legislature. Members are called Senators. */
const UNICAMERAL = new Set(['NE']);

export function isUnicameral(state: string): boolean {
  return UNICAMERAL.has(state.toUpperCase());
}

/** Full name of a chamber, e.g. "Assembly" in Nevada, "Senate" in Texas. */
export function chamberName(state: string, chamber: Chamber): string {
  const st = state.toUpperCase();
  if (isUnicameral(st)) return 'Legislature';
  if (chamber === 'upper') return 'Senate';
  return LOWER_CHAMBER_NAMES[st] ?? 'House of Representatives';
}

/** Short name for a progress track. */
export function chamberShortName(state: string, chamber: Chamber): string {
  const st = state.toUpperCase();
  if (isUnicameral(st)) return 'Floor';
  if (chamber === 'upper') return 'Senate';
  return LOWER_CHAMBER_SHORT[st] ?? 'House';
}

/**
 * Which chamber a bill starts in, from its type prefix.
 * Federal: hr/hres/hjres/hconres start in the House, s/sres/... in the Senate.
 * State: OpenStates and LegiScan use the same A/AB/H/HB vs S/SB convention.
 */
export function originChamber(billType: string | null | undefined): Chamber {
  const t = String(billType ?? '').trim().toLowerCase();
  if (!t) return 'lower';
  // Anything starting with s (s, sb, sr, sres, sjres, sconres) is upper.
  // Anything starting with a (ab, a) or h (h, hb, hr, hres) is lower.
  if (t.startsWith('s')) return 'upper';
  return 'lower';
}

export interface BillTrack {
  /** Ordered stage labels, short enough for a progress bar. */
  stages: string[];
  /** Long labels for a detail view. */
  longStages: string[];
}

/**
 * The stages a bill passes through, in order, for this jurisdiction.
 * `state` is ignored when level is 'federal'.
 */
export function billTrack(
  level: 'federal' | 'state',
  state: string | null | undefined,
  billType: string | null | undefined,
): BillTrack {
  if (level === 'federal') {
    const first = originChamber(billType) === 'upper' ? 'Senate' : 'House';
    const second = first === 'Senate' ? 'House' : 'Senate';
    return {
      stages: ['Introduced', 'Committee', first, second, 'Signed'],
      longStages: [
        'Introduced',
        'In committee',
        `Passed the ${first}`,
        `Passed the ${second}`,
        'Signed into law',
      ],
    };
  }

  const st = (state ?? '').toUpperCase();

  if (isUnicameral(st)) {
    return {
      stages: ['Introduced', 'Committee', 'Floor', 'Governor'],
      longStages: [
        'Introduced',
        'In committee',
        'Passed the Legislature',
        'Signed by the governor',
      ],
    };
  }

  const origin = originChamber(billType);
  const other: Chamber = origin === 'upper' ? 'lower' : 'upper';
  const first = chamberShortName(st, origin);
  const second = chamberShortName(st, other);
  return {
    stages: ['Introduced', 'Committee', first, second, 'Governor'],
    longStages: [
      'Introduced',
      'In committee',
      `Passed the ${chamberName(st, origin)}`,
      `Passed the ${chamberName(st, other)}`,
      'Signed by the governor',
    ],
  };
}

/**
 * How far along the track the bill has got, as an index into `billTrack().stages`.
 * Reads the same official action text `suggestNextStage` reads, so the two never
 * disagree about where a bill is. Returns 0 when nothing matches, which renders
 * as "Introduced" — the one thing true of every bill that exists.
 *
 * `latestChamber` is OpenStates' organization classification ('upper' | 'lower'),
 * used to tell a first-chamber pass from a second-chamber pass.
 */
export function billTrackPosition(
  latestAction: string,
  latestChamber: string | null,
  level: 'federal' | 'state',
  state: string | null | undefined,
  billType: string | null | undefined,
): number {
  const t = String(latestAction ?? '').toLowerCase();
  const st = (state ?? '').toUpperCase();
  const unicameral = level === 'state' && isUnicameral(st);
  const lastIndex = unicameral ? 3 : 4;

  // Signed / enacted — the end of the track.
  if (/signed by (the )?governor|governor signed|became (public )?law|approved by (the )?governor|chaptered|enacted|signed by the president/.test(t)) {
    return lastIndex;
  }
  // Through the legislature, waiting on a signature. Still the final floor
  // stage: it has not been signed yet.
  if (/delivered to (the )?governor|presented to the president|to governor|enrolled/.test(t)) {
    return lastIndex - 1;
  }

  if (unicameral) {
    if (/\bpassed\b|final reading|third reading passed/.test(t)) return 2;
    if (/do pass|reported out|committee report|placed on .*(calendar|file)/.test(t)) return 2;
    if (/referred to|re-referred|assigned to|in committee|hearing (scheduled|held)/.test(t)) return 1;
    return 0;
  }

  const origin = originChamber(billType);

  // A pass in the chamber the bill did NOT start in means both are done.
  if (/\bpassed\b/.test(t)) {
    if (latestChamber && latestChamber !== origin) return 3;
    if (/passed(?: the)? senate|passed(?: the)? upper/.test(t)) {
      return origin === 'upper' ? 2 : 3;
    }
    if (/passed(?: the)? (assembly|house|house of delegates)|passed(?: the)? lower/.test(t)) {
      return origin === 'lower' ? 2 : 3;
    }
    return 2;
  }

  // Out of committee but not yet voted on the floor: still the committee stage.
  if (/do pass|reported favorably|committee report|reported out|placed on .*(calendar|file)|ordered to (a )?third reading/.test(t)) {
    return 1;
  }
  if (/referred to|re-referred|assigned to|in committee|hearing (scheduled|held)|scheduled for hearing/.test(t)) {
    return 1;
  }
  return 0;
}
