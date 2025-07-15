import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./App.css";
import { D3EpicDiagram } from "./D3EpicDiagram";
import { Ticket } from "./types";
import Loader from "./components/Loader";
import Select, { SingleValue, components, StylesConfig } from "react-select";
import FloatingScrollbar from "./components/FloatingScrollbar";

interface EpicData {
  epicId: string;
  epicName: string;
  tickets: Ticket[];
}

interface EpicSummary {
  key: string;
  name: string;
}

function App() {
  const [epics, setEpics] = useState<EpicSummary[]>([]);
  const [selectedEpic, setSelectedEpic] = useState<EpicSummary | null>(null);
  const [epic, setEpic] = useState<EpicData | null>(null);
  const [loading, setLoading] = useState(false);
  // Remove the search state and input
  type EpicOption = { value: string; label: string; epic: EpicSummary };
  let ticketsToShow: Ticket[] = epic?.tickets || [];
  let backlogTickets: Ticket[] = [];
  const diagramScrollRef = React.useRef<HTMLDivElement>(null);
  const isDragging = React.useRef(false);
  const dragStartX = React.useRef(0);
  const scrollStartX = React.useRef(0);

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

  useEffect(() => {
    axios
      .get("http://localhost:4000/api/epics")
      .then((res) => setEpics(res.data))
      .catch(() => setEpics([]));
  }, []);

  const refreshEpic = useCallback(() => {
    if (!selectedEpic) return;
    setLoading(true);
    axios
      .get(`http://localhost:4000/api/epic/${selectedEpic.key}`)
      .then((res) => {
        setEpic(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedEpic]);

  useEffect(() => {
    if (!selectedEpic) return;
    refreshEpic();
  }, [selectedEpic, refreshEpic]);

  useEffect(() => {
    // On mount, check for epic in URL
    const params = new URLSearchParams(window.location.search);
    const epicKey = params.get("epic");
    if (epicKey && epics.length > 0) {
      const epic = epics.find((e) => e.key === epicKey);
      if (epic) {
        setSelectedEpic(epic);
        setEpic(null);
      }
    }
  }, [epics]);

  return (
    <div className="App">
      <h1 style={{ textAlign: "center", marginBottom: 32 }}>
        Jira Epic Flow Diagram
      </h1>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 16,
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <label
          htmlFor="epic-select"
          style={{ marginRight: 8, fontWeight: 500, fontSize: 16 }}
        >
          Choose an Epic:
        </label>
        <div style={{ minWidth: 260, width: 320 }}>
          <Select
            inputId="epic-select"
            options={epics.map((epic) => ({
              value: epic.key,
              label: `${epic.name} (${epic.key})`,
              epic,
            }))}
            value={
              selectedEpic
                ? {
                    value: selectedEpic.key,
                    label: `${selectedEpic.name} (${selectedEpic.key})`,
                    epic: selectedEpic,
                  }
                : null
            }
            onChange={(option: SingleValue<EpicOption>) => {
              const epic = option?.epic || null;
              setSelectedEpic(epic);
              setEpic(null);
              // Update URL
              const params = new URLSearchParams(window.location.search);
              if (epic) {
                params.set("epic", epic.key);
              } else {
                params.delete("epic");
              }
              window.history.replaceState(
                {},
                "",
                `${window.location.pathname}?${params.toString()}`
              );
            }}
            isClearable
            placeholder="Search or select epic..."
            styles={
              {
                control: (base: React.CSSProperties) => ({
                  ...base,
                  padding: 2,
                  borderRadius: 8,
                  borderColor: "#b3d8f7",
                  background: "#f8fafd",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#1a6b8f",
                  boxShadow: "0 1px 4px rgba(26, 107, 143, 0.07)",
                  minHeight: 44,
                  cursor: "pointer",
                }),
                menu: (base: React.CSSProperties) => ({
                  ...base,
                  zIndex: 9999,
                }),
              } as StylesConfig<EpicOption, false>
            }
            filterOption={(option, input) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
          />
        </div>
      </div>
      {loading && <Loader />}
      {epic && (
        <>
          <h2 style={{ textAlign: "center" }}>
            {selectedEpic || epic ? (
              <a
                href={`https://taranis.atlassian.net/browse/${
                  selectedEpic ? selectedEpic.key : epic.epicId
                }`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#1976d2",
                  textDecoration: "underline",
                  fontWeight: 600,
                }}
              >
                {selectedEpic
                  ? `${selectedEpic.name} (${selectedEpic.key})`
                  : `${epic.epicName} (${epic.epicId})`}
              </a>
            ) : null}
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
              <D3EpicDiagram tickets={ticketsToShow} onRefresh={refreshEpic} />
            </div>
          </div>
          <FloatingScrollbar scrollContainer={diagramScrollRef} />
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
      {!loading && selectedEpic && !epic && <p>Failed to load Epic data.</p>}
    </div>
  );
}

export default App;
