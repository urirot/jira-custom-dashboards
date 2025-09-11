import React from "react";
import { Ticket } from "../types";

interface TicketBoxProps {
  ticket: Ticket;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  textColor: string;
  summaryFontSize: number;
  summaryLineHeight: number;
  summaryPadding: number;
  minBoxHeight: number;
  getJiraUrl: (key: string) => string;
  wrapText: (
    text: string,
    maxWidth: number,
    fontSize: number,
    padding: number
  ) => string[];
  isRoot?: boolean;
  // New props for linking
  linkState?: "idle" | "selected" | "targetable";
  onLinkClick?: () => void;
  isLinkLoading?: boolean;
  onDeleteAllConnections?: (ticketKey: string) => Promise<void>;
}

const TicketBox: React.FC<TicketBoxProps> = ({
  ticket,
  x,
  y,
  width,
  height,
  fillColor,
  textColor,
  summaryFontSize,
  summaryLineHeight,
  summaryPadding,
  minBoxHeight,
  getJiraUrl,
  wrapText,
  isRoot = false,
  linkState = "idle",
  onLinkClick,
  isLinkLoading = false,
  onDeleteAllConnections,
}) => {
  const summary = ticket.summary || "";
  const summaryLines = wrapText(
    summary,
    width,
    summaryFontSize,
    summaryPadding
  );
  const summaryHeight = summaryLines.length * summaryLineHeight;
  const boxHeight = Math.max(minBoxHeight + 12, 60 + summaryHeight + 40); // Reduced height for smaller design

  // Adjust box height if story points are present to ensure badge is visible
  const adjustedBoxHeight = ticket.storyPoints
    ? Math.max(boxHeight, 70)
    : boxHeight;

  // Icon color logic
  let iconColor = "#aaa";
  if (linkState === "selected") iconColor = "#e53935";
  else if (linkState === "targetable") iconColor = "#2196f3";
  else if (linkState === "idle") {
    iconColor = "#111";
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteAllConnections) onDeleteAllConnections(ticket.key);
  };

  // Icon position: bottom row, right side, inside the box
  const iconSize = 20; // Made smaller
  const iconMargin = 6;
  const iconX = x + width - iconSize - iconMargin;
  const iconY = y + adjustedBoxHeight - iconSize - iconMargin;
  // Delete icon to the left of the link icon
  const deleteIconX = iconX - iconSize - 4;

  return (
    <g>
      {/* Ticket box (not clickable) */}
      <rect
        x={x}
        y={y}
        width={width}
        height={adjustedBoxHeight}
        rx={14}
        fill={fillColor}
        stroke="#888"
        strokeWidth={2}
      />
      {/* Ticket key (header) is clickable */}
      <a
        href={getJiraUrl(ticket.key)}
        target="_blank"
        style={{ cursor: "pointer" }} rel="noreferrer"
      >
        <text
          x={x + summaryPadding}
          y={y + 24}
          fontSize={16}
          fontWeight="bold"
          fill={textColor}
        >
          {ticket.key}
        </text>
      </a>
      {/* The rest of the ticket content is not clickable */}
      {summaryLines.map((line, idx) => (
        <text
          key={idx}
          x={x + summaryPadding}
          y={y + 44 + idx * summaryLineHeight}
          fontSize={summaryFontSize}
          fill={textColor}
        >
          {line}
        </text>
      ))}
      {/* Assignee row */}
      <text
        x={x + summaryPadding}
        y={y + 44 + summaryLines.length * summaryLineHeight + 14}
        fontSize={14}
        fill={textColor}
        fontWeight="bold"
      >
        {ticket.assignee || "Unassigned"}
      </text>
      {/* Sprint status row: Always show for all ticket types (including stories), unless in a done status */}
      {["Released", "Accepted", "Approved"].includes(
        ticket.status
      ) ? null : ticket.isCurrentSprint ? (
        <g>
          {/* Background rectangle for Active Sprint */}
          <rect
            x={x + summaryPadding - 4}
            y={y + 44 + summaryLines.length * summaryLineHeight + 28 - 10}
            width={100}
            height={16}
            rx={3}
            fill="#2196f3"
            opacity={0.9}
          />
          <text
            x={x + summaryPadding}
            y={y + 44 + summaryLines.length * summaryLineHeight + 30}
            fontSize={13}
            fontWeight="bold"
            fill="#fff"
          >
            Active Sprint
          </text>
        </g>
      ) : (
        <text
          x={x + summaryPadding}
          y={y + 44 + summaryLines.length * summaryLineHeight + 30}
          fontSize={13}
          fontWeight="bold"
          fill={fillColor === "#222" ? "#fff" : isRoot ? "#fff" : "#444"}
        >
          {fillColor === "#222" ? (
            <tspan>
              <rect
                x={x + summaryPadding - 4}
                y={y + 44 + summaryLines.length * summaryLineHeight + 28 - 10}
                width={100}
                height={16}
                rx={3}
                fill="#888"
                opacity={0.9}
              />
              Not in Sprint
            </tspan>
          ) : (
            "Not in Sprint"
          )}
        </text>
      )}
      {/* Status row at the bottom */}
      <text
        x={x + summaryPadding}
        y={y + adjustedBoxHeight - 14}
        fontSize={12}
        fill={textColor}
        fontWeight="bold"
      >
        {`${ticket.type} | ${ticket.status}`}
      </text>

      {/* Story Points badge in top-right corner */}
      {ticket.storyPoints && (
        <g>
          {/* Background circle for story points */}
          <circle
            cx={x + width - 16}
            cy={y + 16}
            r={10}
            fill="#ff9800"
            opacity={0.9}
          />
          <text
            x={x + width - 16}
            y={y + 18}
            fontSize={10}
            fontWeight="bold"
            fill="#fff"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {ticket.storyPoints}
          </text>
        </g>
      )}
      {/* Delete connection icon */}
      <g style={{ cursor: "pointer" }} onClick={handleDeleteClick}>
        <svg
          x={deleteIconX}
          y={iconY}
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          style={{ pointerEvents: "all" }}
        >
          <circle
            cx={12}
            cy={12}
            r={14}
            fill="#fff"
            stroke="#eee"
            strokeWidth={1.5}
          />
          {/* Trash/Unlink icon */}
          <path
            d="M7 7l10 10M17 7L7 17"
            stroke="#e53935"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </svg>
      </g>
      {/* Link icon in bottom right, inside the box */}
      <g
        style={{ cursor: isLinkLoading ? "wait" : "pointer" }}
        onClick={isLinkLoading ? undefined : onLinkClick}
      >
        {isLinkLoading ? (
          <circle
            cx={iconX + iconSize / 2}
            cy={iconY + iconSize / 2}
            r={10}
            fill="none"
            stroke="#888"
            strokeWidth={3}
            strokeDasharray="4,2"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 0 0"
              to="360 0 0"
              dur="0.8s"
              repeatCount="indefinite"
            />
          </circle>
        ) : (
          <svg
            x={iconX}
            y={iconY}
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            style={{ pointerEvents: "all" }}
          >
            {/* White circle background for all states */}
            <circle
              cx={12}
              cy={12}
              r={14}
              fill="#fff"
              stroke="#eee"
              strokeWidth={1.5}
            />
            <path
              d="M17 7a5 5 0 0 1 0 10h-3"
              fill="none"
              stroke={iconColor}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <path
              d="M7 17a5 5 0 0 1 0-10h3"
              fill="none"
              stroke={iconColor}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <line
              x1={8}
              y1={12}
              x2={16}
              y2={12}
              stroke={iconColor}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          </svg>
        )}
      </g>
    </g>
  );
};

export default TicketBox;
