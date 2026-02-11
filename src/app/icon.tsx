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
          <linearGradient id="warmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>

        <polygon
          points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25"
          fill="url(#warmGradient)"
          opacity="0.95"
        />

        <line x1="50" y1="10" x2="50" y2="90" stroke="white" strokeWidth="1.6" opacity="0.45" />
        <line x1="15" y1="30" x2="85" y2="70" stroke="white" strokeWidth="1.6" opacity="0.45" />
        <line x1="15" y1="70" x2="85" y2="30" stroke="white" strokeWidth="1.6" opacity="0.45" />

        <circle cx="50" cy="50" r="9" fill="white" />
      </svg>
    ),
    {
      width: 512,
      height: 512,
    }
  );
}
