import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Ticket } from "./types";
import Filters, { FilterOption } from "./Filters";
import Diagram from "./Diagram";
import Loader from "./components/Loader";
import { useFilterStore } from "./utils/sharedState";

interface EpicData {
  epicId: string;
  epicName: string;
  tickets: Ticket[];
}

interface EpicSummary {
  key: string;
  name: string;
}

interface EpicManagerProps {
  onBack: () => void;
}

function EpicManager({ onBack }: EpicManagerProps) {
  const [epics, setEpics] = useState<EpicSummary[]>([]);
  const [epic, setEpic] = useState<EpicData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingEpics, setLoadingEpics] = useState(false);
  const [teams, setTeams] = useState<FilterOption[]>([]);

  // Use shared filter state
  const {
    projects,
    selectedProject,
    selectedEpic,
    selectedTeam,
    loadingProjects,
    setProjects,
    setSelectedProject,
    setSelectedEpic,
    setSelectedTeam,
    setLoadingProjects,
  } = useFilterStore();

  const diagramScrollRef = React.useRef<HTMLDivElement>(null);
  const isDragging = React.useRef(false);
  const dragStartX = React.useRef(0);
  const scrollStartX = React.useRef(0);
  const [diagramRendered, setDiagramRendered] = useState(0);

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

  // Fetch projects if not already loaded
  useEffect(() => {
    if (projects.length === 0 && !loadingProjects) {
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
    }
  }, [projects.length, loadingProjects, setProjects, setLoadingProjects]);

  // Fetch epics for selected project
  useEffect(() => {
    if (!selectedProject) {
      setEpics([]);
      setSelectedEpic(null);
      setEpic(null);
      setTeams([]);
      setSelectedTeam(null);
      return;
    }
    setLoadingEpics(true);
    axios
      .get(
        `http://localhost:4000/api/epics?project=${encodeURIComponent(
          selectedProject.name
        )}&t=${Date.now()}`,
        {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      )
      .then((res) => {
        if (res.status === 200 || res.status === 304) {
          setEpics(res.data || []);
        } else {
          setEpics([]);
        }
      })
      .catch(() => setEpics([]))
      .finally(() => setLoadingEpics(false));
    setSelectedEpic(null);
    setEpic(null);
    setTeams([]);
    setSelectedTeam(null);
  }, [selectedProject, setSelectedEpic, setSelectedTeam]);

  const refreshEpic = useCallback(() => {
    if (!selectedEpic || !selectedProject) return;
    setLoading(true);
    axios
      .get(
        `http://localhost:4000/api/epic/${
          selectedEpic.key
        }?project=${encodeURIComponent(selectedProject.name)}&t=${Date.now()}`,
        {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      )
      .then((res) => {
        if (res.status === 200 || res.status === 304) {
          setEpic(res.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedEpic, selectedProject]);

  useEffect(() => {
    if (!selectedEpic || !selectedProject) return;
    refreshEpic();
  }, [selectedEpic, selectedProject, refreshEpic]);

  // Extract teams from epic tickets when epic data changes
  useEffect(() => {
    if (epic && epic.tickets) {
      const uniqueTeams = Array.from(
        new Set(
          epic.tickets
            .map((ticket) => {
              // Handle team as object with value property
              if (
                ticket.team &&
                typeof ticket.team === "object" &&
                "value" in ticket.team
              ) {
                return ticket.team.value;
              }
              // Handle team as string
              if (typeof ticket.team === "string") {
                return ticket.team;
              }
              return null;
            })
            .filter(
              (team): team is string => team !== null && team.trim() !== ""
            )
        )
      ).sort();

      const teamOptions = uniqueTeams.map((team) => ({
        key: team,
        name: team,
      }));

      setTeams(teamOptions);
    } else {
      setTeams([]);
      setSelectedTeam(null);
    }
  }, [epic, setSelectedTeam]);

  // Restore selectedProject from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectKey = params.get("project");
    if (projectKey && projects.length > 0 && !selectedProject) {
      const project = projects.find((p) => p.key === projectKey);
      if (project) setSelectedProject(project);
    }
  }, [projects, selectedProject, setSelectedProject]);

  // Restore selectedEpic from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const epicKey = params.get("epic");
    if (epicKey && epics.length > 0 && !selectedEpic) {
      const epic = epics.find((e) => e.key === epicKey);
      if (epic) setSelectedEpic(epic);
    }
  }, [epics, selectedEpic, setSelectedEpic]);

  // Restore selectedTeam from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const teamKey = params.get("team");
    if (teamKey && teams.length > 0 && !selectedTeam) {
      const team = teams.find((t) => t.key === teamKey);
      if (team) setSelectedTeam(team);
    }
  }, [teams, selectedTeam, setSelectedTeam]);

  // Handler for project change
  const handleProjectChange = (project: FilterOption | null) => {
    setSelectedProject(project);
    setSelectedEpic(null);
    setEpic(null);
    setTeams([]);
    setSelectedTeam(null);
    // Update URL
    const params = new URLSearchParams(window.location.search);
    if (project) {
      params.set("project", project.key);
    } else {
      params.delete("project");
    }
    params.delete("epic");
    params.delete("team");
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`
    );
  };

  // Handler for epic change
  const handleEpicChange = (epicOption: FilterOption | null) => {
    const epicObj = epicOption
      ? epics.find((e) => e.key === epicOption.key)
      : null;
    setSelectedEpic(epicObj || null);
    setEpic(null);
    setTeams([]);
    setSelectedTeam(null);
    // Update URL
    const params = new URLSearchParams(window.location.search);
    if (epicObj) {
      params.set("epic", epicObj.key);
    } else {
      params.delete("epic");
    }
    if (selectedProject) {
      params.set("project", selectedProject.key);
    }
    params.delete("team");
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`
    );
  };

  // Handler for team change
  const handleTeamChange = (team: FilterOption | null) => {
    setSelectedTeam(team);
    // Update URL
    const params = new URLSearchParams(window.location.search);
    if (team) {
      params.set("team", team.key);
    } else {
      params.delete("team");
    }
    if (selectedProject) {
      params.set("project", selectedProject.key);
    }
    if (selectedEpic) {
      params.set("epic", selectedEpic.key);
    }
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`
    );
  };

  // Filter tickets based on selected team
  const filteredEpic = React.useMemo(() => {
    if (!epic) return null;

    if (!selectedTeam) return epic;

    return {
      ...epic,
      tickets: epic.tickets.filter((ticket) => {
        // Handle team as object with value property
        if (
          ticket.team &&
          typeof ticket.team === "object" &&
          "value" in ticket.team
        ) {
          return ticket.team.value === selectedTeam.key;
        }
        // Handle team as string
        if (typeof ticket.team === "string") {
          return ticket.team === selectedTeam.key;
        }
        return false;
      }),
    };
  }, [epic, selectedTeam]);

  return (
    <div className="App">
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
          Epic Manager
        </h1>
        <div style={{ width: "80px" }}></div> {/* Spacer for centering */}
      </div>

      <Filters
        projects={projects}
        selectedProject={selectedProject}
        loadingProjects={loadingProjects}
        onProjectChange={handleProjectChange}
        epics={epics}
        selectedEpic={selectedEpic}
        loadingEpics={loadingEpics}
        onEpicChange={handleEpicChange}
        epicDisabled={!selectedProject || loadingEpics}
        teams={teams}
        selectedTeam={selectedTeam}
        onTeamChange={handleTeamChange}
        teamDisabled={!selectedEpic || !epic || loading}
      />
      {/* Show loading when fetching epics */}
      {loadingEpics && selectedProject && (
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
          Loading epics...
        </div>
      )}

      {/* Show loading when fetching epic data */}
      {loading && selectedEpic && (
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
          Loading epic data...
        </div>
      )}

      {/* Show diagram when not loading */}
      {!loadingEpics && !loading && (
        <Diagram
          epic={filteredEpic}
          loading={loading}
          refreshEpic={refreshEpic}
          diagramRendered={diagramRendered}
          setDiagramRendered={setDiagramRendered}
        />
      )}

      {!loading && selectedEpic && !epic && <p>Failed to load Epic data.</p>}
    </div>
  );
}

export default EpicManager;
