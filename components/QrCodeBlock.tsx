"use client";

import QRCode from "react-qr-code";

interface QrCodeBlockProps {
  value: string;
  caption?: string;
  size?: number;
}

export function QrCodeBlock({ value, caption, size = 168 }: QrCodeBlockProps) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 p-4">
      {caption ? (
        <p className="text-xs font-semibold text-stone-500 text-center leading-snug max-w-[240px]">
          {caption}
        </p>
      ) : null}
      <div className="rounded-lg bg-white p-2 border border-stone-200 shadow-sm">
        <QRCode
          value={value}
          size={size}
          level="M"
          bgColor="#ffffff"
          fgColor="#0c0a09"
        />
      </div>
    </div>
  );
}
