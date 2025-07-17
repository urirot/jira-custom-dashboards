import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./App.css";
import { Ticket } from "./types";
import Filters, { FilterOption } from "./Filters";
import Diagram from "./Diagram";

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
  const [projects, setProjects] = useState<{ key: string; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<{
    key: string;
    name: string;
  } | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [epics, setEpics] = useState<EpicSummary[]>([]);
  const [selectedEpic, setSelectedEpic] = useState<EpicSummary | null>(null);
  const [epic, setEpic] = useState<EpicData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingEpics, setLoadingEpics] = useState(false);

  const diagramScrollRef = React.useRef<HTMLDivElement>(null);
  const isDragging = React.useRef(false);
  const dragStartX = React.useRef(0);
  const scrollStartX = React.useRef(0);
  const [diagramRendered, setDiagramRendered] = useState(0);

  // Track previous values to avoid unnecessary resets
  const prevProjectRef = React.useRef<string | null>(null);

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

  // Fetch projects
  useEffect(() => {
    setLoadingProjects(true);
    axios
      .get("http://localhost:4000/api/projects")
      .then((res) => setProjects(res.data))
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));
  }, []);

  // Fetch epics for selected project
  useEffect(() => {
    if (!selectedProject) {
      setEpics([]);
      setSelectedEpic(null);
      setEpic(null);
      return;
    }
    setLoadingEpics(true);
    axios
      .get(
        `http://localhost:4000/api/epics?project=${encodeURIComponent(
          selectedProject.name
        )}`
      )
      .then((res) => setEpics(res.data))
      .catch(() => setEpics([]))
      .finally(() => setLoadingEpics(false));
    setSelectedEpic(null);
    setEpic(null);
  }, [selectedProject]);

  const refreshEpic = useCallback(() => {
    if (!selectedEpic || !selectedProject) return;
    setLoading(true);
    axios
      .get(
        `http://localhost:4000/api/epic/${
          selectedEpic.key
        }?project=${encodeURIComponent(selectedProject.name)}`
      )
      .then((res) => {
        setEpic(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedEpic, selectedProject]);

  useEffect(() => {
    if (!selectedEpic || !selectedProject) return;
    refreshEpic();
  }, [selectedEpic, selectedProject, refreshEpic]);

  // Restore selectedProject from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectKey = params.get("project");
    if (projectKey && projects.length > 0 && !selectedProject) {
      const project = projects.find((p) => p.key === projectKey);
      if (project) setSelectedProject(project);
    }
  }, [projects, selectedProject]);

  // Restore selectedEpic from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const epicKey = params.get("epic");
    if (epicKey && epics.length > 0 && !selectedEpic) {
      const epic = epics.find((e) => e.key === epicKey);
      if (epic) setSelectedEpic(epic);
    }
  }, [epics, selectedEpic]);

  // Handler for project change
  const handleProjectChange = (project: FilterOption | null) => {
    setSelectedProject(project);
    setSelectedEpic(null);
    setEpic(null);
    // Update URL
    const params = new URLSearchParams(window.location.search);
    if (project) {
      params.set("project", project.key);
    } else {
      params.delete("project");
    }
    params.delete("epic");
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
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`
    );
  };

  return (
    <div className="App">
      <h1 style={{ textAlign: "center", marginBottom: 32 }}>
        Jira Epic Flow Diagram
      </h1>
      <Filters
        projects={projects}
        selectedProject={selectedProject}
        loadingProjects={loadingProjects}
        onProjectChange={handleProjectChange}
        epics={epics}
        selectedEpic={selectedEpic}
        loadingEpics={loadingEpics}
        onEpicChange={handleEpicChange}
        epicDisabled={!selectedProject}
      />
      <Diagram
        epic={epic}
        loading={loading}
        refreshEpic={refreshEpic}
        diagramRendered={diagramRendered}
        setDiagramRendered={setDiagramRendered}
      />
      {!loading && selectedEpic && !epic && <p>Failed to load Epic data.</p>}
    </div>
  );
}

export default App;
