import { Check } from 'lucide-react'

interface PassportSealProps {
  size?: number;
  className?: string;
}

export default function PassportSeal({ size = 160, className = '' }: PassportSealProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      className={className}
    >
      {/* Outer ring */}
      <circle cx="100" cy="100" r="96" stroke="var(--gold)" strokeWidth="2" opacity="0.4" />
      {/* Double ring */}
      <circle cx="100" cy="100" r="88" stroke="var(--gold)" strokeWidth="1" opacity="0.3" />
      {/* Dotted ring */}
      <circle
        cx="100"
        cy="100"
        r="80"
        stroke="var(--gold)"
        strokeWidth="1"
        strokeDasharray="4 6"
        opacity="0.5"
      />
      {/* Inner border */}
      <circle cx="100" cy="100" r="72" stroke="var(--gold)" strokeWidth="1.5" opacity="0.6" />

      {/* Shield background */}
      <path
        d="M100 30l45 20v40c0 25-20 48-45 55-25-7-45-30-45-55V50l45-20z"
        fill="color-mix(in srgb, var(--gold) 10%, transparent)"
        stroke="color-mix(in srgb, var(--gold) 40%, transparent)"
        strokeWidth="1.5"
      />

      {/* ZK text */}
      <text
        x="100"
        y="82"
        textAnchor="middle"
        fill="var(--gold)"
        fontSize="32"
        fontWeight="bold"
        fontFamily="monospace"
        letterSpacing="2"
      >
        ZK
      </text>

      {/* VERIFIED arc */}
      <path
        id="top-arc"
        d="M 30 100 A 70 70 0 0 1 170 100"
        fill="none"
      />
      <text fontSize="14" fontWeight="bold" fill="var(--gold)" letterSpacing="3" opacity="0.9">
        <textPath href="#top-arc" startOffset="50%" textAnchor="middle">
          ZERO KNOWLEDGE
        </textPath>
      </text>

      {/* Bottom arc */}
      <defs>
        <clipPath id="circle-clip">
          <circle cx="99" cy="154" r="20" />
        </clipPath>
      </defs>

      <image
        href="/Icon.png"
        x="74"        
        y="130"       
        width="50"    
        height="50"
        opacity="0.85"
        clipPath="url(#circle-clip)"
      />      

      {/* Center check */}
      <path
        d="M88 105l10 10 16-20"
        stroke="#1ED760"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
