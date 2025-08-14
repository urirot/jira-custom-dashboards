import React from "react";

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  title: string;
  width?: number;
  height?: number;
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  width = 200,
  height = 200,
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0 || data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#333" }}>
          {title}
        </h3>
        <div style={{ color: "#666", fontSize: "14px" }}>No data available</div>
      </div>
    );
  }

  let currentAngle = 0;
  const radius = Math.min(width, height) / 2 - 20;
  const centerX = width / 2;
  const centerY = height / 2;

  const paths = data.map((item, index) => {
    const percentage = item.value / total;
    const startAngle = currentAngle;
    const endAngle = currentAngle + percentage * 2 * Math.PI;

    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    const largeArcFlag = percentage > 0.5 ? 1 : 0;

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ");

    currentAngle = endAngle;

    return { pathData, color: item.color, label: item.label, percentage };
  });

  return (
    <div style={{ textAlign: "center" }}>
      <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", color: "#333" }}>
        {title}
      </h3>
      <svg width={width} height={height} style={{ margin: "0 auto" }}>
        {paths.map((path, index) => (
          <path
            key={index}
            d={path.pathData}
            fill={path.color}
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
      </svg>
      <div style={{ marginTop: "15px" }}>
        {data.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
              fontSize: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: item.color,
                  borderRadius: "2px",
                }}
              />
              <span style={{ color: "#333" }}>{item.label}</span>
            </div>
            <span style={{ color: "#666", fontWeight: "500" }}>
              {Math.round((item.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieChart;
