import React, { useRef, useState, useCallback } from "react";
import { D3EpicDiagram } from "./D3EpicDiagram";
import Loader from "./components/Loader";
import FloatingScrollbar from "./components/FloatingScrollbar";
import SummaryDialog from "./components/SummaryDialog";
import { Ticket } from "./types";

interface EpicData {
  epicId: string;
  epicName: string;
  tickets: Ticket[];
}

interface DiagramProps {
  epic: EpicData | null;
  selectedEpic: { key: string; name: string } | null;
  loading: boolean;
  refreshEpic: () => void;
  diagramRendered: number;
  setDiagramRendered: React.Dispatch<React.SetStateAction<number>>;
}

const Diagram: React.FC<DiagramProps> = ({
  epic,
  selectedEpic,
  loading,
  refreshEpic,
  diagramRendered,
  setDiagramRendered,
}) => {
  const ticketsToShow: Ticket[] = epic?.tickets || [];
  const backlogTickets: Ticket[] = [];
  const diagramScrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);

  // Summary dialog state
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  // Mouse event handlers for drag-to-scroll
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (diagramScrollRef.current) {
      isDragging.current = true;
      dragStartX.current = e.clientX;
      scrollStartX.current = diagramScrollRef.current.scrollLeft;
      document.body.style.cursor = "grabbing";
    }
  };
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging.current && diagramScrollRef.current) {
      const dx = e.clientX - dragStartX.current;
      diagramScrollRef.current.scrollLeft = scrollStartX.current - dx;
    }
  }, []);
  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = "";
  }, []);

  React.useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // Handle summary button click
  const handleSummaryClick = () => {
    setIsSummaryOpen(true);
    setSummaryLoading(true);
    setSummaryData(null);

    // For now, we'll use the local calculation from the SummaryDialog component
    // In the future, this could call the backend API
    setTimeout(() => {
      setSummaryLoading(false);
    }, 500);
  };

  return (
    <>
      {loading && <Loader />}
      {epic && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
              gap: 24,
            }}
          >
            <h2 style={{ margin: 0 }}>
              <a
                href={`https://taranis.atlassian.net/browse/${epic.epicId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#1976d2",
                  textDecoration: "underline",
                  fontWeight: 600,
                }}
              >
                {selectedEpic
                  ? `${selectedEpic.name} (${epic.epicId})`
                  : epic.epicName}
              </a>
            </h2>
            <button
              onClick={handleSummaryClick}
              style={{
                background: "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "12px 24px",
                fontSize: 16,
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 2px 4px rgba(0,123,255,0.2)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#0056b3";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 8px rgba(0,123,255,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#007bff";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 2px 4px rgba(0,123,255,0.2)";
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              Summary
            </button>
          </div>
          {/* Spacer to prevent content from being hidden under sticky bottom scroll */}
          <div style={{ height: 40 }} />
          <div
            className="diagram-scroll-container"
            ref={diagramScrollRef}
            style={{
              maxWidth: "100vw",
              width: "100%",
              overflowX: "auto",
              overflowY: "hidden",
              cursor: isDragging.current ? "grabbing" : "grab",
            }}
            onMouseDown={onMouseDown}
          >
            <div
              id="diagram-placeholder"
              style={{
                width: "fit-content",
                minHeight: 600,
                border: "1px solid #ccc",
                position: "relative",
                background: "#fff",
              }}
            >
              <D3EpicDiagram
                tickets={ticketsToShow}
                onRefresh={refreshEpic}
                onRendered={() =>
                  setTimeout(() => setDiagramRendered((v) => v + 1), 50)
                }
              />
            </div>
          </div>
          <FloatingScrollbar
            scrollContainer={diagramScrollRef}
            key={`${epic.epicId || "none"}-${
              ticketsToShow.length
            }-${diagramRendered}`}
          />
          {backlogTickets.length > 0 && (
            <div
              style={{
                marginTop: 40,
                padding: 24,
                background: "#f3f3f7",
                borderRadius: 12,
              }}
            >
              <h3 style={{ marginBottom: 16 }}>Backlog</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
                {backlogTickets.map((ticket) => (
                  <div
                    key={ticket.key}
                    style={{
                      width: 260,
                      minHeight: 110,
                      background: "#f5f5fa",
                      border: "1.5px solid #bbb",
                      borderRadius: 14,
                      padding: 16,
                      boxSizing: "border-box",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <a
                      href={`https://taranis.atlassian.net/browse/${ticket.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        textDecoration: "none",
                        color: "#222",
                        fontWeight: "bold",
                        fontSize: 18,
                      }}
                    >
                      {ticket.key}
                    </a>
                    <div
                      style={{ margin: "8px 0", color: "#333", fontSize: 15 }}
                    >
                      {ticket.summary}
                    </div>
                    <div style={{ color: "#555", fontSize: 13 }}>
                      {ticket.type} | {ticket.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Summary Dialog */}
      <SummaryDialog
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        epic={epic}
        summary={summaryData}
        loading={summaryLoading}
      />
    </>
  );
};

export default Diagram;
