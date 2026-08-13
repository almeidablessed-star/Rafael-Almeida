import React from 'react';

interface CarulaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const CarulaLogo: React.FC<CarulaLogoProps> = ({
  size = 'md',
  className = '',
}) => {
  // Height options for responsive scaling
  const heightClasses = {
    sm: 'h-9 sm:h-11',
    md: 'h-14 sm:h-18',
    lg: 'h-20 sm:h-28',
  };

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 380 200"
        className={`${heightClasses[size]} w-auto drop-shadow-sm transition-transform active:scale-95`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="sticker-drop-shadow" x="-10%" y="-10%" width="125%" height="125%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#2B2420" floodOpacity="0.15" />
          </filter>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Shrikhand&family=Fredoka:wght@700;800&family=Montserrat:wght@900&display=swap');
            
            .logo-script-back {
              font-family: 'Shrikhand', cursive, sans-serif;
              font-size: 78px;
              fill: #E82C1B;
            }
            .logo-script-front {
              font-family: 'Shrikhand', cursive, sans-serif;
              font-size: 78px;
              fill: #FFFDF9;
              stroke: #E82C1B;
              stroke-width: 5px;
              stroke-linejoin: round;
              paint-order: stroke fill;
            }
            .logo-confeitaria {
              font-family: 'Montserrat', sans-serif;
              font-weight: 900;
              font-size: 13px;
              fill: #E82C1B;
              letter-spacing: 1.8px;
            }
            .logo-estd {
              font-family: 'Fredoka', sans-serif;
              font-weight: 800;
              font-size: 11px;
              fill: #2B2420;
              letter-spacing: 1.5px;
            }
          `}</style>
        </defs>

        {/* WHITE DIE-CUT STICKER BACKGROUND */}
        <g filter="url(#sticker-drop-shadow)">
          <path
            d="M 50 40 
               C 30 40, 15 55, 15 75 
               C 15 95, 25 110, 40 120 
               C 30 135, 35 160, 55 170 
               C 70 180, 120 180, 150 178 
               C 165 190, 185 195, 225 195 
               C 265 195, 285 188, 305 175 
               C 335 175, 365 155, 365 125 
               C 365 100, 350 80, 330 70 
               C 340 50, 325 25, 295 20 
               C 270 15, 235 25, 215 30 
               C 190 20, 145 15, 110 20 
               C 85 20, 60 28, 50 40 Z"
            fill="var(--color-card)"
            stroke="var(--color-card)"
            strokeWidth="16"
            strokeLinejoin="round"
          />
        </g>

        {/* 3D RED EXTENSION SHADOW LAYER */}
        <g transform="translate(4, 6)">
          <text x="35" y="85" className="logo-script-back">
            Carula
          </text>
          <text x="95" y="152" className="logo-script-back">
            Cake
          </text>
        </g>

        {/* MAIN TEXT AND GRAPHIC DETAILS */}
        <g>
          {/* "Carula" Text */}
          <text x="35" y="85" className="logo-script-front">
            Carula
          </text>

          {/* Sparkle / Four-pointed star top right */}
          <path
            d="M 312 28 L 316 38 L 326 42 L 316 46 L 312 56 L 308 46 L 298 42 L 308 38 Z"
            fill="#E82C1B"
          />

          {/* "Cake" Text */}
          <text x="95" y="152" className="logo-script-front">
            Cake
          </text>

          {/* CONFEITARIA Curved Along the Right of "Cake" */}
          <path id="arcConfeitaria" d="M 270 102 A 38 38 0 0 1 315 158" fill="none" />
          <text className="logo-confeitaria">
            <textPath href="#arcConfeitaria" startOffset="0%">
              CONFEITARIA
            </textPath>
          </text>

          {/* ESTD. 2024 Pill Tag at Bottom */}
          <rect
            x="155"
            y="166"
            width="100"
            height="20"
            rx="10"
            fill="var(--color-card)"
            stroke="#2B2420"
            strokeWidth="1.5"
          />
          <text x="205" y="180" textAnchor="middle" className="logo-estd">
            ESTD.2024
          </text>
        </g>
      </svg>
    </div>
  );
};
