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

  // Epic Manager props
  epics?: FilterOption[];
  selectedEpic?: FilterOption | null;
  loadingEpics?: boolean;
  onEpicChange?: (epic: FilterOption | null) => void;
  epicDisabled?: boolean;

  // Sprint Manager props
  boards?: FilterOption[];
  selectedBoard?: FilterOption | null;
  onBoardChange?: (board: FilterOption | null) => void;
  boardDisabled?: boolean;

  // Legacy team props (for backward compatibility)
  teams?: FilterOption[];
  selectedTeam?: FilterOption | null;
  onTeamChange?: (team: FilterOption | null) => void;
  teamDisabled?: boolean;
}

const Filters: React.FC<FiltersProps> = ({
  projects,
  selectedProject,
  loadingProjects,
  onProjectChange,
  epics = [],
  selectedEpic,
  loadingEpics = false,
  onEpicChange,
  epicDisabled,
  boards = [],
  selectedBoard,
  onBoardChange,
  boardDisabled,
  teams = [],
  selectedTeam,
  onTeamChange,
  teamDisabled,
}) => {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
        flexWrap: "wrap",
      }}
    >
      {/* Project Dropdown */}
      <div style={{ minWidth: 270, width: 330 }}>
        {loadingProjects ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 66,
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
                  minHeight: 66,
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
      {/* Epic Dropdown - Only show if epics are provided */}
      {epics.length > 0 && (
        <div style={{ minWidth: 390, width: 480 }}>
          {loadingEpics ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 66,
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
                onEpicChange?.(option?.epic || null);
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
                    minHeight: 66,
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
      )}
      {/* Board Dropdown - Show when boards are available */}
      {boards.length > 0 && (
        <div style={{ minWidth: 240, width: 300 }}>
          <Select
            inputId="board-select"
            options={boards.map((board) => ({
              value: board.key,
              label: board.name,
              board,
            }))}
            value={
              selectedBoard
                ? {
                    value: selectedBoard.key,
                    label: selectedBoard.name,
                    board: selectedBoard,
                  }
                : null
            }
            onChange={(option: SingleValue<any>) => {
              onBoardChange?.(option?.board || null);
            }}
            isClearable
            placeholder="Select board..."
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
                  minHeight: 66,
                  cursor: boardDisabled ? "not-allowed" : "pointer",
                  opacity: boardDisabled ? 0.5 : 1,
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
            isDisabled={boardDisabled}
          />
        </div>
      )}
      {/* Team Dropdown - Only show if teams are provided */}
      {teams.length > 0 && (
        <div style={{ minWidth: 240, width: 300 }}>
          <Select
            inputId="team-select"
            options={teams.map((team) => ({
              value: team.key,
              label: team.name,
              team,
            }))}
            value={
              selectedTeam
                ? {
                    value: selectedTeam.key,
                    label: selectedTeam.name,
                    team: selectedTeam,
                  }
                : null
            }
            onChange={(option: SingleValue<any>) => {
              onTeamChange?.(option?.team || null);
            }}
            isClearable
            placeholder="Filter by team..."
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
                  minHeight: 66,
                  cursor: teamDisabled ? "not-allowed" : "pointer",
                  opacity: teamDisabled ? 0.5 : 1,
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
            isDisabled={teamDisabled}
          />
        </div>
      )}
    </div>
  );
};

export default Filters;
