import fs from 'fs';
import yaml from 'yaml';

const KEY = process.env.CONGRESS_API_KEY;
const ADDRS = [
  ['901 Bagby St','Houston','TX','77002'],
  ['1500 Marilla St','Dallas','TX','75201'],
  ['301 W 2nd St','Austin','TX','78701'],
  ['100 Military Plaza','San Antonio','TX','78205'],
  ['600 E 4th St','Charlotte','NC','28202'],
  ['300 W Washington St','Greensboro','NC','27401'],
  ['414 E 12th St','Kansas City','MO','64106'],
  ['1200 Market St','St Louis','MO','63103'],
  ['90 W Broad St','Columbus','OH','43215'],
  ['601 Lakeside Ave E','Cleveland','OH','44114'],
  ['801 Plum St','Cincinnati','OH','45202'],
  ['200 N Spring St','Los Angeles','CA','90012'],
  ['2600 Fresno St','Fresno','CA','93721'],
  ['451 S State St','Salt Lake City','UT','84111'],
  ['441 Market St','Suffolk','VA','23434'],
  ['1 E 1st St','Reno','NV','89501'],
  ['600 4th Ave','Seattle','WA','98104'],
  ['1 City Hall Sq','Boston','MA','02201'],
  ['55 Trinity Ave SW','Atlanta','GA','30303'],
  ['200 W Washington St','Phoenix','AZ','85003'],
];

// --- replicate src/lib/geocode.ts CD extraction verbatim ---
function extractCD(geographies) {
  let congressionalDistrict = '0';
  for (const key of Object.keys(geographies)) {
    if (key.toLowerCase().includes('congressional')) {
      const cdInfo = geographies[key]?.[0];
      const cdField = cdInfo ? Object.keys(cdInfo).find((k) => /^CD\d{3}$/.test(k)) : undefined;
      congressionalDistrict = (cdField && cdInfo[cdField]) || cdInfo?.BASENAME || '0';
      if (congressionalDistrict && /^\d+$/.test(congressionalDistrict)) break;
      if (cdInfo?.BASENAME?.includes('at Large')) { congressionalDistrict = '0'; break; }
    }
  }
  return congressionalDistrict;
}

async function geo(street, city, state, zip, vintage) {
  const p = new URLSearchParams({ street, city, state, zip, benchmark: 'Public_AR_Current', vintage, layers: 'all', format: 'json' });
  const r = await fetch(`https://geocoding.geo.census.gov/geocoder/geographies/address?${p}`);
  const d = await r.json();
  const m = d.result?.addressMatches?.[0];
  if (!m) return null;
  const g = m.geographies || {};
  const cdKeys = Object.keys(g).filter(k => k.toLowerCase().includes('congressional'));
  const info = cdKeys.length ? g[cdKeys[0]][0] : null;
  return { cd: extractCD(g), layerKeys: cdKeys, cdsessn: info?.CDSESSN, sldu: (()=>{const k=Object.keys(g).filter(x=>x.toLowerCase().includes('state legislative')&&x.toLowerCase().includes('upper')).sort((a,b)=>yr(b)-yr(a));return k.length?(g[k[0]][0].BASENAME||g[k[0]][0].SLDU):null;})(), sldl: (()=>{const k=Object.keys(g).filter(x=>x.toLowerCase().includes('state legislative')&&x.toLowerCase().includes('lower')).sort((a,b)=>yr(b)-yr(a));return k.length?(g[k[0]][0].BASENAME||g[k[0]][0].SLDL):null;})() };
}
function yr(key){const y=key.match(/\b(\d{4})\b/g);return y?Math.max(...y.map(Number)):0;}

// --- local yaml lookup, mirroring findRepresentative/getCurrentTerm ---
const leg = yaml.parse(fs.readFileSync('src/data/legislators/federal/legislators-current.yaml','utf8'));
const today = new Date().toISOString().split('T')[0];
function currentTerm(l){const c=l.terms.filter(t=>t.end>=today);if(!c.length)return null;return c.sort((a,b)=>b.start.localeCompare(a.start))[0];}
function findRep(state,district){
  const dn = typeof district==='string'?parseInt(district,10):district;
  for(const l of leg){const t=currentTerm(l);if(t&&t.type==='rep'&&t.state===state&&t.district===dn)return (l.name.official_full||`${l.name.first} ${l.name.last}`)+` (${t.party[0]})`;}
  return null;
}

// --- api.congress.gov live current member ---
const memCache = {};
async function liveMember(state, district) {
  const k = `${state}-${district}`;
  if (memCache[k]) return memCache[k];
  const dn = parseInt(district,10);
  const url = `https://api.congress.gov/v3/member/${state}/${dn}?currentMember=true&api_key=${KEY}&format=json`;
  const r = await fetch(url);
  if (!r.ok) return memCache[k] = `HTTP ${r.status}`;
  const d = await r.json();
  const ms = d.members || [];
  const v = ms.length ? ms.map(m=>`${m.name} (${(m.partyName||'')[0]})`).join(' | ') : 'none';
  memCache[k]=v; return v;
}

const rows=[];
for (const [st,ci,sc,zp] of ADDRS) {
  const cur = await geo(st,ci,sc,zp,'Current_Current');
  const old = await geo(st,ci,sc,zp,'ACS2024_Current');
  const derived = cur?.cd ?? 'FAIL';
  const true119 = old?.cd ?? 'FAIL';
  const derivedRep = derived!=='FAIL' ? findRep(sc, derived) : null;
  const trueRep = true119!=='FAIL' ? findRep(sc, true119) : null;
  const live = true119!=='FAIL' ? await liveMember(sc, true119) : '-';
  const liveDerived = derived!=='FAIL' && derived!==true119 ? await liveMember(sc, derived) : live;
  rows.push({addr:`${st}, ${ci}, ${sc}`, layer: cur?.layerKeys.join(',')+` (sessn ${cur?.cdsessn})`, derivedCD:derived, cd119:true119,
    derivedRep, trueRep, liveCongressGov_for_119dist: live, liveCongressGov_for_derived: liveDerived,
    MISMATCH: derived!==true119, sldu:cur?.sldu, sldl:cur?.sldl});
  await new Promise(r=>setTimeout(r,250));
}
console.log(JSON.stringify(rows,null,1));
