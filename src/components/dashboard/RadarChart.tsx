"use client";

import { memo, useId } from "react";
import { motion } from "framer-motion";

const CX = 150;
const CY = 150;
const MAX_R = 100;
const LABEL_R = 114;
const RINGS = [0.25, 0.5, 0.75, 1.0];
const OBSERVER_POINT_COLOR = "#10B981";

interface RadarDimension {
  code: string;
  color: string;
  score: number;
  observerScore?: number;
}

interface RadarChartProps {
  dimensions: RadarDimension[];
  showObserver?: boolean;
  selfLabel?: string;
  observerLabel?: string;
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
    dx: Math.abs(x) < 0.2 ? 0 : x > 0 ? 5 : -5,
    dy: y < -0.55 ? -4 : y > 0.55 ? 5 : 0,
  };
}

export const RadarChart = memo(function RadarChart({
  dimensions,
  showObserver = false,
  selfLabel = "Saját",
  observerLabel = "Meghívottak",
}: RadarChartProps) {
  const uid = useId();
  const n = dimensions.length;
  const radarFillId = `radar-fill-${uid}`;
  const radarStrokeId = `radar-stroke-${uid}`;
  const radarGlowFillId = `radar-glow-fill-${uid}`;
  const observerFillId = `observer-fill-${uid}`;
  const observerStrokeId = `observer-stroke-${uid}`;
  const gridFillId = `grid-fill-${uid}`;
  const gridStrokeId = `grid-stroke-${uid}`;
  const auraId = `aura-${uid}`;
  const surfaceId = `surface-${uid}`;
  const glowId = `glow-${uid}`;
  const pointGlowId = `point-glow-${uid}`;
  const shadowId = `shadow-${uid}`;
  const labelShadowId = `label-shadow-${uid}`;

  const dataPoints = dimensions.map((dim, i) => ({
    ...getPoint(i, n, MAX_R * (Math.max(dim.score, 2) / 100)),
    ...dim,
  }));

  const dataPolygon = dataPoints
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  // Observer average polygon
  const observerPoints = showObserver
    ? dimensions.map((dim, i) => ({
        ...getPoint(i, n, MAX_R * (Math.max(dim.observerScore ?? 0, 2) / 100)),
        ...dim,
      }))
    : [];

  const observerPolygon = observerPoints
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <svg
      viewBox="0 0 300 300"
      preserveAspectRatio="xMidYMid meet"
      className="mx-auto h-full w-full overflow-visible"
      role="img"
      aria-label="Radar chart"
    >
      <defs>
        <radialGradient id={auraId} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#EEF2FF" stopOpacity="0.95" />
          <stop offset="75%" stopColor="#EDE9FE" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>

        <radialGradient id={surfaceId} cx="50%" cy="45%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#EEF2FF" stopOpacity="0.5" />
        </radialGradient>

        <linearGradient id={gridFillId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EEF2FF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#F5F3FF" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id={gridStrokeId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C7D2FE" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#DDD6FE" stopOpacity="0.75" />
        </linearGradient>

        <linearGradient id={radarGlowFillId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#D946EF" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id={radarFillId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.32" />
          <stop offset="55%" stopColor="#8B5CF6" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#D946EF" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id={radarStrokeId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#D946EF" />
        </linearGradient>

        <linearGradient id={observerFillId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.14" />
        </linearGradient>
        <linearGradient id={observerStrokeId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>

        <filter id={glowId}>
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id={pointGlowId}>
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id={shadowId}>
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.25"/>
        </filter>
        <filter id={labelShadowId}>
          <feDropShadow dx="0" dy="1" stdDeviation="1.15" floodColor="#FFFFFF" floodOpacity="0.9" />
        </filter>
      </defs>

      <circle cx={CX} cy={CY} r={MAX_R + 20} fill={`url(#${auraId})`} />
      <circle
        cx={CX}
        cy={CY}
        r={MAX_R + 4}
        fill={`url(#${surfaceId})`}
        opacity="0.9"
      />

      {/* Grid rings */}
      {RINGS.map((ring, idx) => (
        <motion.polygon
          key={ring}
          points={polygonPoints(n, MAX_R * ring)}
          fill={ring < 1 ? `url(#${gridFillId})` : "none"}
          stroke={`url(#${gridStrokeId})`}
          strokeWidth={ring === 1 ? "1.5" : "1"}
          strokeDasharray={ring === 1 ? undefined : "4 5"}
          opacity={ring === 1 ? "0.85" : `${0.4 - idx * 0.05}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: ring === 1 ? 0.85 : 0.4 - idx * 0.05 }}
          transition={{ delay: idx * 0.1, duration: 0.6 }}
        />
      ))}

      {/* Axis lines */}
      {dimensions.map((dim, i) => {
        const p = getPoint(i, n, MAX_R);
        return (
          <g key={i}>
            <motion.line
              x1={CX}
              y1={CY}
              x2={p.x}
              y2={p.y}
              stroke="#A5B4FC"
              strokeWidth="1"
              strokeDasharray="2 5"
              opacity="0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.4 }}
            />
            <motion.circle
              cx={p.x}
              cy={p.y}
              r="2.2"
              fill={dim.color}
              opacity="0.8"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.8 }}
              transition={{ delay: 0.42 + i * 0.05, duration: 0.25 }}
            />
          </g>
        );
      })}

      {/* Self-assessment polygon */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: `${CX}px ${CY}px` }}
      >
        <polygon
          points={dataPolygon}
          fill={`url(#${radarGlowFillId})`}
          stroke="none"
          filter={`url(#${glowId})`}
        />
        <polygon
          points={dataPolygon}
          fill={`url(#${radarFillId})`}
          stroke={`url(#${radarStrokeId})`}
          strokeWidth="3.5"
          strokeLinejoin="round"
          filter={`url(#${shadowId})`}
        />
      </motion.g>

      {/* Observer average polygon */}
      {showObserver && observerPolygon && (
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        >
          <polygon
            points={observerPolygon}
            fill={`url(#${observerFillId})`}
            stroke={`url(#${observerStrokeId})`}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeDasharray="7 5"
            filter={`url(#${shadowId})`}
          />
        </motion.g>
      )}

      {/* Self-assessment data points */}
      {dataPoints.map((p, i) => (
        <motion.g key={`self-${p.code}`}>
          <motion.circle
            cx={p.x}
            cy={p.y}
            r="8.5"
            fill={p.color}
            opacity="0.22"
            filter={`url(#${pointGlowId})`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.22 }}
            transition={{ delay: 0.55 + i * 0.06, duration: 0.35, ease: "easeOut" }}
          />
          <motion.circle
            cx={p.x}
            cy={p.y}
            r="6.2"
            fill={p.color}
            stroke="white"
            strokeWidth="2.4"
            filter={`url(#${pointGlowId})`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 + i * 0.06, duration: 0.4, ease: "easeOut" }}
          />
          <motion.circle
            cx={p.x}
            cy={p.y}
            r="2.1"
            fill="#FFFFFF"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.68 + i * 0.06, duration: 0.3, ease: "easeOut" }}
          />
        </motion.g>
      ))}

      {/* Observer data points */}
      {showObserver && observerPoints.map((p, i) => (
        <motion.g key={`observer-${p.code}`}>
          <motion.circle
            cx={p.x}
            cy={p.y}
            r="4.8"
            fill={OBSERVER_POINT_COLOR}
            stroke="white"
            strokeWidth="2"
            filter={`url(#${pointGlowId})`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8 + i * 0.06, duration: 0.4, ease: "easeOut" }}
          />
        </motion.g>
      ))}

      {/* Dimension labels */}
      {dimensions.map((dim, i) => {
        const p = getPoint(i, n, LABEL_R);
        const offset = getLabelOffset(i, n);
        return (
          <g key={dim.code}>
            <motion.text
              x={p.x + offset.dx}
              y={p.y + offset.dy}
              textAnchor={getTextAnchor(i, n)}
              dominantBaseline="middle"
              fill={dim.color}
              fontSize="13"
              fontWeight="700"
              stroke="rgba(255, 255, 255, 0.95)"
              strokeWidth="2.25"
              paintOrder="stroke"
              letterSpacing="0.2px"
              filter={`url(#${labelShadowId})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.05, duration: 0.4 }}
            >
              {dim.code}
            </motion.text>
          </g>
        );
      })}

      {/* Scale markers */}
      {[25, 50, 75].map((pct) => (
        <g key={pct}>
          <line
            x1={CX - 5}
            x2={CX + 5}
            y1={CY - MAX_R * (pct / 100)}
            y2={CY - MAX_R * (pct / 100)}
            stroke="#94A3B8"
            strokeWidth="1"
            opacity="0.6"
          />
          <text
            x={CX + 10}
            y={CY - MAX_R * (pct / 100)}
            fill="#94A3B8"
            fontSize="8"
            dominantBaseline="middle"
            opacity="0.75"
          >
            {pct}
          </text>
        </g>
      ))}

      {/* Legend */}
      {showObserver && (
        <motion.g
          transform={`translate(${CX}, ${CY + MAX_R + 44})`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          {/* Legend background */}
          <rect
            x="-92"
            y="-13"
            width="204"
            height="26"
            rx="13"
            fill="#FFFFFF"
            opacity="0.88"
            stroke="#E0E7FF"
            strokeWidth="1"
            filter={`url(#${shadowId})`}
          />

          {/* Self indicator */}
          <circle cx="-49" cy="0" r="5" fill={SELF_POINT_COLOR} filter={`url(#${pointGlowId})`} />
          <text x="-40" y="0" fill="#475569" fontSize="11" fontWeight="600" dominantBaseline="middle">{selfLabel}</text>

          {/* Observer indicator */}
          <circle cx="28" cy="0" r="5" fill={OBSERVER_POINT_COLOR} filter={`url(#${pointGlowId})`} />
          <text x="37" y="0" fill="#475569" fontSize="11" fontWeight="600" dominantBaseline="middle">{observerLabel}</text>
        </motion.g>
      )}
    </svg>
  );
});
