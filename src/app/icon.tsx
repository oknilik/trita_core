import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <svg
        width="512"
        height="512"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="baseGradient" x1="12%" y1="8%" x2="88%" y2="92%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#9333EA" />
          </linearGradient>
          <linearGradient id="shineGradient" x1="22%" y1="18%" x2="78%" y2="82%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        <polygon
          points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25"
          fill="url(#baseGradient)"
        />
        <polygon
          points="50,6 88,28 88,72 50,94 12,72 12,28"
          fill="url(#shineGradient)"
        />

        <polygon
          points="50,18 77.7,34 77.7,66 50,82 22.3,66 22.3,34"
          fill="none"
          stroke="white"
          strokeWidth="2.8"
          strokeOpacity="0.58"
        />

        <circle cx="50" cy="50" r="9.2" fill="white" />
        <circle cx="50" cy="50" r="4.6" fill="#9333EA" />
        <circle cx="50" cy="16" r="2.1" fill="white" fillOpacity="0.82" />
        <circle cx="81" cy="34.5" r="1.8" fill="white" fillOpacity="0.68" />
        <circle cx="19" cy="34.5" r="1.8" fill="white" fillOpacity="0.68" />
      </svg>
    ),
    {
      width: 512,
      height: 512,
    }
  );
}
