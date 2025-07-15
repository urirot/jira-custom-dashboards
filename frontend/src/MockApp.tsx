import React, { useEffect, useState } from "react";
import mockData from "./mockData.json";
import { D3EpicDiagram } from "./D3EpicDiagram";
import Loader from "./components/Loader";
import Select, { SingleValue, StylesConfig } from "react-select";
import { Ticket } from "./types";

interface EpicData {
  epicId: string;
  epicName: string;
  tickets: Ticket[];
}

interface EpicSummary {
  key: string;
  name: string;
}

type EpicOption = { value: string; label: string; epic: EpicSummary };

function MockApp() {
  const [epics, setEpics] = useState<EpicSummary[]>([]);
  const [selectedEpic, setSelectedEpic] = useState<EpicSummary | null>(null);
  const [epic, setEpic] = useState<EpicData | null>(null);
  const [loading, setLoading] = useState(false);

  let ticketsToShow: Ticket[] = epic?.tickets || [];
  let backlogTickets: Ticket[] = [];

  useEffect(() => {
    setEpics(mockData.epics);
  }, []);

  useEffect(() => {
    if (!selectedEpic) return;
    setLoading(true);
    setTimeout(() => {
      setEpic(
        (mockData.epicData as Record<string, EpicData>)[selectedEpic.key] ||
          null
      );
      setLoading(false);
    }, 300); // Simulate network delay
  }, [selectedEpic]);

  return (
    <div className="App">
      <h1 style={{ textAlign: "center", marginBottom: 32 }}>
        Jira Epic Flow Diagram (Mock)
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
          <h2>
            {selectedEpic
              ? `${selectedEpic.name} (${selectedEpic.key})`
              : `${epic.epicName} (${epic.epicId})`}
          </h2>
          <div
            id="diagram-placeholder"
            style={{ width: "100%", minHeight: 600, border: "1px solid #ccc" }}
          >
            <D3EpicDiagram tickets={ticketsToShow} onRefresh={() => {}} />
          </div>
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

export default MockApp;
 