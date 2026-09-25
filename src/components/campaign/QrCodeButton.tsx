'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// Dashboard action: a printable QR code for the campaign link, for flyers,
// posters, and tabling. Scans land on the campaign page tagged
// utm_source=qr so scan-driven actions show up in analytics.
export function QrCodeButton({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  // Origin resolved at click time (client-only) so preview deploys encode
  // themselves, same as the embed snippet.
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.mydemocracy.app';
  const url = `${origin}/campaign/${slug}?utm_source=qr`;

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(url, { width: 1024, margin: 2, errorCorrectionLevel: 'M' })
      .then(setDataUrl)
      .catch((err) => {
        console.error('QR generation failed:', err);
        setDataUrl(null);
      });
  }, [open, url]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors"
      >
        QR
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Campaign QR code"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Campaign QR code</h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Put this on flyers, posters, or slides. Scans open the campaign page, and actions from
              scans show up in your analytics.
            </p>

            <div className="flex justify-center mb-4">
              {dataUrl ? (
                <img src={dataUrl} alt={`QR code linking to the campaign page for ${slug}`} className="w-56 h-56 rounded-lg border border-gray-200 dark:border-gray-600 bg-white p-2" />
              ) : (
                <div className="w-56 h-56 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-sm text-gray-400">
                  Generating…
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 break-all text-center mb-4">{url}</p>

            <a
              href={dataUrl ?? undefined}
              download={`${slug}-qr.png`}
              aria-disabled={!dataUrl}
              className={`block w-full text-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                dataUrl
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 pointer-events-none'
              }`}
            >
              Download PNG
            </a>
          </div>
        </div>
      )}
    </>
  );
}
