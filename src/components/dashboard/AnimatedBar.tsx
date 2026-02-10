"use client";

import { motion } from "framer-motion";

interface AnimatedBarProps {
  value: number;
  color: string;
  height?: string;
  delay?: number;
}

export function AnimatedBar({
  value,
  color,
  height = "h-2",
  delay = 0,
}: AnimatedBarProps) {
  return (
    <div className={`${height} w-full overflow-hidden rounded-full bg-gray-100`}>
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        whileInView={{ width: `${value}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut", delay }}
        style={{ backgroundColor: color }}
      />
    </div>
  );
}
