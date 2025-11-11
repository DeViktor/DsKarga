import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 280 60"
      width="150"
      height="35"
      {...props}
    >
      <style>{`
        .logo-text { font-family: 'Poppins', sans-serif; font-weight: bold; fill: #1E293B; }
        .logo-text-sistem { fill: #4A5568; }
        .logo-subtext { font-family: 'PT Sans', sans-serif; font-weight: bold; fill: #F24423; font-size: 10px; }
      `}</style>
      <g>
        <path
          d="M38.6,26.5c0-6.1-4.9-11-11-11H12.1c-2.3,0-4.2,1.9-4.2,4.2v9.5c0,2.3,1.9,4.2,4.2,4.2h9.5l7,7V35.9 C36.2,34.1,38.6,30.6,38.6,26.5z"
          fill="#F24423"
        />
        <path d="M18,22l6,4.5l-6,4.5V22z" fill="#FFF" />
        <text
          x="50"
          y="35"
          className="logo-text"
          fontSize="28"
        >
          DS KARGA 
          <tspan className="logo-text-sistem">SISTEM</tspan>
        </text>
      </g>
    </svg>
  );
}
