import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Ticket, SprintMetrics } from "./types";
import { calculateSprintMetrics } from "./utils/sprintMetrics";
import { getJiraUrl } from "./utils/d3Utils";
import PieChart from "./components/PieChart";
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
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Ticket | "completed";
    direction: "asc" | "desc";
  } | null>(null);

  // Sprint date range state
  const [sprintStartDate, setSprintStartDate] = useState<string>("");
  const [sprintEndDate, setSprintEndDate] = useState<string>("");
  const [sprintName, setSprintName] = useState<string>("");
  const [loadingBoards, setLoadingBoards] = useState(false);

  // Local state for projects
  const [projects, setProjects] = useState<FilterOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<FilterOption | null>(
    null
  );
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Handler for project change
  const handleProjectChange = (project: FilterOption | null) => {
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
      return;
    }

    setBoards([]);
    setSelectedBoard(null);
    setSprintTickets([]);
    setMetrics(null);
  }, [selectedProject]);

  // Fetch boards when project changes
  useEffect(() => {
    if (!selectedProject) {
      setBoards([]);
      setSelectedBoard(null);
      return;
    }
    setLoadingBoards(true);

    const fetchBoards = async () => {
      try {
        const url = new URL(`http://localhost:4000/api/boards`);
        url.searchParams.set("project", selectedProject.key);
        url.searchParams.set("t", Date.now().toString());

        const response = await axios.get(url.toString(), {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        if (response.status === 200 || response.status === 304) {
          const boardOptions = (response.data || []).map((board: any) => ({
            key: board.id.toString(),
            name: board.name,
          }));
          setBoards(boardOptions);
        } else {
          setBoards([]);
        }
      } catch (error) {
        console.error("Error fetching boards:", error);
        setBoards([]);
      } finally {
        setLoadingBoards(false);
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
        const { startDate, endDate, sprintName } = response.data;
        setSprintStartDate(startDate);
        setSprintEndDate(endDate);
        setSprintName(sprintName || "Current Sprint");
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

  // Sorting functions
  const handleSort = (key: keyof Ticket | "completed") => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedTickets = () => {
    if (!sortConfig) {
      return sprintTickets
        .filter((ticket) => !ticket.status.toLowerCase().includes("archived"))
        .sort((a, b) => (a.assignee || "").localeCompare(b.assignee || ""));
    }

    return sprintTickets
      .filter((ticket) => !ticket.status.toLowerCase().includes("archived"))
      .sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === "completed") {
          const completedStatuses = [
            "Done",
            "Closed",
            "Resolved",
            "Accepted",
            "Released",
            "Approved",
          ];
          aValue = completedStatuses.includes(a.status) ? 1 : 0;
          bValue = completedStatuses.includes(b.status) ? 1 : 0;
        } else {
          aValue = a[sortConfig.key as keyof Ticket] || "";
          bValue = b[sortConfig.key as keyof Ticket] || "";
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
  };

  const getSortIcon = (key: keyof Ticket | "completed") => {
    if (!sortConfig || sortConfig.key !== key) {
      return "↕";
    }
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

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
      {(sprintName || sprintStartDate || sprintEndDate) && (
        <div
          style={{
            background: "#f8f9fa",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "24px",
            border: "1px solid #e9ecef",
          }}
        >
          {sprintName && (
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              {sprintName}
            </h3>
          )}
          {(sprintStartDate || sprintEndDate) && (
            <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
              {sprintStartDate && sprintEndDate
                ? `Date Range: ${sprintStartDate} to ${sprintEndDate}`
                : sprintStartDate
                ? `Start Date: ${sprintStartDate}`
                : `End Date: ${sprintEndDate}`}
            </p>
          )}
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
                  color: "#3A7AB8",
                }}
              >
                {metrics.totalStoryPoints}
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>
                Story Points Planned
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
                  color: "#6BB42A",
                }}
              >
                {metrics.completedStoryPoints}
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>
                Story Points Completed
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
                  color:
                    metrics.totalStoryPoints > 0
                      ? Math.round(
                          (metrics.completedStoryPoints /
                            metrics.totalStoryPoints) *
                            100
                        ) >= 80
                        ? "#6BB42A"
                        : Math.round(
                            (metrics.completedStoryPoints /
                              metrics.totalStoryPoints) *
                              100
                          ) >= 60
                        ? "#E09B2E"
                        : "#B82A24"
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
                  color: "#E09B2E",
                }}
              >
                {(() => {
                  const unplannedCategory = metrics.labelBreakdown.find(
                    (cat) => cat.category.toLowerCase() === "unplanned"
                  );
                  return unplannedCategory ? unplannedCategory.storyPoints : 0;
                })()}
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>
                Unplanned Completed
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
                      "#3A7AB8", // Medium Blue
                      "#6BB42A", // Medium Green
                      "#E09B2E", // Medium Orange
                      "#B82A24", // Medium Red
                      "#7B1FBE", // Medium Purple
                      "#4AB3A3", // Medium Teal
                      "#E4C72C", // Medium Yellow
                      "#A61ABA", // Medium Magenta
                      "#3A3A3A", // Medium Gray
                      "#6B4A2A", // Medium Brown
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

                    return Array.from(processedData.values()).map(
                      (item, index) => ({
                        label: item.type,
                        value: item.storyPoints,
                        color:
                          item.type.toLowerCase() === "bug"
                            ? "#B82A24" // Medium Red for bugs
                            : item.type.toLowerCase() === "feature"
                            ? "#6BB42A" // Medium Green for features
                            : item.type.toLowerCase() === "infra"
                            ? "#3A7AB8" // Medium Blue for infra
                            : [
                                "#E09B2E", // Medium Orange
                                "#7B1FBE", // Medium Purple
                                "#4AB3A3", // Medium Teal
                                "#E4C72C", // Medium Yellow
                                "#A61ABA", // Medium Magenta
                                "#3A3A3A", // Medium Gray
                                "#6B4A2A", // Medium Brown
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
                          ? "#B82A24" // Medium Red for unplanned
                          : label.category.toLowerCase() === "planned"
                          ? "#6BB42A" // Medium Green for planned
                          : label.category.toLowerCase() === "claude"
                          ? "#3A7AB8" // Medium Blue for claude
                          : [
                              "#3A7AB8", // Medium Blue
                              "#6BB42A", // Medium Green
                              "#E09B2E", // Medium Orange
                              "#7B1FBE", // Medium Purple
                              "#4AB3A3", // Medium Teal
                            ][index % 5],
                    }));

                    // Add Extra category with yellow color, even if 0%
                    if (extraCategory) {
                      result.push({
                        label: extraCategory.category,
                        value: extraCategory.storyPoints,
                        color: "#E4C72C", // Medium Yellow for extra
                      });
                    } else {
                      // If Extra doesn't exist, add it with 0 value
                      result.push({
                        label: "Extra",
                        value: 0,
                        color: "#E4C72C", // Medium Yellow for extra
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
            <div
              style={{
                overflowX: "auto",
                overflowY: "auto",
                flex: 1,
                maxHeight: "70vh",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                  }}
                >
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
                        cursor: "pointer",
                        userSelect: "none",
                        position: "relative",
                        transition: "background-color 0.2s ease",
                      }}
                      onClick={() => handleSort("summary")}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#e9ecef";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                      }}
                    >
                      Task Name {getSortIcon("summary")}
                    </th>
                    <th
                      style={{
                        padding: "12px 8px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#495057",
                        cursor: "pointer",
                        userSelect: "none",
                        transition: "background-color 0.2s ease",
                      }}
                      onClick={() => handleSort("assignee")}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#e9ecef";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                      }}
                    >
                      Assignee {getSortIcon("assignee")}
                    </th>
                    <th
                      style={{
                        padding: "12px 8px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#495057",
                        cursor: "pointer",
                        userSelect: "none",
                        transition: "background-color 0.2s ease",
                      }}
                      onClick={() => handleSort("storyPoints")}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#e9ecef";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                      }}
                    >
                      Story Points {getSortIcon("storyPoints")}
                    </th>
                    <th
                      style={{
                        padding: "12px 8px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#495057",
                        cursor: "pointer",
                        userSelect: "none",
                        transition: "background-color 0.2s ease",
                      }}
                      onClick={() => handleSort("status")}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#e9ecef";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                      }}
                    >
                      Status {getSortIcon("status")}
                    </th>
                    <th
                      style={{
                        padding: "12px 8px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#495057",
                        cursor: "pointer",
                        userSelect: "none",
                        transition: "background-color 0.2s ease",
                      }}
                      onClick={() => handleSort("type")}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#e9ecef";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                      }}
                    >
                      Type {getSortIcon("type")}
                    </th>
                    <th
                      style={{
                        padding: "12px 8px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#495057",
                        cursor: "pointer",
                        userSelect: "none",
                        transition: "background-color 0.2s ease",
                      }}
                      onClick={() => handleSort("labels")}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#e9ecef";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                      }}
                    >
                      Labels {getSortIcon("labels")}
                    </th>
                    <th
                      style={{
                        padding: "12px 8px",
                        textAlign: "center",
                        fontWeight: "600",
                        color: "#495057",
                        cursor: "pointer",
                        userSelect: "none",
                        transition: "background-color 0.2s ease",
                      }}
                      onClick={() => handleSort("completed")}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#e9ecef";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                      }}
                    >
                      Completed {getSortIcon("completed")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedTickets().map((ticket) => {
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
                            <a
                              href={getJiraUrl(ticket.key)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#007bff",
                                textDecoration: "none",
                                cursor: "pointer",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.textDecoration =
                                  "underline";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.textDecoration = "none";
                              }}
                            >
                              {ticket.key}
                            </a>
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
                            color: "#495057",
                          }}
                        >
                          {ticket.labels &&
                            ticket.labels.length > 0 &&
                            ticket.labels.map((label, index) => {
                              let backgroundColor = "#F5F5F5";
                              let textColor = "#666666";

                              if (label.toLowerCase().includes("claude")) {
                                backgroundColor = "#FFF3E0";
                                textColor = "#E65100";
                              } else if (
                                label.toLowerCase().includes("extra")
                              ) {
                                backgroundColor = "#FCE4EC";
                                textColor = "#C2185B";
                              } else if (
                                label.toLowerCase().includes("unplanned")
                              ) {
                                backgroundColor = "#F3E5F5";
                                textColor = "#7B1FA2";
                              }

                              return (
                                <span
                                  key={index}
                                  style={{
                                    padding: "4px 8px",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    fontWeight: "500",
                                    backgroundColor,
                                    color: textColor,
                                    marginRight: "4px",
                                    display: "inline-block",
                                    marginBottom: "4px",
                                  }}
                                >
                                  {label}
                                </span>
                              );
                            })}
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
