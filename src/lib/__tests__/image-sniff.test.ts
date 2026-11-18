import { describe, it, expect } from 'vitest';
import { sniffImage } from '../image-sniff';

const bytes = (...n: number[]) => new Uint8Array(n);
const ascii = (s: string) => new Uint8Array([...s].map((c) => c.charCodeAt(0)));

describe('sniffImage', () => {
  it('recognises the three formats the uploader accepts', () => {
    expect(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2))).toBe('png');
    expect(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0))).toBe('jpg');
    const webp = new Uint8Array(16);
    webp.set(ascii('RIFF'), 0);
    webp.set(ascii('WEBP'), 8);
    expect(sniffImage(webp)).toBe('webp');
  });

  it('rejects HTML dressed as an image, which is the whole point', () => {
    expect(sniffImage(ascii('<html><script>alert(1)</script>'))).toBeNull();
  });

  it('rejects SVG, which no signature can make safe', () => {
    expect(sniffImage(ascii('<svg xmlns="http://www.w3.org/2000/svg">'))).toBeNull();
  });

  it('rejects a RIFF container that is not WEBP', () => {
    const wav = new Uint8Array(16);
    wav.set(ascii('RIFF'), 0);
    wav.set(ascii('WAVE'), 8);
    expect(sniffImage(wav)).toBeNull();
  });

  it('does not read past the end of a short file', () => {
    expect(sniffImage(bytes(0x89, 0x50))).toBeNull();
    expect(sniffImage(new Uint8Array())).toBeNull();
  });
});
