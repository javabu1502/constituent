import { describe, it, expect } from 'vitest';
import { draftProblems, draftWordBudget, draftWordFloor } from '../story-draft-check';

describe('draftProblems (a story may only contain what the teller wrote)', () => {
  const teller = 'Rent went from $1,375 to $1,640 in 2025. I work 34 hours. We have 2 kids.';
  it('passes a draft whose numbers all come from the teller', () => {
    expect(draftProblems('My rent went from $1,375 to $1,640 in 2025 while I work 34 hours a week for my 2 kids.', teller, 60)).toEqual([]);
  });
  it('flags invented numbers, overlong drafts, and dashes', () => {
    const p = draftProblems('My rent jumped $412 a month, about 30 percent, and my 3 kids felt it — hard.', teller, 20);
    expect(p.join(' ')).toMatch(/never wrote: 412, 30, 3/);
    expect(p.join(' ')).toMatch(/dashes/);
    expect(draftProblems(new Array(80).fill('word').join(' '), teller, 40).join(' ')).toMatch(/too long/);
  });
  it('word floor is at least 150, 1.8x the teller when higher, capped 400', () => {
    expect(draftWordFloor(40)).toBe(150);
    expect(draftWordFloor(100)).toBe(180);
    expect(draftWordFloor(1000)).toBe(400);
  });
  it('flags a draft that is too short for its floor', () => {
    const short = 'I work two jobs. I do not see my kids enough.';
    expect(draftProblems(short, short, null, 150).some((p) => p.startsWith('too short'))).toBe(true);
    expect(draftProblems(short, short, null, null)).toEqual([]);
  });
  it('word budget is 2.5x the teller, clamped 120 to 700 (room to develop, 10-02)', () => {
    expect(draftWordBudget(10)).toBe(120);
    expect(draftWordBudget(100)).toBe(250);
    expect(draftWordBudget(1000)).toBe(700);
  });
});

// ----- 10-23 audit: number words, Spanish family words, new proper nouns -----
import { draftProblemDetails, familyWordMismatches, newProperNouns, numbersIn, tellerNotes } from '../story-draft-check';

describe('numbersIn (number words match digits)', () => {
  it('reads digits, English and Spanish number words, and compounds', () => {
    expect([...numbersIn('I pay $1,375. We have three kids and twenty-five chickens.')]).toEqual(['1375', '25', '3']);
    expect([...numbersIn('Tengo dos hijos y treinta y cinco años.')]).toEqual(['35', '2']);
  });
  it('leaves "one", "a", "un" and "una" alone', () => {
    expect(numbersIn('One day a friend came. Un día una amiga vino.').size).toBe(0);
  });
  it('"three" in the teller matches "3" in the draft, and the reverse', () => {
    expect(draftProblems('My 3 kids wait with me.', 'I have three kids.', null)).toEqual([]);
    expect(draftProblems('My three kids wait with me.', 'I have 3 kids.', null)).toEqual([]);
    expect(draftProblems('My four kids wait with me.', 'I have 3 kids.', null).join(' ')).toMatch(/never wrote: 4/);
  });
});

describe('familyWordMismatches (Spanish gender and number stay as given)', () => {
  it('passes when the draft uses exactly the forms the teller used', () => {
    expect(familyWordMismatches('Mi hija espera conmigo.', 'Mi hija va a la escuela.')).toEqual([]);
  });
  it('flags a gendered family word the teller never used', () => {
    expect(familyWordMismatches('Mi hijo espera conmigo.', 'Mi familia espera.')[0]).toMatch(/^hijo \(the storyteller never used it\)/);
  });
  it('flags a gender flip and a number flip', () => {
    expect(familyWordMismatches('Mi hijo espera conmigo.', 'Mi hija va a la escuela.')[0]).toMatch(/hijo .*gender changed/);
    expect(familyWordMismatches('Mis hijas esperan conmigo.', 'Mi hija va a la escuela.')[0]).toMatch(/hijas .*number changed/);
    expect(familyWordMismatches('Mi abuela y mis niños.', 'Mi abuelo y mi niña.')).toHaveLength(2);
  });
  it('is reported as a draft problem', () => {
    const p = draftProblems('Mi hijo espera conmigo.', 'Mi hija va a la escuela.', null);
    expect(p.join(' ')).toMatch(/family words that do not match/);
  });
});

describe('newProperNouns (no names or places the teller never wrote)', () => {
  const teller = 'I live in reno. My daughter goes to Sparks High. We get WIC.';
  it('passes words the teller wrote, sentence starts, quoted starts, I, and the allowlist', () => {
    const draft = 'Reno is home. My daughter goes to Sparks High and we rely on WIC and Medicaid. She said "Nobody listens." I told her Nevada would. Head Start helped.';
    expect(newProperNouns(draft, teller)).toEqual([]);
  });
  it('flags a new name, a new place, and a new month', () => {
    expect(newProperNouns('My daughter Maria rides to Carson City every March.', teller)).toEqual(['Maria', 'Carson', 'City', 'March']);
  });
  it('accepts the organization name and campaign headline through the allowlist', () => {
    expect(newProperNouns("The Children's Cabinet helped us.", teller, ["Children's Cabinet"])).toEqual([]);
  });
  it("treats the teller's word with a possessive or plural as theirs", () => {
    expect(newProperNouns("Sparks's schools are full. The Sparks families know.", teller)).toEqual([]);
  });
  it('never flags a capitalized pronoun or article after a colon or a missed break', () => {
    expect(newProperNouns('Here is the thing: My daughter waits and We wait. Yo espero y Mi hija también', teller)).toEqual([]);
  });
  it('is a corrective-retry problem, not a refusal', () => {
    const p = draftProblemDetails('My daughter Maria waits.', teller, null, null);
    expect(p.map((x) => x.code)).toEqual(['names']);
    expect(p[0].message).toMatch(/names or places the storyteller never wrote: Maria/);
  });
});

describe('tellerNotes (what the storyteller is told when a problem survives the retry)', () => {
  it('writes a note per content problem in the campaign language and skips length and dashes', () => {
    const problems = draftProblemDetails('Mi hijo Mateo paga 500 cada día — sí.', 'Mi hija paga 300.', 5, null);
    const codes = problems.map((p) => p.code);
    expect(codes).toEqual(expect.arrayContaining(['numbers', 'dashes', 'frequency', 'gender', 'names']));
    const en = tellerNotes(problems, 'en');
    const es = tellerNotes(problems, 'es');
    expect(en).toHaveLength(4);
    expect(en.join(' ')).toMatch(/Check these numbers; you did not write them in the interview: 500/);
    expect(en.join(' ')).not.toMatch(/dash|too long/);
    expect(es.join(' ')).toMatch(/Revise estos números; usted no los escribió en la entrevista: 500/);
    expect(es.join(' ')).toMatch(/Revise estos nombres o lugares; usted no los mencionó: Mateo/);
    expect([...en, ...es].join(' ')).not.toMatch(/[—–]/);
  });
});
