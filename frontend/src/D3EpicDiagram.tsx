import React, { useState } from "react";
import { D3EpicDiagramProps } from "./types";
import { getJiraUrl, getTextColor, wrapText } from "./utils/d3Utils";
import TicketBox from "./components/TicketBox";
import FrameBox from "./components/FrameBox";
import Arrow from "./components/Arrow";
import {
  BOX_WIDTH,
  DIAGRAM_PADDING,
  SUMMARY_FONT_SIZE,
  SUMMARY_LINE_HEIGHT,
  SUMMARY_PADDING,
  MIN_BOX_HEIGHT,
} from "./constants";
import { computeDiagramLayout } from "./layoutUtils";
import { useLinkIssue } from "./utils/useLinkIssue";
import axios from "axios";

export const D3EpicDiagram: React.FC<
  D3EpicDiagramProps & { onRendered?: () => void }
> = ({ tickets, onRefresh, onRendered }) => {
  // Use the new layout utility
  const layout = computeDiagramLayout(tickets);
  const {
    positions,
    ticketHeights,
    frameBoundingBoxes,
    frameRoots,
    diagramWidth,
    diagramHeight,
  } = layout;

  // Linking logic
  const {
    linkingState,
    selectedSource,
    selectSource,
    selectTarget,
    resetLinking,
  } = useLinkIssue({ onSuccess: onRefresh });

  // Get selected ticket info for instruction text
  const selectedTicket = selectedSource
    ? tickets.find((t) => t.key === selectedSource)
    : null;

  // Handler to delete all connections for a ticket
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDeleteAllConnections = async (ticketKey: string) => {
    setConfirmDeleteKey(ticketKey);
  };
  const handleConfirmDelete = async () => {
    if (!confirmDeleteKey) return;
    setIsDeleting(true);
    await axios.post("http://localhost:4000/api/delete-all-links", {
      key: confirmDeleteKey,
    });
    setIsDeleting(false);
    setConfirmDeleteKey(null);
    if (onRefresh) onRefresh();
  };
  const handleCancelDelete = () => setConfirmDeleteKey(null);

  // Draw tickets
  const ticketElements: React.ReactNode[] = [];
  tickets.forEach((ticket) => {
    const pos = positions[ticket.key];
    if (!pos) return;
    const isRoot = frameRoots.has(ticket.key);
    let fillColor = "#fff";
    let textColor = getTextColor(ticket);

    // Released should be original green with white text
    if (ticket.status === "Released") {
      fillColor = "#4caf50";
      textColor = "#fff";
    }
    // Accepted, Approved, Completed should be light green with dark text
    else if (["Accepted", "Approved", "Completed"].includes(ticket.status)) {
      fillColor = "#b6e8c9";
      textColor = "#222";
    }
    // In Progress and QA tickets should be light gray
    else if (["In Progress", "QA"].includes(ticket.status)) {
      fillColor = "#e0e0e0";
      textColor = "#333";
    }
    // Stories should have black background with white text (when not done, not in progress, not QA, not completed)
    else if (ticket.type === "Story") {
      fillColor = "#222";
      textColor = "#fff";
    }
    // Tasks and other types: white background (when not done, not in progress, not QA, not completed)
    else {
      fillColor = "#fff";
      textColor = getTextColor(ticket);
    }

    // Linking icon state logic
    let linkState: "idle" | "selected" | "targetable" = "idle";
    let isLinkLoading = false;
    let onLinkClick: (() => void) | undefined = undefined;
    if (linkingState === "idle") {
      linkState = "idle";
      onLinkClick = () => selectSource(ticket.key);
    } else if (linkingState === "selecting") {
      if (selectedSource === ticket.key) {
        linkState = "selected";
        onLinkClick = resetLinking; // Clicking red icon resets to idle
      } else {
        linkState = "targetable";
        onLinkClick = () => selectTarget(ticket.key);
      }
    } else if (linkingState === "loading") {
      if (selectedSource === ticket.key) {
        linkState = "selected";
        isLinkLoading = true;
        onLinkClick = undefined; // Prevent click during loading
      } else {
        linkState = "idle";
        onLinkClick = undefined;
      }
    }

    ticketElements.push(
      <TicketBox
        key={ticket.key}
        ticket={ticket}
        x={pos.x}
        y={pos.y}
        width={BOX_WIDTH}
        height={ticketHeights[ticket.key]}
        fillColor={fillColor}
        textColor={textColor}
        summaryFontSize={SUMMARY_FONT_SIZE}
        summaryLineHeight={SUMMARY_LINE_HEIGHT}
        summaryPadding={SUMMARY_PADDING}
        minBoxHeight={MIN_BOX_HEIGHT}
        getJiraUrl={getJiraUrl}
        wrapText={wrapText}
        isRoot={isRoot}
        linkState={linkState}
        onLinkClick={onLinkClick}
        isLinkLoading={isLinkLoading}
        onDeleteAllConnections={() => handleDeleteAllConnections(ticket.key)}
      />
    );
  });

  // Draw frames using bounding boxes
  const frameElements: React.ReactNode[] = [];
  const frameBuffer = 25;
  frameBoundingBoxes.forEach((box, idx) => {
    frameElements.push(
      <FrameBox
        key={`frame-${idx}`}
        x={box.minX}
        y={box.minY - frameBuffer}
        width={box.maxX - box.minX + frameBuffer}
        height={box.maxY - box.minY + frameBuffer}
      />
    );
  });

  // Draw arrows for real blocks/blockedBy relationships
  const arrowElements: React.ReactNode[] = [];
  tickets.forEach((ticket) => {
    ticket.blocks.forEach((blockedKey) => {
      if (!positions[ticket.key] || !positions[blockedKey]) return;
      const sourceX = positions[ticket.key].x + BOX_WIDTH / 2;
      const sourceY = positions[ticket.key].y; // Start at bottom of the source ticket
      const targetX = positions[blockedKey].x + BOX_WIDTH / 2;
      const targetY = positions[blockedKey].y + ticketHeights[blockedKey] + 20; // End at top of the target ticket
      arrowElements.push(
        <Arrow
          key={`${ticket.key}->${blockedKey}`}
          x1={sourceX}
          y1={sourceY}
          x2={targetX}
          y2={targetY}
          strokeWidth={1}
        />
      );
    });
  });

  // Arrow marker definition
  const markerDefs = (
    <defs>
      <marker
        id="arrow"
        viewBox="0 0 10 10"
        refX={9}
        refY={5}
        markerWidth={12}
        markerHeight={12}
        orient="auto"
      >
        <path
          d="M 0 0 L 10 5 L 0 10 z"
          fill="#333"
          stroke="#333"
          strokeWidth={1}
        />
      </marker>
    </defs>
  );

  // Draw placeholder rectangle behind everything
  const placeholderRect = (
    <rect
      x={DIAGRAM_PADDING}
      y={DIAGRAM_PADDING}
      width={diagramWidth - DIAGRAM_PADDING}
      height={diagramHeight - DIAGRAM_PADDING}
      fill="#f8fafd"
      stroke="#e0e4ea"
      strokeWidth={2}
    />
  );

  // Call onRendered after layout and render
  React.useEffect(() => {
    if (onRendered) onRendered();
    // Only call when tickets or layout changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets]);

  return (
    <div
      style={{
        width: "100%",
        background: "#f8fafd",
        padding: 48,
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* Floating instruction text */}
      {linkingState === "selecting" && selectedTicket && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#2196f3",
            color: "white",
            padding: "20px 32px",
            borderRadius: "12px",
            fontSize: "24px",
            fontWeight: "bold",
            boxShadow: "0 4px 12px rgba(33, 150, 243, 0.3)",
            zIndex: 1000,
            textAlign: "center",
            maxWidth: "80%",
          }}
        >
          Choose a ticket to be blocked by {selectedTicket.key} -{" "}
          {selectedTicket.summary}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDeleteKey && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.32)",
              zIndex: 2001,
              pointerEvents: "auto",
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#fff",
              border: "2px solid #e53935",
              borderRadius: 16,
              padding: 32,
              boxShadow: "0 8px 32px rgba(229,57,53,0.18)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              zIndex: 2002,
              minWidth: 320,
              maxWidth: "90vw",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: "#e53935",
                fontSize: 20,
                marginBottom: 18,
              }}
            >
              Remove all connections from {confirmDeleteKey}?
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  background: "#e53935",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 28px",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: isDeleting ? "wait" : "pointer",
                }}
              >
                {isDeleting ? "Removing..." : "Yes, Remove"}
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                style={{
                  background: "#fff",
                  color: "#333",
                  border: "1.5px solid #bbb",
                  borderRadius: 8,
                  padding: "10px 28px",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: isDeleting ? "wait" : "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      <svg
        width={diagramWidth}
        height={diagramHeight}
        style={{ display: "block", margin: "0 auto" }}
      >
        {markerDefs}
        {placeholderRect}
        {frameElements}
        {arrowElements}
        {ticketElements}
      </svg>
    </div>
  );
};
