import { useId } from 'react'

/**
 * Original artwork for the floating island. Two stacked SVGs share one
 * viewBox: a static, paint-filtered base (rasterised once) and a light
 * overlay holding everything that moves.
 */
export function Island() {
  const id = useId()
  const url = (name: string) => `url(#${id}-${name})`

  return (
    <>
      <svg className="island-art" viewBox="0 0 720 480" focusable="false">
        <defs>
          <linearGradient id={`${id}-rock`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e2bd90" />
            <stop offset="0.35" stopColor="#b98492" />
            <stop offset="0.75" stopColor="#66508c" />
            <stop offset="1" stopColor="#3b3a78" />
          </linearGradient>
          <linearGradient id={`${id}-grass`} x1="0.1" y1="0" x2="0.8" y2="1">
            <stop offset="0" stopColor="#c9f078" />
            <stop offset="0.5" stopColor="#6cc763" />
            <stop offset="1" stopColor="#2f9468" />
          </linearGradient>
          <linearGradient id={`${id}-pond`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b4f6ee" />
            <stop offset="1" stopColor="#38bfd0" />
          </linearGradient>
          <linearGradient id={`${id}-roof`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ff9c82" />
            <stop offset="0.5" stopColor="#f0705f" />
            <stop offset="1" stopColor="#d9564f" />
          </linearGradient>
          <filter id={`${id}-paint`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.03"
              numOctaves="2"
              seed="7"
            />
            <feDisplacementMap in="SourceGraphic" scale="7" />
          </filter>
        </defs>

        <g filter={url('paint')}>
          {/* Rock underside */}
          <path
            d="M118 250c12 50 72 80 97 122 17 28 47 20 70 48 20 26 55 50 83 42 24-7 32-44 62-58 32-16 50-6 75-44 25-38 85-60 99-110z"
            fill={url('rock')}
          />
          <path
            d="M140 262c20 38 60 60 82 94l28-56-50-30z"
            fill="#ffe6bd"
            opacity="0.4"
          />
          <path
            d="M250 300l50-16 30 76-40 50-68-54z"
            fill="#d8a2a8"
            opacity="0.3"
          />
          <path
            d="M420 290l176-28c-16 48-76 68-96 100-20 30-45 30-68 40z"
            fill="#2e2a68"
            opacity="0.32"
          />
          <path
            d="M330 360l102 42c-30 18-38 50-64 60-26 6-60-16-78-52z"
            fill="#2b2a63"
            opacity="0.3"
          />
          <path
            d="M222 372c18 26 44 22 66 48 18 24 50 46 78 42"
            fill="none"
            stroke="#93f1ee"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path
            d="M176 300c40 14 70 16 110 10M330 318c40 10 90 8 140-6M300 372c30 8 60 8 96 0"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.16"
          />

          {/* Hanging vines */}
          <path
            d="M178 276c-2 20 6 30 2 48M214 282c2 16-4 26 0 38M452 286c-2 18 6 26 2 44M560 272c2 16-6 24-2 40"
            fill="none"
            stroke="#3c9a63"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Grass top */}
          <path
            d="M104 248c16-26 66-34 101-42 30-26 80-30 113-6 62-10 152-4 222 14 45 8 75 22 76 38-16 20-96 32-176 34-110 4-240 0-300-14-22-6-36-14-36-24z"
            fill={url('grass')}
          />
          <path
            d="M140 270c24 12 22 22 40 12 12 14 26 14 36 2 16 16 40 14 52 0 20 14 44 12 58-2 22 14 50 12 66-2 18 12 40 10 52-2 20 10 44 6 58-8 16 8 34 2 44-10"
            fill="none"
            stroke="#2b8a63"
            strokeWidth="9"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M150 232c30-14 60-18 78-22 22-18 50-20 72-10"
            fill="none"
            stroke="#e9fb9c"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M330 206c60-6 130-2 190 12"
            fill="none"
            stroke="#d6f58c"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* Sandy path from the shop door */}
          <path
            d="M386 246c-6 10-34 10-52 18-16 8-22 16-40 18l30 2c20-4 30-12 46-18 14-6 30-8 36-20z"
            fill="#f6e6ba"
            opacity="0.9"
          />

          {/* Pond and the stream that feeds the waterfall */}
          <ellipse cx="478" cy="254" rx="46" ry="12" fill={url('pond')} />
          <path
            d="M494 262c6 6 4 14 2 22h26c0-10-2-18-8-24z"
            fill="#7fe3e6"
          />
          <path
            d="M448 252h26M486 258h20"
            stroke="#fff"
            strokeWidth="2.500"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Tree trunks */}
          <path
            d="M228 216c4-18 2-38 0-58h12c0 20 0 40 6 58z"
            fill="#8a5a48"
          />
          <path d="M238 158c2 20 2 40 8 58h-6c-4-18-4-38-4-58z" fill="#5f3d42" />
          <path d="M542 228c3-12 2-28 1-42h9c0 14 0 30 4 42z" fill="#8a5a48" />
          <path d="M436 232c2-8 2-18 1-26h7c0 8 0 18 3 26z" fill="#7a5046" />
        </g>

        {/* Tiny shop */}
        <ellipse cx="374" cy="250" rx="46" ry="7" fill="#1f6b55" opacity="0.35" />
        <rect x="338" y="196" width="72" height="54" rx="6" fill="#fff3dc" />
        <path d="M392 196h12a6 6 0 0 1 6 6v42a6 6 0 0 1-6 6h-12z" fill="#efd6b6" />
        <path
          d="M330 200l44-40 44 40z"
          fill={url('roof')}
          stroke={url('roof')}
          strokeWidth="8"
          strokeLinejoin="round"
        />
        <circle cx="374" cy="186" r="9" fill="#fff3dc" />
        <path
          d="M374 180c.8 3.600 2.400 5.200 6 6-3.600.8-5.200 2.400-6 6-.8-3.600-2.400-5.200-6-6 3.600-.8 5.200-2.400 6-6z"
          fill="#ffb92e"
        />
        <rect x="345" y="222" width="28" height="18" rx="3" fill="#ffd978" />
        <path d="M359 222v18M345 231h28" stroke="#f3b85a" strokeWidth="1.500" />
        <path d="M342 212h34v8a4.250 4.250 0 0 1-8.500 0 4.250 4.250 0 0 1-8.500 0 4.250 4.250 0 0 1-8.500 0 4.250 4.250 0 0 1-8.500 0z" fill="#fff" />
        <path d="M350.500 212h8.500v8a4.250 4.250 0 0 1-8.500 0zM367.500 212h8.500v8a4.250 4.250 0 0 1-8.500 0z" fill="#f0705f" />
        <path d="M384 250v-23a9 9 0 0 1 18 0v23z" fill="#259c9f" />
        <circle cx="397.500" cy="236" r="1.800" fill="#ffe08a" />
        <path d="M374 160v-24" stroke="#7a5046" strokeWidth="2.500" strokeLinecap="round" />
      </svg>

      <svg className="island-art island-art--live" viewBox="0 0 720 480" focusable="false">
        <defs>
          <linearGradient id={`${id}-fall`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f0ffff" stopOpacity="0.95" />
            <stop offset="0.55" stopColor="#a6eef2" stopOpacity="0.75" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.6" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask id={`${id}-fallmask`}>
            <rect x="480" y="276" width="60" height="180" fill={url('fade')} />
          </mask>
          <radialGradient id={`${id}-mist`}>
            <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-glow`}>
            <stop offset="0" stopColor="#ffe9a3" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffe9a3" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Waterfall */}
        <path
          d="M496 282c-2 50 2 110-6 168h36c-6-58-4-118-5-168z"
          fill={url('fall')}
        />
        <g
          className="fall-lines"
          mask={url('fallmask')}
          fill="none"
          stroke="#fff"
          strokeWidth="2.200"
          strokeLinecap="round"
        >
          <path d="M501 284c-1 50 1 104-3 160" />
          <path d="M509 284c0 50 0 104 0 160" />
          <path d="M516 284c1 50 1 104 4 160" />
        </g>
        <ellipse className="mist" cx="508" cy="448" rx="46" ry="16" fill={url('mist')} />

        {/* Warm window light */}
        <circle className="window-glow" cx="359" cy="231" r="26" fill={url('glow')} />

        {/* Flag */}
        <g className="sway sway--flag" style={{ transformOrigin: '374px 138px' }}>
          <path d="M375 137c8-3 14 3 22 0v13c-8 3-14-3-22 0z" fill="#ffc83d" />
        </g>

        {/* Tree behind the shop */}
        <g className="sway sway--c" style={{ transformOrigin: '440px 232px' }}>
          <circle cx="440" cy="198" r="20" fill="#2f9468" />
          <circle cx="434" cy="192" r="14" fill="#55bd6c" />
          <circle cx="430" cy="187" r="7" fill="#a5e67f" />
        </g>

        {/* Big tree on the hill */}
        <g className="sway sway--a" style={{ transformOrigin: '236px 214px' }}>
          <circle cx="262" cy="166" r="27" fill="#2c8a66" />
          <circle cx="206" cy="168" r="25" fill="#2f9468" />
          <circle cx="234" cy="150" r="36" fill="#43ad6a" />
          <circle cx="238" cy="124" r="23" fill="#55bd6c" />
          <circle cx="216" cy="146" r="20" fill="#72d06f" />
          <circle cx="226" cy="122" r="13" fill="#a5e67f" />
          <circle cx="204" cy="158" r="9" fill="#a5e67f" opacity="0.8" />
          <circle cx="222" cy="114" r="5" fill="#e3f9a0" />
          <circle cx="252" cy="140" r="6" fill="#8fdc78" opacity="0.8" />
        </g>

        {/* Blossom tree */}
        <g className="sway sway--b" style={{ transformOrigin: '547px 228px' }}>
          <circle cx="566" cy="180" r="19" fill="#e87fa6" />
          <circle cx="530" cy="182" r="18" fill="#f08fb2" />
          <circle cx="548" cy="166" r="26" fill="#ffabc6" />
          <circle cx="540" cy="158" r="15" fill="#ffc9da" />
          <circle cx="534" cy="152" r="7" fill="#fff0f5" />
          <circle cx="560" cy="172" r="5" fill="#ffe0ea" />
        </g>

        {/* Bushes and flowers */}
        <g>
          <circle cx="150" cy="248" r="13" fill="#2f9468" />
          <circle cx="164" cy="252" r="10" fill="#43ad6a" />
          <circle cx="146" cy="243" r="6" fill="#8fdc78" />
          <circle cx="584" cy="246" r="12" fill="#2f9468" />
          <circle cx="572" cy="250" r="9" fill="#55bd6c" />
          <circle cx="302" cy="268" r="10" fill="#43ad6a" />
          <circle cx="298" cy="264" r="5" fill="#a5e67f" />
        </g>
        <g>
          <circle cx="262" cy="244" r="3" fill="#fff" />
          <circle cx="276" cy="258" r="2.500" fill="#ffe08a" />
          <circle cx="420" cy="266" r="3" fill="#ffc9da" />
          <circle cx="446" cy="274" r="2.500" fill="#fff" />
          <circle cx="188" cy="240" r="2.500" fill="#ffe08a" />
          <circle cx="536" cy="252" r="3" fill="#fff" />
          <circle cx="330" cy="236" r="2.500" fill="#ffc9da" />
        </g>

        {/* Loose rocks drifting beside the island */}
        <g className="pebble pebble--a">
          <path d="M112 362c4 14 12 26 22 28 8-2 14-14 16-28z" fill="#8f6c90" />
          <path d="M108 362c4-8 16-10 22-10s18 2 22 10c-8 6-36 6-44 0z" fill="#7fd06a" />
        </g>
        <g className="pebble pebble--b">
          <path d="M586 376c3 10 8 18 15 20 6-2 10-10 12-20z" fill="#5f4c88" />
          <path d="M583 376c3-6 12-8 16-8s13 2 16 8c-6 4-26 4-32 0z" fill="#58b86a" />
        </g>
        <g className="pebble pebble--c">
          <path d="M262 448c2 7 5 12 9 13 4-1 7-6 8-13z" fill="#4f4682" />
        </g>
      </svg>
    </>
  )
}
