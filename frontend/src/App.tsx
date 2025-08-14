import React, { useState } from "react";
import "./App.css";
import EpicManager from "./EpicManager";
import SprintManager from "./SprintManager";
import { useFilterStore } from "./utils/sharedState";

type AppMode = "selection" | "epic" | "sprint";

function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>("selection");
  const { clearFilters } = useFilterStore();

  const handleModeSelect = (mode: "epic" | "sprint") => {
    setCurrentMode(mode);
  };

  const handleBackToSelection = () => {
    setCurrentMode("selection");
    // Clear filters when going back to selection
    clearFilters();

    // Clear URL parameters except for project
    const url = new URL(window.location.href);
    const project = url.searchParams.get("project");
    url.search = project ? `project=${project}` : "";
    window.history.replaceState({}, "", url.toString());
  };

  if (currentMode === "epic") {
    return <EpicManager onBack={handleBackToSelection} />;
  }

  if (currentMode === "sprint") {
    return <SprintManager onBack={handleBackToSelection} />;
  }

  return (
    <div className="App">
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.98)",
            borderRadius: "16px",
            padding: "40px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
            textAlign: "center",
            maxWidth: "600px",
            width: "100%",
          }}
        >
          <h1
            style={{
              marginBottom: "40px",
              color: "#333",
              fontSize: "2.5rem",
              fontWeight: "700",
            }}
          >
            Jira Feature Flowchart
          </h1>

          <p
            style={{
              marginBottom: "40px",
              color: "#666",
              fontSize: "1.1rem",
              lineHeight: "1.6",
            }}
          >
            Choose your management tool to visualize and analyze your Jira
            workflows
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "24px",
              marginTop: "40px",
            }}
          >
            {/* Epic Manager Option */}
            <div
              style={{
                background: "linear-gradient(135deg, #34495e 0%, #2c3e50 100%)",
                borderRadius: "12px",
                padding: "32px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                border: "none",
                color: "white",
                textAlign: "center",
                boxShadow: "0 8px 25px rgba(44, 62, 80, 0.3)",
              }}
              onClick={() => handleModeSelect("epic")}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 35px rgba(44, 62, 80, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 8px 25px rgba(44, 62, 80, 0.3)";
              }}
            >
              <div
                style={{
                  fontSize: "3rem",
                  marginBottom: "16px",
                }}
              >
                📊
              </div>
              <h2
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "1.5rem",
                  fontWeight: "600",
                }}
              >
                Epic Manager
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  opacity: 0.9,
                  lineHeight: "1.5",
                }}
              >
                Visualize epic dependencies, track progress, and analyze team
                performance across epics
              </p>
            </div>

            {/* Sprint Manager Option */}
            <div
              style={{
                background: "linear-gradient(135deg, #5a6c7d 0%, #4a5568 100%)",
                borderRadius: "12px",
                padding: "32px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                border: "none",
                color: "white",
                textAlign: "center",
                boxShadow: "0 8px 25px rgba(90, 108, 125, 0.3)",
              }}
              onClick={() => handleModeSelect("sprint")}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 35px rgba(90, 108, 125, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 8px 25px rgba(90, 108, 125, 0.3)";
              }}
            >
              <div
                style={{
                  fontSize: "3rem",
                  marginBottom: "16px",
                }}
              >
                🏃‍♂️
              </div>
              <h2
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "1.5rem",
                  fontWeight: "600",
                }}
              >
                Sprint Manager
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  opacity: 0.9,
                  lineHeight: "1.5",
                }}
              >
                Manage sprint planning, track velocity, and monitor sprint
                progress with detailed analytics
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: "40px",
              padding: "20px",
              background: "rgba(44, 62, 80, 0.1)",
              borderRadius: "12px",
              border: "1px solid rgba(44, 62, 80, 0.2)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.9rem",
                color: "#666",
                lineHeight: "1.5",
              }}
            >
              <strong>Epic Manager:</strong> Perfect for long-term planning and
              cross-team coordination
              <br />
              <strong>Sprint Manager:</strong> Ideal for short-term execution
              and team velocity tracking
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
