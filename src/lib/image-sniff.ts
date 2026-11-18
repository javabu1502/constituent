/**
 * What an uploaded file actually is, read from its first bytes.
 *
 * The logo upload trusted `File.type`, which is whatever the browser was
 * told, so "image/png" was a claim and not a fact. The blast radius was
 * small: the file is served from Supabase's origin with the type we stored
 * and behind nosniff, so a disguised HTML payload does not execute and it
 * would not be on our origin if it did. It is still a one-line claim
 * standing where a check belongs.
 *
 * Only the three formats the uploader accepts. SVG is absent on purpose:
 * it is XML, it can carry script, and no signature would make it safe.
 */
export type SniffedImage = 'png' | 'jpg' | 'webp';

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPG = [0xff, 0xd8, 0xff];

function startsWith(bytes: Uint8Array, sig: number[]): boolean {
  if (bytes.length < sig.length) return false;
  return sig.every((b, i) => bytes[i] === b);
}

export function sniffImage(bytes: Uint8Array): SniffedImage | null {
  if (startsWith(bytes, PNG)) return 'png';
  if (startsWith(bytes, JPG)) return 'jpg';
  // WEBP is a RIFF container: "RIFF", four bytes of length, then "WEBP".
  if (bytes.length >= 12) {
    const tag = (at: number, s: string) =>
      [...s].every((c, i) => bytes[at + i] === c.charCodeAt(0));
    if (tag(0, 'RIFF') && tag(8, 'WEBP')) return 'webp';
  }
  return null;
}

export const SNIFFED_CONTENT_TYPE: Record<SniffedImage, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
};
