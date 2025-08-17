import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Ticket, SprintMetrics } from "./types";
import { calculateSprintMetrics } from "./utils/sprintMetrics";
import PieChart from "./components/PieChart";
import VelocityChart from "./components/VelocityChart";
import Filters, { FilterOption } from "./Filters";

import Loader from "./components/Loader";

interface SprintManagerProps {
  onBack: () => void;
}

function SprintManager({ onBack }: SprintManagerProps) {
  const [sprintTickets, setSprintTickets] = useState<Ticket[]>([]);
  const [loadingSprintData, setLoadingSprintData] = useState(false);
  const [boards, setBoards] = useState<FilterOption[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<FilterOption | null>(null);
  const [metrics, setMetrics] = useState<SprintMetrics | null>(null);

  // Sprint date range state
  const [sprintStartDate, setSprintStartDate] = useState<string>("");
  const [sprintEndDate, setSprintEndDate] = useState<string>("");
  const [sprintName, setSprintName] = useState<string>("");
  const [sprintId, setSprintId] = useState<string>("");
  const [loadingBoards, setLoadingBoards] = useState(false);

  // Local state for projects
  const [projects, setProjects] = useState<FilterOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<FilterOption | null>(
    null
  );
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Handler for project change
  const handleProjectChange = (project: FilterOption | null) => {
    console.log("handleProjectChange called with:", project?.key);
    setSelectedProject(project);
    setBoards([]);
    setSelectedBoard(null);
    setSprintTickets([]);
    setMetrics(null);
    // Update URL (preserve mode and project parameters)
    const params = new URLSearchParams();
    if (project) {
      params.set("project", project.key);
    }
    params.delete("board");
    // Preserve mode parameter
    const mode = new URLSearchParams(window.location.search).get("mode");
    if (mode) {
      params.set("mode", mode);
    }
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`
    );
  };

  // Handler for board change
  const handleBoardChange = (board: FilterOption | null) => {
    setSelectedBoard(board);
    setSprintTickets([]);
    setMetrics(null);
    // Update URL (preserve mode and project parameters)
    const params = new URLSearchParams();
    if (board) {
      params.set("board", board.key);
    } else {
      params.delete("board");
    }
    if (selectedProject) {
      params.set("project", selectedProject.key);
    }
    // Preserve mode parameter
    const mode = new URLSearchParams(window.location.search).get("mode");
    if (mode) {
      params.set("mode", mode);
    }
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`
    );
  };

  // Always fetch projects fresh on component mount
  useEffect(() => {
    setLoadingProjects(true);
    axios
      .get(`http://localhost:4000/api/projects?t=${Date.now()}`, {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
      .then((res) => {
        if (res.status === 200 || res.status === 304) {
          setProjects(res.data || []);
        } else {
          setProjects([]);
        }
      })
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));
  }, []);

  // Restore selectedProject from URL after projects are loaded
  useEffect(() => {
    if (projects.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const projectKey = params.get("project");
      if (projectKey && !selectedProject) {
        const project = projects.find((p) => p.key === projectKey);
        if (project) {
          setSelectedProject(project);
        }
      }
    }
  }, [projects, selectedProject]);

  // Reset state when project changes
  useEffect(() => {
    if (!selectedProject) {
      setBoards([]);
      setSelectedBoard(null);
      setSprintTickets([]);
      setMetrics(null);
      setSprintStartDate("");
      setSprintEndDate("");
      setSprintName("");
      setSprintId("");
      return;
    }

    setBoards([]);
    setSelectedBoard(null);
    setSprintTickets([]);
    setMetrics(null);
  }, [selectedProject]);

  // Fetch boards when project changes
  useEffect(() => {
    console.log(
      "useEffect triggered for boards. selectedProject:",
      selectedProject?.key
    );

    if (!selectedProject) {
      console.log("No project selected, clearing boards");
      setBoards([]);
      setSelectedBoard(null);
      return;
    }

    console.log(`Fetching boards for project: ${selectedProject.key}`);
    setLoadingBoards(true);

    const fetchBoards = async () => {
      try {
        const url = new URL(`http://localhost:4000/api/boards`);
        url.searchParams.set("project", selectedProject.key);
        url.searchParams.set("t", Date.now().toString());

        console.log(`Making request to: ${url.toString()}`);

        const response = await axios.get(url.toString(), {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        console.log(
          `Response received: ${response.status}, boards count: ${
            response.data?.length || 0
          }`
        );

        if (response.status === 200 || response.status === 304) {
          const boardOptions = (response.data || []).map((board: any) => ({
            key: board.id.toString(),
            name: board.name,
          }));
          setBoards(boardOptions);
          console.log(`Set ${boardOptions.length} boards`);
        } else {
          setBoards([]);
          console.log("No boards set due to response status");
        }
      } catch (error) {
        console.error("Error fetching boards:", error);
        setBoards([]);
      } finally {
        setLoadingBoards(false);
        console.log("Finished loading boards");
      }
    };

    fetchBoards();
  }, [selectedProject]);

  // Fetch sprint dates when board is selected
  const fetchSprintDates = useCallback(async () => {
    if (!selectedProject || !selectedBoard) {
      setSprintStartDate("");
      setSprintEndDate("");
      setSprintName("");
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:4000/api/sprint-dates?project=${encodeURIComponent(
          selectedProject.key
        )}&board=${encodeURIComponent(selectedBoard.key)}&t=${Date.now()}`,
        {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      if (response.status === 200 || response.status === 304) {
        const { startDate, endDate, sprintName, sprintId } = response.data;
        setSprintStartDate(startDate);
        setSprintEndDate(endDate);
        setSprintName(sprintName || "Current Sprint");
        setSprintId(sprintId || "");
      }
    } catch (error) {
      console.error("Error fetching sprint dates:", error);
    }
  }, [selectedProject, selectedBoard]);

  // Fetch sprint dates when board changes
  useEffect(() => {
    fetchSprintDates();
  }, [fetchSprintDates]);

  // Fetch current sprint tickets
  const fetchCurrentSprintTickets = useCallback(async () => {
    if (!selectedProject || !selectedBoard) {
      return;
    }

    setLoadingSprintData(true);
    try {
      const response = await axios.get(
        `http://localhost:4000/api/sprint-tickets?project=${encodeURIComponent(
          selectedProject.key
        )}&board=${selectedBoard.key}&t=${Date.now()}`,
        {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      if (response.status === 200 || response.status === 304) {
        const tickets = response.data.tickets || [];
        setSprintTickets(tickets);

        // Calculate metrics
        const calculatedMetrics = calculateSprintMetrics(tickets);
        setMetrics(calculatedMetrics);
      }
    } catch (error) {
      console.error("Error fetching sprint tickets:", error);
      setSprintTickets([]);
      setMetrics(null);
    } finally {
      setLoadingSprintData(false);
    }
  }, [selectedProject, selectedBoard]);

  // Fetch tickets when sprint dates change
  useEffect(() => {
    fetchCurrentSprintTickets();
  }, [fetchCurrentSprintTickets]);

  // Restore board from URL on component mount (projects are fetched fresh)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const boardKey = params.get("board");

    if (boardKey && boards.length > 0) {
      const board = boards.find((b) => b.key === boardKey);
      if (board) {
        setSelectedBoard(board);
      }
    }
  }, [boards]);

  // Loading state
  const isLoading = loadingProjects || loadingBoards || loadingSprintData;

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header with back button and title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px",
          marginBottom: "24px",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "rgba(44, 62, 80, 0.9)",
            border: "none",
            borderRadius: "8px",
            padding: "10px 16px",
            color: "white",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(44, 62, 80, 1)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(44, 62, 80, 0.9)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          ← Back
        </button>
        <h1
          style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: "600",
            color: "#2c3e50",
          }}
        >
          Sprint Manager
        </h1>
        <div style={{ width: "80px" }}></div> {/* Spacer for centering */}
      </div>

      {/* Filters */}
      <Filters
        projects={projects}
        selectedProject={selectedProject}
        loadingProjects={loadingProjects}
        onProjectChange={handleProjectChange}
        boards={boards}
        selectedBoard={selectedBoard}
        onBoardChange={handleBoardChange}
        boardDisabled={loadingBoards || !selectedProject}
      />

      {/* Sprint Info */}
      {sprintName && sprintStartDate && sprintEndDate && (
        <div
          style={{
            background: "#f8f9fa",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "24px",
            border: "1px solid #e9ecef",
          }}
        >
          <h3
            style={{
              margin: "0 0 8px 0",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            {sprintName}
          </h3>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            Date Range: {sprintStartDate} to {sprintEndDate}
          </p>
        </div>
      )}

      {/* Loading State for Boards */}
      {loadingBoards && selectedProject && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "40px",
            color: "#666",
          }}
        >
          <div style={{ marginRight: "12px" }}>
            <Loader />
          </div>
          Loading boards...
        </div>
      )}

      {/* Loading State for Sprint Data */}
      {loadingSprintData && selectedBoard && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "40px",
            color: "#666",
          }}
        >
          <div style={{ marginRight: "12px" }}>
            <Loader />
          </div>
          Loading sprint tickets...
        </div>
      )}

      {/* General Loading State */}
      {isLoading && !loadingBoards && !loadingSprintData && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "40px",
          }}
        >
          <Loader />
        </div>
      )}

      {/* Sprint Metrics */}
      {!isLoading && !loadingBoards && !loadingSprintData && metrics && (
        <div style={{ marginTop: "24px" }}>
          <h2
            style={{
              marginBottom: "24px",
              fontSize: "20px",
              fontWeight: "600",
            }}
          >
            Sprint Summary
          </h2>

          {/* Top Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid #e9ecef",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#4A90E2",
                }}
              >
                {metrics.totalTickets}
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>
                Total Tickets
              </div>
            </div>
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid #e9ecef",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#7ED321",
                }}
              >
                {metrics.totalStoryPoints}
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>
                Story Points
              </div>
            </div>
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid #e9ecef",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#F5A623",
                }}
              >
                {metrics.assigneeStats.length}
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>Assignees</div>
            </div>
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid #e9ecef",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color:
                    metrics.totalStoryPoints > 0
                      ? Math.round(
                          (metrics.completedStoryPoints /
                            metrics.totalStoryPoints) *
                            100
                        ) >= 80
                        ? "#7ED321"
                        : Math.round(
                            (metrics.completedStoryPoints /
                              metrics.totalStoryPoints) *
                              100
                          ) >= 60
                        ? "#F5A623"
                        : "#D0021B"
                      : "#666",
                }}
              >
                {metrics.totalStoryPoints > 0
                  ? Math.round(
                      (metrics.completedStoryPoints /
                        metrics.totalStoryPoints) *
                        100
                    )
                  : 0}
                %
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>
                Planned vs Done
              </div>
            </div>
          </div>

          {/* Charts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
              marginBottom: "32px",
            }}
          >
            {/* Effort by Epic */}
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid #e9ecef",
                maxHeight: "400px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h3
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "16px",
                  fontWeight: "600",
                }}
              >
                Effort by Epic
              </h3>
              <div style={{ flex: 1, overflow: "auto" }}>
                <PieChart
                  title=""
                  data={metrics.epicBreakdown.map((epic, index) => ({
                    label: epic.epic,
                    value: epic.storyPoints,
                    color: [
                      "#4A90E2", // Blue
                      "#7ED321", // Green
                      "#F5A623", // Orange
                      "#D0021B", // Red
                      "#9013FE", // Purple
                      "#50E3C2", // Teal
                      "#F8E71C", // Yellow
                      "#BD10E0", // Magenta
                      "#4A4A4A", // Dark Gray
                      "#8B572A", // Brown
                    ][index % 10],
                  }))}
                />
              </div>
            </div>

            {/* Effort by Type */}
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid #e9ecef",
                maxHeight: "400px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h3
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "16px",
                  fontWeight: "600",
                }}
              >
                Effort by Type
              </h3>
              <div style={{ flex: 1, overflow: "auto" }}>
                <PieChart
                  title=""
                  data={(() => {
                    // Group stories and tasks as features, and ensure unique colors
                    const processedData = new Map();

                    metrics.typeBreakdown.forEach((type) => {
                      const normalizedType =
                        type.type.toLowerCase() === "story" ||
                        type.type.toLowerCase() === "task"
                          ? "Feature"
                          : type.type;

                      if (processedData.has(normalizedType)) {
                        // Combine story points for the same normalized type
                        const existing = processedData.get(normalizedType);
                        existing.storyPoints += type.storyPoints;
                      } else {
                        processedData.set(normalizedType, {
                          type: normalizedType,
                          storyPoints: type.storyPoints,
                        });
                      }
                    });

                    const uniqueColors = [
                      "#4A90E2", // Blue
                      "#7ED321", // Green
                      "#F5A623", // Orange
                      "#D0021B", // Red
                      "#9013FE", // Purple
                      "#50E3C2", // Teal
                      "#F8E71C", // Yellow
                      "#BD10E0", // Magenta
                      "#4A4A4A", // Dark Gray
                      "#8B572A", // Brown
                    ];

                    return Array.from(processedData.values()).map(
                      (item, index) => ({
                        label: item.type,
                        value: item.storyPoints,
                        color:
                          item.type.toLowerCase() === "bug"
                            ? "#D0021B" // Red for bugs
                            : item.type.toLowerCase() === "feature"
                            ? "#7ED321" // Green for features
                            : item.type.toLowerCase() === "infra"
                            ? "#4A90E2" // Blue for infra
                            : [
                                "#F5A623", // Orange
                                "#9013FE", // Purple
                                "#50E3C2", // Teal
                                "#F8E71C", // Yellow
                                "#BD10E0", // Magenta
                                "#4A4A4A", // Dark Gray
                                "#8B572A", // Brown
                              ][index % 7],
                      })
                    );
                  })()}
                />
              </div>
            </div>

            {/* Effort by Category */}
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid #e9ecef",
                maxHeight: "400px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h3
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "16px",
                  fontWeight: "600",
                }}
              >
                Effort by Category
              </h3>
              <div style={{ flex: 1, overflow: "auto" }}>
                <PieChart
                  title=""
                  data={(() => {
                    // Ensure Extra is always shown with yellow color, even if 0%
                    const extraCategory = metrics.labelBreakdown.find(
                      (cat) => cat.category.toLowerCase() === "extra"
                    );
                    const otherCategories = metrics.labelBreakdown.filter(
                      (cat) => cat.category.toLowerCase() !== "extra"
                    );

                    const result = otherCategories.map((label, index) => ({
                      label: label.category,
                      value: label.storyPoints,
                      color:
                        label.category.toLowerCase() === "unplanned"
                          ? "#D0021B" // Red for unplanned
                          : label.category.toLowerCase() === "planned"
                          ? "#7ED321" // Green for planned
                          : label.category.toLowerCase() === "claude"
                          ? "#4A90E2" // Blue for claude
                          : [
                              "#4A90E2", // Blue
                              "#7ED321", // Green
                              "#F5A623", // Orange
                              "#9013FE", // Purple
                              "#50E3C2", // Teal
                            ][index % 5],
                    }));

                    // Add Extra category with yellow color, even if 0%
                    if (extraCategory) {
                      result.push({
                        label: extraCategory.category,
                        value: extraCategory.storyPoints,
                        color: "#F8E71C", // Yellow for extra
                      });
                    } else {
                      // If Extra doesn't exist, add it with 0 value
                      result.push({
                        label: "Extra",
                        value: 0,
                        color: "#F8E71C", // Yellow for extra
                      });
                    }

                    return result;
                  })()}
                />
              </div>
            </div>
          </div>

          {/* Unfinished Tasks Table */}
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #e9ecef",
              marginTop: "32px",
              maxHeight: "600px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              All Tasks
            </h3>
            <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #e9ecef",
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    <th
                      style={{
                        padding: "12px 8px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#495057",
                      }}
                    >
                      Task Name
                    </th>
                    <th
                      style={{
                        padding: "12px 8px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#495057",
                      }}
                    >
                      Assignee
                    </th>
                    <th
                      style={{
                        padding: "12px 8px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#495057",
                      }}
                    >
                      Story Points
                    </th>
                    <th
                      style={{
                        padding: "12px 8px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#495057",
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        padding: "12px 8px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#495057",
                      }}
                    >
                      Type
                    </th>
                    <th
                      style={{
                        padding: "12px 8px",
                        textAlign: "center",
                        fontWeight: "600",
                        color: "#495057",
                      }}
                    >
                      Completed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sprintTickets
                    .sort((a, b) =>
                      (a.assignee || "").localeCompare(b.assignee || "")
                    )
                    .map((ticket) => {
                      const isCompleted = [
                        "Done",
                        "Closed",
                        "Resolved",
                        "Accepted",
                        "Released",
                        "Approved",
                      ].includes(ticket.status);
                      return (
                        <tr
                          key={ticket.key}
                          style={{
                            borderBottom: "1px solid #e9ecef",
                            backgroundColor: "white",
                          }}
                        >
                          <td
                            style={{
                              padding: "12px 8px",
                              color: "#495057",
                            }}
                          >
                            <div style={{ fontWeight: "500" }}>
                              {ticket.key}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6c757d" }}>
                              {ticket.summary}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "12px 8px",
                              color: "#495057",
                            }}
                          >
                            {ticket.assignee}
                          </td>
                          <td
                            style={{
                              padding: "12px 8px",
                              color: "#495057",
                              textAlign: "center",
                            }}
                          >
                            {ticket.storyPoints || 0}
                          </td>
                          <td
                            style={{
                              padding: "12px 8px",
                              color: "#495057",
                            }}
                          >
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "500",
                                backgroundColor: [
                                  "Done",
                                  "Closed",
                                  "Resolved",
                                  "Accepted",
                                  "Released",
                                  "Approved",
                                ].includes(ticket.status)
                                  ? "#E8F5E8" // Light green background for completed
                                  : "#F5F5F5", // Light gray background for other statuses
                                color: [
                                  "Done",
                                  "Closed",
                                  "Resolved",
                                  "Accepted",
                                  "Released",
                                  "Approved",
                                ].includes(ticket.status)
                                  ? "#2E7D32" // Dark green text for completed
                                  : "#666666", // Gray text for other statuses
                              }}
                            >
                              {ticket.status}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "12px 8px",
                              color: "#495057",
                            }}
                          >
                            {ticket.type}
                          </td>
                          <td
                            style={{
                              padding: "12px 8px",
                              textAlign: "center",
                              color: "#495057",
                            }}
                          >
                            {isCompleted ? (
                              <span
                                style={{ color: "#7ED321", fontSize: "18px" }}
                              >
                                ✓
                              </span>
                            ) : (
                              <span
                                style={{ color: "#D0021B", fontSize: "18px" }}
                              >
                                ✗
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {sprintTickets.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#6c757d",
                    fontSize: "14px",
                  }}
                >
                  No tasks found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SprintManager;
