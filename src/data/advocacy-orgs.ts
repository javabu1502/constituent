// Organizations working on each issue area
export const ADVOCACY_ORGS: Record<string, { name: string; url: string }[]> = {
  'Health': [
    { name: 'KFF (Health Policy Research)', url: 'https://www.kff.org/' },
    { name: 'Families USA', url: 'https://familiesusa.org/' },
    { name: 'National Alliance on Mental Illness', url: 'https://www.nami.org/' },
    { name: 'American Hospital Association', url: 'https://www.aha.org/' },
    { name: 'Patient Advocate Foundation', url: 'https://www.patientadvocate.org/' },
  ],
  'Immigration': [
    { name: 'American Immigration Lawyers Association', url: 'https://www.aila.org/' },
    { name: 'Migration Policy Institute', url: 'https://www.migrationpolicy.org/' },
    { name: 'National Immigration Forum', url: 'https://immigrationforum.org/' },
    { name: 'Center for Immigration Studies', url: 'https://cis.org/' },
    { name: 'National Immigration Law Center', url: 'https://www.nilc.org/' },
  ],
  'Environmental Protection': [
    { name: 'Sierra Club', url: 'https://www.sierraclub.org/' },
    { name: 'American Conservation Coalition', url: 'https://www.acc.eco/' },
    { name: 'Environmental Defense Fund', url: 'https://www.edf.org/' },
    { name: 'Natural Resources Defense Council', url: 'https://www.nrdc.org/' },
    { name: 'Resources for the Future', url: 'https://www.rff.org/' },
  ],
  'Education': [
    { name: 'National Education Association', url: 'https://www.nea.org/' },
    { name: 'National PTA', url: 'https://www.pta.org/' },
    { name: 'Education Trust', url: 'https://edtrust.org/' },
    { name: 'National Center for Education Statistics', url: 'https://nces.ed.gov/' },
    { name: 'Institute for College Access & Success', url: 'https://ticas.org/' },
  ],
  'Crime and Law Enforcement': [
    { name: 'Brennan Center for Justice', url: 'https://www.brennancenter.org/' },
    { name: 'National Criminal Justice Association', url: 'https://www.ncja.org/' },
    { name: 'Council on Criminal Justice', url: 'https://counciloncj.org/' },
    { name: 'Everytown for Gun Safety', url: 'https://www.everytown.org/' },
    { name: 'National Rifle Association — ILA', url: 'https://www.nraila.org/' },
  ],
  'Taxation': [
    { name: 'Tax Foundation', url: 'https://taxfoundation.org/' },
    { name: 'Tax Policy Center', url: 'https://www.taxpolicycenter.org/' },
    { name: 'Center on Budget and Policy Priorities', url: 'https://www.cbpp.org/' },
    { name: 'Americans for Tax Reform', url: 'https://www.atr.org/' },
  ],
  'Economics and Public Finance': [
    { name: 'Brookings Institution', url: 'https://www.brookings.edu/' },
    { name: 'Economic Policy Institute', url: 'https://www.epi.org/' },
    { name: 'Committee for a Responsible Federal Budget', url: 'https://www.crfb.org/' },
    { name: 'Congressional Budget Office', url: 'https://www.cbo.gov/' },
    { name: 'American Enterprise Institute', url: 'https://www.aei.org/' },
  ],
  'Armed Forces and National Security': [
    { name: 'Veterans of Foreign Wars', url: 'https://www.vfw.org/' },
    { name: 'RAND National Security', url: 'https://www.rand.org/topics/national-security.html' },
    { name: 'Blue Star Families', url: 'https://bluestarfam.org/' },
    { name: 'Disabled American Veterans', url: 'https://www.dav.org/' },
    { name: 'Center for Strategic and International Studies', url: 'https://www.csis.org/' },
  ],
  'Labor and Employment': [
    { name: 'U.S. Department of Labor', url: 'https://www.dol.gov/' },
    { name: 'National Employment Law Project', url: 'https://www.nelp.org/' },
    { name: 'Society for Human Resource Management', url: 'https://www.shrm.org/' },
    { name: 'Bureau of Labor Statistics', url: 'https://www.bls.gov/' },
  ],
  'Science, Technology, Communications': [
    { name: 'Electronic Frontier Foundation', url: 'https://www.eff.org/' },
    { name: 'Information Technology and Innovation Foundation', url: 'https://itif.org/' },
    { name: 'Center for Democracy and Technology', url: 'https://cdt.org/' },
    { name: 'Brookings — TechStream', url: 'https://www.brookings.edu/topic/technology/' },
  ],
  'Housing and Community Development': [
    { name: 'National Low Income Housing Coalition', url: 'https://nlihc.org/' },
    { name: 'Habitat for Humanity', url: 'https://www.habitat.org/' },
    { name: 'Urban Institute — Housing', url: 'https://www.urban.org/policy-centers/housing-finance-policy-center' },
    { name: 'National Association of Realtors', url: 'https://www.nar.realtor/' },
    { name: 'Enterprise Community Partners', url: 'https://www.enterprisecommunity.org/' },
  ],
  'Social Welfare': [
    { name: 'AARP', url: 'https://www.aarp.org/' },
    { name: 'Center on Budget and Policy Priorities', url: 'https://www.cbpp.org/' },
    { name: 'National Academy of Social Insurance', url: 'https://www.nasi.org/' },
    { name: 'Social Security Administration', url: 'https://www.ssa.gov/' },
  ],
  'Families': [
    { name: 'National Partnership for Women & Families', url: 'https://nationalpartnership.org/' },
    { name: 'Child Welfare League of America', url: 'https://www.cwla.org/' },
    { name: 'Zero to Three', url: 'https://www.zerotothree.org/' },
    { name: 'Child Care Aware of America', url: 'https://www.childcareaware.org/' },
    { name: 'First Focus on Children', url: 'https://firstfocus.org/' },
  ],
  // Previously missing categories
  'Civil Rights and Liberties, Minority Issues': [
    { name: 'ACLU', url: 'https://www.aclu.org/' },
    { name: 'The Leadership Conference on Civil and Human Rights', url: 'https://civilrights.org/' },
    { name: 'NAACP', url: 'https://naacp.org/' },
    { name: 'Disability Rights Education & Defense Fund', url: 'https://dredf.org/' },
  ],
  'Energy': [
    { name: 'U.S. Energy Information Administration', url: 'https://www.eia.gov/' },
    { name: 'Rocky Mountain Institute', url: 'https://rmi.org/' },
    { name: 'American Energy Alliance', url: 'https://www.americanenergyalliance.org/' },
    { name: 'Nuclear Energy Institute', url: 'https://www.nei.org/' },
  ],
  'Foreign Trade and International Finance': [
    { name: 'Peterson Institute for International Economics', url: 'https://www.piie.com/' },
    { name: 'Office of the U.S. Trade Representative', url: 'https://ustr.gov/' },
    { name: 'National Foreign Trade Council', url: 'https://www.nftc.org/' },
    { name: 'U.S. International Trade Commission', url: 'https://www.usitc.gov/' },
  ],
  'International Affairs': [
    { name: 'Council on Foreign Relations', url: 'https://www.cfr.org/' },
    { name: 'Carnegie Endowment for International Peace', url: 'https://carnegieendowment.org/' },
    { name: 'U.S. Institute of Peace', url: 'https://www.usip.org/' },
    { name: 'Atlantic Council', url: 'https://www.atlanticcouncil.org/' },
  ],
};

// Subtopic-specific organizations (supplements category-level ADVOCACY_ORGS)
export const SUBTOPIC_ORGS: Record<string, { name: string; url: string }[]> = {};
