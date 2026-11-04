/**
 * What each policy topic page actually says.
 *
 * A heading and a list of open questions is a thin page: it competes with
 * Ballotpedia and Congress.gov on their own ground and loses. The thing this
 * site can say that they do not is WHO DECIDES — which level of government
 * actually holds a given lever. That is the question people get wrong, it is
 * the reason letters land on the wrong desk, and it is the premise the whole
 * routing engine is built on.
 *
 * Kept apart from policy-topics.ts so the taxonomy stays a taxonomy. Facts
 * here are checkable: committee names and jurisdictional splits are stated
 * plainly and should be corrected when they change rather than hedged.
 */
export interface Decider {
  /** Who holds this lever. */
  level: 'Congress' | 'Your state' | 'Your city or county';
  what: string;
}

export interface TopicContent {
  /** Two or three sentences under the heading. Plain, not promotional. */
  intro: string;
  deciders: Decider[];
  /** Congressional committees that handle most of this subject. */
  committees?: string[];
  questions: { q: string; a: string }[];
}

export const TOPIC_CONTENT: Record<string, TopicContent> = {
  'health-care': {
    intro:
      'Health policy is split further than almost any other subject. Congress sets Medicare and the rules and funding for Medicaid; your state decides who Medicaid actually covers, licenses hospitals and insurers, and runs the insurance marketplace. Writing to the wrong one is the most common mistake people make here.',
    deciders: [
      { level: 'Congress', what: 'Medicare, the federal share and rules of Medicaid, drug pricing, FDA approval, and subsidies for marketplace plans.' },
      { level: 'Your state', what: 'Medicaid eligibility and expansion, insurance regulation, hospital and clinic licensing, scope of practice, and reproductive health law.' },
      { level: 'Your city or county', what: 'Public hospitals and clinics, county health departments, and emergency medical services.' },
    ],
    committees: ['Senate Finance', 'Senate Health, Education, Labor and Pensions', 'House Energy and Commerce', 'House Ways and Means'],
    questions: [
      { q: 'Who decides whether Medicaid covers me?', a: 'Your state does, within federal rules. Eligibility thresholds and whether a state expanded Medicaid under the ACA are state decisions, which is why coverage differs so much across state lines.' },
      { q: 'Can my member of Congress lower my insurance premium?', a: 'Indirectly. Congress sets the subsidies that reduce marketplace premiums and the rules insurers follow, but rate review and approval happen at your state insurance department.' },
      { q: 'Who regulates drug prices?', a: 'Congress. Medicare drug price negotiation, patent rules and import policy are all federal. Some states add their own transparency and affordability boards on top.' },
    ],
  },
  'families-and-children': {
    intro:
      'Most of what affects families day to day is decided by your state, not Congress. Child care subsidies, foster care and child protective services are state-run programs operating inside federal funding rules, so the people who can change how they work are usually in your statehouse.',
    deciders: [
      { level: 'Congress', what: 'Head Start, the child tax credit, federal child care and foster care funding, SNAP and WIC rules, and family leave policy.' },
      { level: 'Your state', what: 'Child care subsidy levels and eligibility, licensing of providers, child protective services, foster care and kinship care, and pre-K programs.' },
      { level: 'Your city or county', what: 'County child welfare offices, local pre-K, and school-age care.' },
    ],
    committees: ['Senate Finance', 'House Ways and Means', 'House Education and Workforce'],
    questions: [
      { q: 'Who runs foster care?', a: 'Your state, and in many states the county. Federal law sets conditions on the money, but placement decisions, caseworker standards and kinship policy are state and county decisions.' },
      { q: 'Why is child care so expensive, and who can change it?', a: 'Both levels. Congress sets the size of the federal child care block grant; your state decides subsidy rates, who qualifies, and what providers must do to be licensed.' },
    ],
  },
  education: {
    intro:
      'Schools are mostly a state and local matter. Congress funds specific programs and enforces civil rights law, but curriculum, graduation requirements, teacher licensing and most school funding are decided by your state legislature and your school board.',
    deciders: [
      { level: 'Congress', what: 'Federal student aid and loans, Title I funding, special education law, and civil rights enforcement in schools.' },
      { level: 'Your state', what: 'School funding formulas, curriculum standards, graduation requirements, teacher licensing, and charter school rules.' },
      { level: 'Your city or county', what: 'School board decisions: budgets, school calendars, closures, discipline policy, and hiring a superintendent.' },
    ],
    committees: ['Senate Health, Education, Labor and Pensions', 'House Education and Workforce'],
    questions: [
      { q: 'Who decides what my child is taught?', a: 'Your state sets standards and your local school board adopts curriculum and materials within them. Congress is explicitly barred from setting a national curriculum.' },
      { q: 'Who can do something about student loans?', a: 'Congress, and to a degree the Department of Education. Loan terms, forgiveness programs and Pell Grants are all federal.' },
    ],
  },
  housing: {
    intro:
      'Housing costs are set mostly by decisions close to home. Zoning, permitting and what can be built where are city and county choices; tenant law is largely state. Congress controls housing vouchers and the tax rules that drive construction finance.',
    deciders: [
      { level: 'Congress', what: 'Housing choice vouchers, the low-income housing tax credit, fair housing law, and federal mortgage policy.' },
      { level: 'Your state', what: 'Landlord and tenant law, eviction process, rent regulation where it exists, and statewide zoning preemption.' },
      { level: 'Your city or county', what: 'Zoning, permitting, building codes, short-term rental rules, and homelessness services.' },
    ],
    committees: ['Senate Banking, Housing and Urban Affairs', 'House Financial Services'],
    questions: [
      { q: 'Who can allow more homes to be built near me?', a: 'Almost always your city council or county commission, through zoning and permitting. Some states have begun overriding local zoning, which moves part of the decision to your legislature.' },
      { q: 'Who sets eviction rules?', a: 'Your state. Notice periods, allowable causes and court process are state law, though some cities add protections on top.' },
    ],
  },
  'jobs-and-labor': {
    intro:
      'The federal floor is set by Congress; most of what sits above it is state law. Minimum wage, paid leave and worker classification differ enormously by state because states may exceed federal standards but not fall below them.',
    deciders: [
      { level: 'Congress', what: 'Federal minimum wage, overtime rules, union organizing law, OSHA, and unemployment insurance standards.' },
      { level: 'Your state', what: 'State minimum wage, paid sick and family leave, worker classification, workers compensation, and state labor enforcement.' },
      { level: 'Your city or county', what: 'Local minimum wage and scheduling ordinances where state law permits them.' },
    ],
    committees: ['Senate Health, Education, Labor and Pensions', 'House Education and Workforce'],
    questions: [
      { q: 'Who sets the minimum wage I am paid?', a: 'Whichever is highest of the federal, state and local minimum that applies to you. Congress sets the floor; most increases in the last decade have come from states and cities.' },
      { q: 'Who decides if gig workers are employees?', a: 'Both. Federal agencies interpret it for federal law, but state tests like California’s ABC standard decide it for state wage and benefit law.' },
    ],
  },
  'money-and-the-economy': {
    intro:
      'Prices and wages respond to decisions spread across Congress, the Federal Reserve and your state. Congress writes tax and spending law and regulates banks and consumer finance; the Fed sets interest rates independently and answers to neither party.',
    deciders: [
      { level: 'Congress', what: 'Federal spending and borrowing, banking and consumer finance law, antitrust, and trade policy.' },
      { level: 'Your state', what: 'State budgets, consumer protection enforcement, insurance regulation, and business licensing.' },
      { level: 'Your city or county', what: 'Local budgets, business taxes and fees, and economic development incentives.' },
    ],
    committees: ['Senate Banking, Housing and Urban Affairs', 'Senate Finance', 'House Financial Services', 'House Ways and Means'],
    questions: [
      { q: 'Can Congress lower interest rates?', a: 'No. The Federal Reserve sets rates independently. Congress can change the law the Fed operates under and confirms its governors, but it does not set rates.' },
      { q: 'Who handles price gouging?', a: 'Mostly your state attorney general, under state law. Federal antitrust covers anticompetitive conduct rather than high prices alone.' },
    ],
  },
  taxes: {
    intro:
      'You pay several governments, and each sets its own rules. Income tax brackets and credits are federal; sales tax, most property tax and any state income tax are decided far closer to home.',
    deciders: [
      { level: 'Congress', what: 'Federal income tax rates, deductions and credits, corporate tax, and tariffs.' },
      { level: 'Your state', what: 'State income tax where one exists, sales tax rates, and state-level credits and exemptions.' },
      { level: 'Your city or county', what: 'Property tax rates and assessments, and local sales tax add-ons.' },
    ],
    committees: ['Senate Finance', 'House Ways and Means'],
    questions: [
      { q: 'Who sets my property tax?', a: 'Your county or city, through its assessor and its budget. Your state sets the rules they operate under, including any caps.' },
      { q: 'Who can change the SALT deduction cap?', a: 'Congress. It is a federal deduction, which is why states cannot fix it themselves.' },
    ],
  },
  'civil-rights-and-voting': {
    intro:
      'Elections in the United States are run by states and administered by counties. Congress can set national standards and enforce the Voting Rights Act, but registration, polling places, mail ballots and district lines are decided at the state and county level.',
    deciders: [
      { level: 'Congress', what: 'The Voting Rights Act, federal election standards, campaign finance law, and federal civil rights statutes.' },
      { level: 'Your state', what: 'Voter registration and ID rules, early and mail voting, redistricting, and ballot measure procedures.' },
      { level: 'Your city or county', what: 'Polling place locations and hours, election administration, and local ballot questions.' },
    ],
    committees: ['Senate Rules and Administration', 'Senate Judiciary', 'House Administration', 'House Judiciary'],
    questions: [
      { q: 'Who decides whether I need ID to vote?', a: 'Your state. Voter ID requirements are state law, often set by the legislature and sometimes by ballot measure.' },
      { q: 'Who draws congressional districts?', a: 'Your state, usually the legislature and in some states an independent commission. Congress sets only broad requirements.' },
    ],
  },
  'criminal-justice': {
    intro:
      'The overwhelming majority of policing and prosecution in the United States is state and local. Most criminal law is state law, most police are employed by cities and counties, and most prisoners are in state custody.',
    deciders: [
      { level: 'Congress', what: 'Federal crimes, federal sentencing, federal prisons, and grant funding that shapes state practice.' },
      { level: 'Your state', what: 'Most criminal statutes, sentencing ranges, parole, state prisons, and police certification standards.' },
      { level: 'Your city or county', what: 'Police departments and their budgets, sheriffs, jails, district attorneys, and local policing practice.' },
    ],
    committees: ['Senate Judiciary', 'House Judiciary'],
    questions: [
      { q: 'Who can change how my local police operate?', a: 'Your city council, mayor and sheriff, plus your state legislature for certification and use-of-force standards. Congress mostly influences it through funding conditions.' },
      { q: 'Who elects the prosecutor?', a: 'In most places, you do. District attorneys are usually elected at the county level.' },
    ],
  },
  guns: {
    intro:
      'Firearm law is layered. Federal law sets a baseline for dealers and prohibited purchasers; states add or subtract from there, which is why requirements differ sharply across state lines.',
    deciders: [
      { level: 'Congress', what: 'The background check system, licensed dealer rules, prohibited purchaser categories, and federal firearm classifications.' },
      { level: 'Your state', what: 'Private sale checks, permits to purchase or carry, red flag laws, waiting periods, and assault weapon rules.' },
      { level: 'Your city or county', what: 'Local ordinances where state preemption allows them, which in many states is very little.' },
    ],
    committees: ['Senate Judiciary', 'House Judiciary'],
    questions: [
      { q: 'Does a background check apply to a private sale?', a: 'It depends on your state. Federal law requires checks for sales by licensed dealers; many states extend that to private sales, and many do not.' },
      { q: 'Who can pass a red flag law?', a: 'Your state legislature. Congress has funded state programs but the orders themselves are created under state law.' },
    ],
  },
  immigration: {
    intro:
      'Immigration status is almost entirely federal. States cannot grant status or visas, but they decide a great deal about how people already here live: licenses, in-state tuition, benefits and whether local police cooperate with federal enforcement.',
    deciders: [
      { level: 'Congress', what: 'Visas, asylum, citizenship, deportation law, border policy, and enforcement funding.' },
      { level: 'Your state', what: 'Driver licenses, in-state tuition, professional licensing, and state benefit eligibility.' },
      { level: 'Your city or county', what: 'Whether local law enforcement cooperates with federal immigration detainers.' },
    ],
    committees: ['Senate Judiciary', 'House Judiciary', 'House Homeland Security'],
    questions: [
      { q: 'Can my state give someone legal status?', a: 'No. Status is federal only. States can change access to licenses, tuition and state programs, which is where most state immigration legislation sits.' },
    ],
  },
  'environment-and-energy': {
    intro:
      'Federal law sets pollution floors; states and utility regulators make most of the decisions that determine where your power comes from and what it costs. Your state public utilities commission is often the most consequential body here and the least known.',
    deciders: [
      { level: 'Congress', what: 'The Clean Air and Clean Water Acts, EPA authority, public lands, and energy tax credits.' },
      { level: 'Your state', what: 'Utility regulation and rates, renewable portfolio standards, siting of power plants and transmission, and state environmental review.' },
      { level: 'Your city or county', what: 'Local land use, building energy codes, waste and recycling, and water systems.' },
    ],
    committees: ['Senate Environment and Public Works', 'Senate Energy and Natural Resources', 'House Energy and Commerce', 'House Natural Resources'],
    questions: [
      { q: 'Who decides my electricity rate?', a: 'Your state public utilities commission, in a formal rate case. Commissioners are appointed or elected depending on the state.' },
      { q: 'Who approves a new power plant or data center?', a: 'Usually your state siting authority and your local government, not Congress.' },
    ],
  },
  technology: {
    intro:
      'There is no comprehensive federal privacy law, so states have written their own. That makes your state legislature the most active venue for privacy, artificial intelligence and online safety rules, while Congress holds platform liability and federal agency authority.',
    deciders: [
      { level: 'Congress', what: 'Section 230, federal privacy proposals, FTC authority, spectrum, and child online safety law.' },
      { level: 'Your state', what: 'Consumer privacy statutes, biometric and AI rules, age verification, and data breach notification.' },
      { level: 'Your city or county', what: 'Surveillance technology ordinances, including police use of facial recognition and automated plate readers.' },
    ],
    committees: ['Senate Commerce, Science and Transportation', 'Senate Judiciary', 'House Energy and Commerce'],
    questions: [
      { q: 'Who protects my personal data?', a: 'Mostly your state. In the absence of a federal privacy law, state statutes set what companies may collect and what rights you have.' },
      { q: 'Who decides if police can use facial recognition?', a: 'Often your city council, sometimes your state legislature. Several cities restricted it before any state did.' },
    ],
  },
  'transportation-and-infrastructure': {
    intro:
      'Congress supplies much of the money; your state and local governments decide what gets built. The federal highway and transit programs flow through state departments of transportation, which set priorities.',
    deciders: [
      { level: 'Congress', what: 'Surface transportation funding, aviation and rail policy, federal disaster response, and broadband programs.' },
      { level: 'Your state', what: 'Which projects get built, the state department of transportation budget, transit funding, and road standards.' },
      { level: 'Your city or county', what: 'Local streets, bus and rail service levels, sidewalks and bike lanes, and water and sewer systems.' },
    ],
    committees: ['Senate Commerce, Science and Transportation', 'Senate Environment and Public Works', 'House Transportation and Infrastructure'],
    questions: [
      { q: 'Who decides whether a road near me gets fixed?', a: 'Your state DOT for state highways and your city or county for local streets. Federal money funds much of it but does not pick the projects.' },
    ],
  },
  'food-and-farming': {
    intro:
      'The farm bill is the single largest vehicle here and it is federal, covering both agriculture and food assistance. States administer SNAP and run their own agriculture departments and food safety inspection.',
    deciders: [
      { level: 'Congress', what: 'The farm bill, crop insurance and subsidies, SNAP and WIC rules, and federal food safety law.' },
      { level: 'Your state', what: 'SNAP administration, state agriculture programs, food safety inspection, and cottage food and raw milk rules.' },
      { level: 'Your city or county', what: 'Restaurant inspection, farmers markets, and local food programs.' },
    ],
    committees: ['Senate Agriculture, Nutrition and Forestry', 'House Agriculture'],
    questions: [
      { q: 'Who sets SNAP benefit amounts?', a: 'Congress, through the farm bill and the Thrifty Food Plan. Your state administers the program and decides some eligibility options.' },
    ],
  },
  'veterans-and-military': {
    intro:
      'Veterans benefits and health care are federal, run through the VA. States add their own benefits on top: property tax exemptions, tuition, licensing credit for military experience and state veterans homes.',
    deciders: [
      { level: 'Congress', what: 'VA health care and benefits, disability compensation, the GI Bill, and defense authorization and spending.' },
      { level: 'Your state', what: 'State veterans homes, property tax exemptions, in-state tuition, and professional licensing credit for service.' },
      { level: 'Your city or county', what: 'Local veterans services offices and county assistance programs.' },
    ],
    committees: ['Senate Veterans Affairs', 'Senate Armed Services', 'House Veterans Affairs', 'House Armed Services'],
    questions: [
      { q: 'Who can fix a problem with my VA claim?', a: 'The VA, and your member of Congress can intervene on your behalf through casework. That is one of the most effective uses of a congressional office.' },
    ],
  },
  'foreign-policy': {
    intro:
      'This is the one area that is almost entirely federal. Treaties, sanctions, tariffs and the use of military force belong to Congress and the President; your state legislature has no role, which makes writing to the right office especially important here.',
    deciders: [
      { level: 'Congress', what: 'Treaties, sanctions, tariffs, foreign aid, war powers, and arms sales.' },
      { level: 'Your state', what: 'Very little. Some states restrict their own pension investments or procurement, which is the main state-level lever.' },
      { level: 'Your city or county', what: 'Essentially none, beyond symbolic resolutions.' },
    ],
    committees: ['Senate Foreign Relations', 'Senate Finance', 'House Foreign Affairs', 'House Ways and Means'],
    questions: [
      { q: 'Can my state legislator do anything about tariffs?', a: 'No. Tariffs are set by Congress and the President. On this subject your senators and House member are the only people to write to.' },
    ],
  },
  other: {
    intro: 'Questions that do not sit in one of the other categories.',
    deciders: [],
    questions: [],
  },
};
