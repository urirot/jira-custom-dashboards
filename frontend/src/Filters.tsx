import React from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import Loader from "./components/Loader";

export interface FilterOption {
  key: string;
  name: string;
}

interface FiltersProps {
  projects: FilterOption[];
  selectedProject: FilterOption | null;
  loadingProjects: boolean;
  onProjectChange: (project: FilterOption | null) => void;

  epics: FilterOption[];
  selectedEpic: FilterOption | null;
  loadingEpics: boolean;
  onEpicChange: (epic: FilterOption | null) => void;
  epicDisabled?: boolean;
}

const Filters: React.FC<FiltersProps> = ({
  projects,
  selectedProject,
  loadingProjects,
  onProjectChange,
  epics,
  selectedEpic,
  loadingEpics,
  onEpicChange,
  epicDisabled,
}) => {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
      }}
    >
      {/* Project Dropdown */}
      <div style={{ minWidth: 180, width: 220 }}>
        {loadingProjects ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 44,
            }}
          >
            <Loader />
          </div>
        ) : (
          <Select
            inputId="project-select"
            options={projects.map((project) => ({
              value: project.key,
              label: project.name,
              project,
            }))}
            value={
              selectedProject
                ? {
                    value: selectedProject.key,
                    label: selectedProject.name,
                    project: selectedProject,
                  }
                : null
            }
            onChange={(option: SingleValue<any>) => {
              onProjectChange(option?.project || null);
            }}
            isClearable
            placeholder="Select project..."
            menuPortalTarget={document.body}
            menuPosition="fixed"
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
                menuPortal: (base: React.CSSProperties) => ({
                  ...base,
                  zIndex: 9999,
                }),
              } as StylesConfig<any, false>
            }
            filterOption={(option, input) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
          />
        )}
      </div>
      {/* Epic Dropdown */}
      <div style={{ minWidth: 260, width: 320 }}>
        {loadingEpics ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 44,
            }}
          >
            <Loader />
          </div>
        ) : (
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
            onChange={(option: SingleValue<any>) => {
              onEpicChange(option?.epic || null);
            }}
            isClearable
            placeholder="Search or select epic..."
            menuPortalTarget={document.body}
            menuPosition="fixed"
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
                  cursor: epicDisabled ? "not-allowed" : "pointer",
                  opacity: epicDisabled ? 0.5 : 1,
                }),
                menu: (base: React.CSSProperties) => ({
                  ...base,
                  zIndex: 9999,
                }),
                menuPortal: (base: React.CSSProperties) => ({
                  ...base,
                  zIndex: 9999,
                }),
              } as StylesConfig<any, false>
            }
            filterOption={(option, input) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
            isDisabled={epicDisabled}
          />
        )}
      </div>
    </div>
  );
};

export default Filters;
