import React, { useRef } from "react";
import { D3EpicDiagram } from "./D3EpicDiagram";
import Loader from "./components/Loader";
import FloatingScrollbar from "./components/FloatingScrollbar";
import { Ticket } from "./types";

interface EpicData {
  epicId: string;
  epicName: string;
  tickets: Ticket[];
}

interface DiagramProps {
  epic: EpicData | null;
  loading: boolean;
  refreshEpic: () => void;
  diagramRendered: number;
  setDiagramRendered: React.Dispatch<React.SetStateAction<number>>;
}

const Diagram: React.FC<DiagramProps> = ({
  epic,
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

  // Mouse event handlers for drag-to-scroll
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (diagramScrollRef.current) {
      isDragging.current = true;
      dragStartX.current = e.clientX;
      scrollStartX.current = diagramScrollRef.current.scrollLeft;
      document.body.style.cursor = "grabbing";
    }
  };
  const onMouseMove = (e: MouseEvent) => {
    if (isDragging.current && diagramScrollRef.current) {
      const dx = e.clientX - dragStartX.current;
      diagramScrollRef.current.scrollLeft = scrollStartX.current - dx;
    }
  };
  const onMouseUp = () => {
    isDragging.current = false;
    document.body.style.cursor = "";
  };

  React.useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <>
      {loading && <Loader />}
      {epic && (
        <>
          <h2 style={{ textAlign: "center" }}>
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
              {`${epic.epicName} (${epic.epicId})`}
            </a>
          </h2>
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
    </>
  );
};

export default Diagram;
