#!/usr/bin/env python3
"""Merge research-agent roster files into src/data/local/nv.json.

Usage: python3 scripts/merge-local-rosters.py <file.json> [more.json...]
Normalizes seat fields, drops obviously bad emails, keeps unverified seats
(listed, never emailed), and refuses to write if any body lacks a GEOID.
"""
import json, re, sys, datetime, pathlib

OUT = pathlib.Path('src/data/local/nv.json')
EMAIL = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
TYPES = {'county', 'city', 'school_district'}

def norm_seat(s):
    email = (s.get('email') or '').strip() or None
    if email and not EMAIL.match(email):
        email = None
    term = s.get('termEnd')
    return {
        'name': s['name'].strip(),
        'title': (s.get('title') or '').strip() or 'Council Member',
        'district': (s.get('district') or '').strip() or None,
        'party': (s.get('party') or None),
        'email': email,
        'emailIsShared': bool(s.get('emailIsShared')),
        'contactFormUrl': s.get('contactFormUrl') or None,
        'phone': s.get('phone') or None,
        'website': s.get('website') or None,
        'photoUrl': s.get('photoUrl') or None,
        'termEnd': str(term) if term not in (None, '') else None,
        'sourceUrl': s.get('sourceUrl') or None,
        'verifiedAt': s.get('verifiedAt') or None,
        'unverified': bool(s.get('unverified')),
    }

def main(paths):
    roster = json.loads(OUT.read_text()) if OUT.exists() else {'state': 'NV', 'updatedAt': '', 'bodies': []}
    by_geoid_name = {(b['geoid'], b['name']): b for b in roster['bodies']}
    problems = []
    for p in paths:
        data = json.loads(pathlib.Path(p).read_text())
        for b in data['bodies']:
            geoid = str(b.get('geoid') or '').strip()
            if not re.match(r'^\d{5}$|^\d{7}$', geoid):
                problems.append(f"{b.get('name')}: bad/missing geoid {geoid!r}")
                continue
            if b.get('type') not in TYPES:
                problems.append(f"{b.get('name')}: bad type {b.get('type')!r}")
                continue
            body = {
                'type': b['type'], 'name': b['name'].strip(), 'state': 'NV', 'geoid': geoid,
                'geoidVerified': bool(b.get('geoidVerified')),
                'electionBasis': b.get('electionBasis') or None,
                'website': b.get('website') or None,
                'seats': [norm_seat(s) for s in b.get('seats', []) if s.get('name')],
            }
            by_geoid_name[(geoid, body['name'])] = body
    if problems:
        print('REFUSING TO WRITE:'); [print(' -', x) for x in problems]; sys.exit(1)
    bodies = sorted(by_geoid_name.values(), key=lambda b: (b['type'], b['name']))
    roster = {'state': 'NV', 'updatedAt': datetime.date.today().isoformat(), 'bodies': bodies}
    OUT.write_text(json.dumps(roster, indent=2, ensure_ascii=False) + '\n')
    seats = sum(len(b['seats']) for b in bodies)
    emails = sum(1 for b in bodies for s in b['seats'] if s['email'] and not s['unverified'])
    unv = sum(1 for b in bodies for s in b['seats'] if s['unverified'])
    print(f"wrote {OUT}: {len(bodies)} bodies, {seats} seats, {emails} with email, {unv} unverified")

if __name__ == '__main__':
    main(sys.argv[1:])
