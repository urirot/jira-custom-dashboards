import React from "react";
import { Ticket } from "../types";
import {
  calculateEstimationPerformance,
  EstimationPerformance,
} from "../utils/d3Utils";

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

    // Calculate estimation performance
    const estimationPerformance = calculateEstimationPerformance(tickets);

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
      estimationPerformance,
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

              {/* Key Metrics */}
              <div
                style={{
                  background: "#f8f9fa",
                  padding: 20,
                  borderRadius: 12,
                  border: "1px solid #e9ecef",
                }}
              >
                <h3 style={{ margin: "0 0 16px 0", color: "#495057" }}>
                  Key Metrics
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      background: "#fff",
                      padding: 16,
                      borderRadius: 8,
                      border: "1px solid #dee2e6",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        color: "#6c757d",
                        marginBottom: 4,
                      }}
                    >
                      In Progress
                    </div>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: "bold",
                        color: "#007bff",
                      }}
                    >
                      {metrics.inProgressTickets}
                    </div>
                  </div>
                </div>
              </div>

              {/* Estimation vs Performance */}
              {metrics.estimationPerformance.ticketPerformance.length > 0 && (
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: 20,
                    borderRadius: 12,
                    border: "1px solid #e9ecef",
                  }}
                >
                  <h3 style={{ margin: "0 0 16px 0", color: "#495057" }}>
                    Estimation vs Performance
                  </h3>

                  {/* Performance Overview */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 16,
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: 32,
                          fontWeight: "bold",
                          color: "#28a745",
                        }}
                      >
                        {metrics.estimationPerformance.onTimePercentage}%
                      </div>
                      <div style={{ fontSize: 14, color: "#6c757d" }}>
                        On Time
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: 32,
                          fontWeight: "bold",
                          color: "#dc3545",
                        }}
                      >
                        {metrics.estimationPerformance.overTimePercentage}%
                      </div>
                      <div style={{ fontSize: 14, color: "#6c757d" }}>
                        Over Time
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: 32,
                          fontWeight: "bold",
                          color: "#007bff",
                        }}
                      >
                        {metrics.estimationPerformance.efficiencyPercentage}%
                      </div>
                      <div style={{ fontSize: 14, color: "#6c757d" }}>
                        Efficiency
                      </div>
                    </div>
                  </div>

                  {/* Time Summary */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 16,
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        background: "#fff",
                        padding: 16,
                        borderRadius: 8,
                        border: "1px solid #dee2e6",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          color: "#6c757d",
                          marginBottom: 4,
                        }}
                      >
                        Estimated Days
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: "bold",
                          color: "#495057",
                        }}
                      >
                        {metrics.estimationPerformance.totalEstimatedDays}
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#fff",
                        padding: 16,
                        borderRadius: 8,
                        border: "1px solid #dee2e6",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          color: "#6c757d",
                          marginBottom: 4,
                        }}
                      >
                        Actual Days
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: "bold",
                          color: "#495057",
                        }}
                      >
                        {metrics.estimationPerformance.totalActualDays}
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#fff",
                        padding: 16,
                        borderRadius: 8,
                        border: "1px solid #dee2e6",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          color: "#6c757d",
                          marginBottom: 4,
                        }}
                      >
                        Variance
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: "bold",
                          color:
                            metrics.estimationPerformance.totalActualDays <=
                            metrics.estimationPerformance.totalEstimatedDays
                              ? "#28a745"
                              : "#dc3545",
                        }}
                      >
                        {Math.round(
                          ((metrics.estimationPerformance.totalActualDays -
                            metrics.estimationPerformance.totalEstimatedDays) /
                            metrics.estimationPerformance.totalEstimatedDays) *
                            100
                        )}
                        %
                      </div>
                    </div>
                  </div>

                  {/* Ticket Performance Details */}
                  <div>
                    <h4 style={{ margin: "0 0 12px 0", color: "#495057" }}>
                      Ticket Performance Details
                    </h4>
                    <div
                      style={{
                        maxHeight: 250,
                        overflowY: "auto",
                        border: "1px solid #dee2e6",
                        borderRadius: 8,
                        padding: "8px",
                        backgroundColor: "#f8f9fa",
                      }}
                    >
                      {/* Header Row */}
                      <div
                        style={{
                          background: "#f8f9fa",
                          padding: "8px 12px",
                          borderRadius: 6,
                          marginBottom: 8,
                          display: "grid",
                          gridTemplateColumns: "1fr auto auto auto auto",
                          gap: 12,
                          alignItems: "center",
                          fontWeight: "600",
                          fontSize: "14px",
                          color: "#495057",
                          border: "1px solid #dee2e6",
                        }}
                      >
                        <div>Ticket</div>
                        <div style={{ textAlign: "center" }}>SP</div>
                        <div style={{ textAlign: "center" }}>Est.</div>
                        <div style={{ textAlign: "center" }}>Actual</div>
                        <div style={{ textAlign: "center" }}>Eff.</div>
                      </div>

                      {metrics.estimationPerformance.ticketPerformance.map(
                        (ticket) => (
                          <div
                            key={ticket.key}
                            style={{
                              background: "#fff",
                              padding: 12,
                              borderRadius: 8,
                              border: "1px solid #dee2e6",
                              marginBottom: 8,
                              display: "grid",
                              gridTemplateColumns: "1fr auto auto auto auto",
                              gap: 12,
                              alignItems: "center",
                              minWidth: 0, // Allow grid to shrink
                            }}
                          >
                            <div>
                              <a
                                href={`https://taranis.atlassian.net/browse/${ticket.key}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "#007bff",
                                  textDecoration: "none",
                                  fontWeight: "600",
                                }}
                              >
                                {ticket.key}
                              </a>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#6c757d",
                                  marginTop: 2,
                                }}
                              >
                                {ticket.summary.substring(0, 50)}
                                {ticket.summary.length > 50 ? "..." : ""}
                              </div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 12, color: "#6c757d" }}>
                                SP
                              </div>
                              <div style={{ fontWeight: "bold" }}>
                                {ticket.storyPoints}
                              </div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 12, color: "#6c757d" }}>
                                Est.
                              </div>
                              <div style={{ fontWeight: "bold" }}>
                                {ticket.estimatedDays}
                              </div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 12, color: "#6c757d" }}>
                                Actual
                              </div>
                              <div style={{ fontWeight: "bold" }}>
                                {ticket.actualDays}
                              </div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 12, color: "#6c757d" }}>
                                Eff.
                              </div>
                              <div
                                style={{
                                  fontWeight: "bold",
                                  color:
                                    ticket.performance === "on-time"
                                      ? "#28a745"
                                      : "#dc3545",
                                }}
                              >
                                {ticket.efficiency}%
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

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
