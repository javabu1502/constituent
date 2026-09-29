#!/usr/bin/env python3
"""Attach boundary files to roster bodies and copy the GeoJSON into the repo.

Usage: python3 scripts/attach-local-boundaries.py <dir-with-<key>.geojson>
Only keys whose file exists and has features are attached; each feature must
carry a `district` property. Rewrites src/data/local/nv.json and
src/data/local/nv-boundaries/<key>.json.
"""
import json, sys, pathlib, shutil
KEY_BY_GEOID = {
    '32003': 'clark-commission', '3200060': 'ccsd-trustees', '3240000': 'las-vegas-wards',
    '3231900': 'henderson-wards', '3251800': 'north-las-vegas-wards', '32031': 'washoe-commission',
    '3200480': 'wcsd-trustees', '3260600': 'reno-wards', '3268400': 'sparks-wards',
}
src = pathlib.Path(sys.argv[1]); out = pathlib.Path('src/data/local/nv-boundaries'); roster = pathlib.Path('src/data/local/nv.json')
data = json.loads(roster.read_text())
attached = []
for body in data['bodies']:
    key = KEY_BY_GEOID.get(body['geoid'])
    if not key or body['type'] == 'school_district' and key not in ('ccsd-trustees', 'wcsd-trustees'):
        continue
    if body['type'] == 'county' and key not in ('clark-commission', 'washoe-commission'): continue
    if body['type'] == 'city' and key in ('clark-commission', 'washoe-commission', 'ccsd-trustees', 'wcsd-trustees'): continue
    f = src / f'{key}.geojson'
    if not f.exists(): continue
    fc = json.loads(f.read_text())
    feats = [x for x in fc.get('features', []) if x.get('properties', {}).get('district') and x.get('geometry')]
    if not feats: print('skip (no features/district)', key); continue
    (out / f'{key}.json').write_text(json.dumps({'type': 'FeatureCollection', 'features': feats}, separators=(',', ':')))
    body['boundaries'] = key
    attached.append((key, body['name'], len(feats), sorted({x['properties']['district'] for x in feats})))
roster.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')
for a in attached: print(*a)
print(f'attached {len(attached)} bodies')
