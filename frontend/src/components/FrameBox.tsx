import React from "react";

interface FrameBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

const FrameBox: React.FC<FrameBoxProps> = ({
  x,
  y,
  width,
  height,
  rx = 14,
  stroke = "#888",
  strokeWidth = 1.5,
  strokeDasharray = "5,5",
}) => (
  <rect
    x={x}
    y={y}
    width={width}
    height={height}
    rx={rx}
    fill="none"
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeDasharray={strokeDasharray}
  />
);

export default FrameBox;
