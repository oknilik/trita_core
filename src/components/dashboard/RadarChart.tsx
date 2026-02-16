"use client";

import { memo } from "react";
import { motion } from "framer-motion";

const CX = 150;
const CY = 150;
const MAX_R = 100;
const LABEL_R = 124;
const RINGS = [0.25, 0.5, 0.75, 1.0];

interface RadarDimension {
  code: string;
  color: string;
  score: number;
}

interface RadarChartProps {
  dimensions: RadarDimension[];
}

function getPoint(index: number, total: number, radius: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return {
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
  };
}

function polygonPoints(total: number, radius: number): string {
  return Array.from({ length: total }, (_, i) => {
    const p = getPoint(i, total, radius);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");
}

function getTextAnchor(index: number, total: number): "middle" | "start" | "end" {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  const x = Math.cos(angle);
  if (Math.abs(x) < 0.15) return "middle";
  return x > 0 ? "start" : "end";
}

function getLabelOffset(index: number, total: number): { dx: number; dy: number } {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  const x = Math.cos(angle);
  const y = Math.sin(angle);
  return {
    dx: Math.abs(x) < 0.15 ? 0 : x > 0 ? 6 : -6,
    dy: y < -0.5 ? -6 : y > 0.5 ? 8 : 0,
  };
}

export const RadarChart = memo(function RadarChart({ dimensions }: RadarChartProps) {
  const n = dimensions.length;

  const dataPoints = dimensions.map((dim, i) => ({
    ...getPoint(i, n, MAX_R * (Math.max(dim.score, 2) / 100)),
    ...dim,
  }));

  const dataPolygon = dataPoints
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <svg
      viewBox="0 0 300 300"
      className="mx-auto h-full w-full"
      role="img"
      aria-label="Radar chart"
    >
      <defs>
        <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#D946EF" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="radarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#D946EF" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
        </filter>
      </defs>

      {/* Grid rings */}
      {RINGS.map((ring) => (
        <polygon
          key={ring}
          points={polygonPoints(n, MAX_R * ring)}
          fill="none"
          stroke={ring === 1 ? "#D1D5DB" : "#E5E7EB"}
          strokeWidth={ring === 1 ? "1" : "0.5"}
          opacity="0.7"
        />
      ))}

      {/* Axis lines */}
      {dimensions.map((_, i) => {
        const p = getPoint(i, n, MAX_R);
        return (
          <line
            key={i}
            x1={CX}
            y1={CY}
            x2={p.x}
            y2={p.y}
            stroke="#E5E7EB"
            strokeWidth="0.5"
            opacity="0.7"
          />
        );
      })}

      {/* Data polygon — animated scale from center */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: `${CX}px ${CY}px` }}
      >
        <polygon
          points={dataPolygon}
          fill="url(#radarFill)"
          stroke="url(#radarStroke)"
          strokeWidth="3"
          strokeLinejoin="round"
          filter="url(#shadow)"
        />
      </motion.g>

      {/* Data point dots — staggered fade-in */}
      {dataPoints.map((p, i) => (
        <motion.g key={p.code}>
          <motion.circle
            cx={p.x}
            cy={p.y}
            r="5"
            fill={p.color}
            stroke="white"
            strokeWidth="2.5"
            filter="url(#glow)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 + i * 0.06, duration: 0.3, ease: "easeOut" }}
          />
        </motion.g>
      ))}

      {/* Dimension labels */}
      {dimensions.map((dim, i) => {
        const p = getPoint(i, n, LABEL_R);
        const offset = getLabelOffset(i, n);
        return (
          <motion.text
            key={dim.code}
            x={p.x + offset.dx}
            y={p.y + offset.dy}
            textAnchor={getTextAnchor(i, n)}
            dominantBaseline="middle"
            fill={dim.color}
            fontSize="13"
            fontWeight="700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 + i * 0.05, duration: 0.3 }}
          >
            {dim.code}
          </motion.text>
        );
      })}

      {/* Scale markers */}
      {[25, 50, 75].map((pct) => (
        <text
          key={pct}
          x={CX + 8}
          y={CY - MAX_R * (pct / 100)}
          fill="#9CA3AF"
          fontSize="8"
          dominantBaseline="middle"
          opacity="0.6"
        >
          {pct}
        </text>
      ))}
    </svg>
  );
});
