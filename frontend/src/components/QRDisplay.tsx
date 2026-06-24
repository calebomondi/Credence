'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRDisplayProps {
  value: string;
  size?: number;
}

export default function QRDisplay({ value, size = 128 }: QRDisplayProps) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    const bgColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--bg-surface')
        .trim() || '#0B1B35';

    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      color: {
        dark: '#5271FF',
        light: bgColor,
      },
    })
      .then(setSrc)
      .catch(() => {});
  }, [value, size]);

  if (!src) {
    return (
      <div
        className="bg-surface rounded-lg animate-pulse"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src={src}
      alt="Verification QR code"
      width={size}
      height={size}
      className="rounded-lg"
    />
  );
}
