import React from "react";

interface ArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke?: string;
  strokeWidth?: number;
  markerEndId?: string;
}

const Arrow: React.FC<ArrowProps> = ({
  x1,
  y1,
  x2,
  y2,
  stroke = "#333",
  strokeWidth = 1.5,
  markerEndId = "arrow",
}) => (
  <line
    x1={x1}
    y1={y1}
    x2={x2}
    y2={y2}
    stroke={stroke}
    strokeWidth={strokeWidth}
    markerEnd={`url(#${markerEndId})`}
    pointerEvents="none"
  />
);

export default Arrow;
