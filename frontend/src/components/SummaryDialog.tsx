import React from "react";
import { Ticket } from "../types";


interface EpicSummary {
  epicKey: string;
  epicName: string;
  totalTickets: number;
  completedTickets: number;
  inProgressTickets: number;
  blockedTickets: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  averageCycleTime: number;
  teams: string[];
  statusBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
  blockers: string[];
  criticalPath: string[];
  estimatedCompletion: string | null;
  riskLevel: "low" | "medium" | "high";
}

interface SummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  epic: { epicId: string; epicName: string; tickets: Ticket[] } | null;
  summary: EpicSummary | null;
  loading: boolean;
}

const SummaryDialog: React.FC<SummaryDialogProps> = ({
  isOpen,
  onClose,
  epic,
  summary,
  loading,
}) => {
  // Prevent body scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";

      return () => {
        document.body.style.overflow = originalStyle;
        document.body.style.position = "";
        document.body.style.width = "";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const calculateMetrics = (tickets: Ticket[]) => {
    const totalTickets = tickets.length;
    const completedTickets = tickets.filter((t) =>
      ["Released", "Accepted", "Approved", "Completed"].includes(t.status)
    ).length;
    const inProgressTickets = tickets.filter((t) =>
      ["In Progress", "QA"].includes(t.status)
    ).length;
    const blockedTickets = tickets.filter((t) => t.blockedBy.length > 0).length;
    const totalStoryPoints = Math.round(
      tickets.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
    );
    const completedStoryPoints = Math.round(
      tickets
        .filter((t) =>
          ["Released", "Accepted", "Approved", "Completed"].includes(t.status)
        )
        .reduce((sum, t) => sum + (t.storyPoints || 0), 0)
    );

    const teams = Array.from(
      new Set(
        tickets
          .map((t) => {
            if (t.team && typeof t.team === "object" && "value" in t.team) {
              return t.team.value;
            }
            if (typeof t.team === "string") {
              return t.team;
            }
            return null;
          })
          .filter((team): team is string => team !== null && team.trim() !== "")
      )
    );

    const statusBreakdown = tickets.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeBreakdown = tickets.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const blockers = tickets
      .filter((t) => t.blockedBy.length > 0)
      .map((t) => t.key);

    const completionPercentage =
      totalStoryPoints > 0
        ? Math.round((completedStoryPoints / totalStoryPoints) * 100)
        : 0;

    const riskLevel =
      blockedTickets > totalTickets * 0.3
        ? "high"
        : blockedTickets > totalTickets * 0.1
        ? "medium"
        : "low";

    return {
      totalTickets,
      completedTickets,
      inProgressTickets,
      blockedTickets,
      totalStoryPoints,
      completedStoryPoints,
      completionPercentage,
      teams,
      statusBreakdown,
      typeBreakdown,
      blockers,
      riskLevel,
    };
  };

  const metrics = epic ? calculateMetrics(epic.tickets) : null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.5)",
          zIndex: 2000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 32,
            maxWidth: "90vw",
            maxHeight: "90vh",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            minWidth: 600,
            display: "flex",
            flexDirection: "column",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
              flexShrink: 0,
            }}
          >
            <h2 style={{ margin: 0, color: "#333" }}>
              Epic Summary: {epic?.epicName || "Loading..."}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: 24,
                cursor: "pointer",
                color: "#666",
                padding: 8,
              }}
            >
              ×
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, flex: 1 }}>
              <div style={{ fontSize: 18, color: "#666" }}>
                Loading summary...
              </div>
            </div>
          ) : metrics ? (
            <div
              style={{ display: "grid", gap: 24, overflow: "auto", flex: 1 }}
            >
              {/* Progress Overview */}
              <div
                style={{
                  background: "#f8f9fa",
                  padding: 20,
                  borderRadius: 12,
                  border: "1px solid #e9ecef",
                }}
              >
                <h3 style={{ margin: "0 0 16px 0", color: "#495057" }}>
                  Progress Overview
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 16,
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: "bold",
                        color: "#007bff",
                      }}
                    >
                      {metrics.completionPercentage}%
                    </div>
                    <div style={{ fontSize: 14, color: "#6c757d" }}>
                      Complete
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: "bold",
                        color: "#28a745",
                      }}
                    >
                      {metrics.completedTickets}/{metrics.totalTickets}
                    </div>
                    <div style={{ fontSize: 14, color: "#6c757d" }}>
                      Tickets
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: "bold",
                        color: "#ffc107",
                      }}
                    >
                      {metrics.completedStoryPoints}/{metrics.totalStoryPoints}
                    </div>
                    <div style={{ fontSize: 14, color: "#6c757d" }}>
                      Story Points
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div
                style={{
                  background: "#f8f9fa",
                  padding: 20,
                  borderRadius: 12,
                  border: "1px solid #e9ecef",
                }}
              >
                <h3 style={{ margin: "0 0 16px 0", color: "#495057" }}>
                  Status Breakdown
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: 12,
                  }}
                >
                  {Object.entries(metrics.statusBreakdown).map(
                    ([status, count]) => (
                      <div
                        key={status}
                        style={{
                          background: "#fff",
                          padding: 12,
                          borderRadius: 8,
                          border: "1px solid #dee2e6",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: "bold",
                            color: "#495057",
                          }}
                        >
                          {count}
                        </div>
                        <div style={{ fontSize: 12, color: "#6c757d" }}>
                          {status}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>







              {/* Teams */}
              {metrics.teams.length > 0 && (
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: 20,
                    borderRadius: 12,
                    border: "1px solid #e9ecef",
                  }}
                >
                  <h3 style={{ margin: "0 0 16px 0", color: "#495057" }}>
                    Teams Involved
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {metrics.teams.map((team) => (
                      <span
                        key={team}
                        style={{
                          background: "#007bff",
                          color: "#fff",
                          padding: "6px 12px",
                          borderRadius: 16,
                          fontSize: 14,
                          fontWeight: "500",
                        }}
                      >
                        {team}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
              No data available
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SummaryDialog;
