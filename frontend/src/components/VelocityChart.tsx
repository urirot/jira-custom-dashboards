import React from "react";

interface VelocityData {
  sprint: string;
  velocity: number;
  date: string;
}

interface VelocityChartProps {
  data: VelocityData[];
  title: string;
  width?: number;
  height?: number;
}

const VelocityChart: React.FC<VelocityChartProps> = ({
  data,
  title,
  width = 400,
  height = 200,
}) => {
  if (data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#333" }}>
          {title}
        </h3>
        <div style={{ color: "#666", fontSize: "14px" }}>
          No velocity data available
        </div>
      </div>
    );
  }

  const maxVelocity = Math.max(...data.map((d) => d.velocity));
  const minVelocity = Math.min(...data.map((d) => d.velocity));
  const range = maxVelocity - minVelocity || 1; // Prevent division by zero
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((item, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const y =
      height - padding - ((item.velocity - minVelocity) / range) * chartHeight;
    return { x, y, velocity: item.velocity, sprint: item.sprint };
  });

  const pathData = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      return `L ${point.x} ${point.y}`;
    })
    .join(" ");

  return (
    <div style={{ textAlign: "center" }}>
      <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", color: "#333" }}>
        {title}
      </h3>
      <svg width={width} height={height} style={{ margin: "0 auto" }}>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => {
          const y = height - padding - (i / 4) * chartHeight;
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#e0e0e0"
              strokeWidth="1"
            />
          );
        })}

        {/* Velocity line */}
        <path
          d={pathData}
          fill="none"
          stroke="#34495e"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill="#34495e"
              stroke="#fff"
              strokeWidth="2"
            />
            <text
              x={point.x}
              y={point.y - 10}
              textAnchor="middle"
              fontSize="12"
              fill="#666"
            >
              {point.velocity}
            </text>
            <text
              x={point.x}
              y={height - 5}
              textAnchor="middle"
              fontSize="11"
              fill="#666"
            >
              {point.sprint}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div style={{ marginTop: "15px", fontSize: "14px", color: "#666" }}>
        <div>
          Average Velocity:{" "}
          {Math.round(
            data.reduce((sum, d) => sum + d.velocity, 0) / data.length
          )}
        </div>
        <div>
          Trend:{" "}
          {data[data.length - 1].velocity > data[0].velocity
            ? "↗️ Increasing"
            : data[data.length - 1].velocity < data[0].velocity
            ? "↘️ Decreasing"
            : "→ Stable"}
        </div>
      </div>
    </div>
  );
};

export default VelocityChart;
