# Jira Custom Dashboards

A visual tool for Jira project management.

## What It Does

### Epic Manager
- **Visualize Epic Dependencies**: Explore and filter Jira epics and their tickets, showing dependencies and team assignments in interactive flowchart diagrams
- **Project Coordination**: Track progress across multiple teams and epics with color-coded status indicators
- **Dependency Mapping**: Visualize blocking/blocked-by relationships between tickets
- **Team Filtering**: Filter tickets by project, epic, and team for focused analysis

### Sprint Manager
- **Sprint Analytics**: Comprehensive sprint planning and execution tracking
- **Velocity Metrics**: Track team velocity, story point completion, and performance trends
- **Performance Insights**: Monitor assignee efficiency, status breakdowns, and time estimation accuracy
- **Data Visualization**: Interactive charts including pie charts for status breakdowns and velocity tracking
- **Work Categorization**: Analyze planned vs. unplanned work, identify extra work, and track AI-assisted tasks

## Key Features

- **Real-time Data**: Connects directly to your Jira instance via REST API
- **Interactive Visualizations**: D3-based diagrams and charts for better data understanding
- **Advanced Filtering**: Dynamic filters that update URL parameters for easy sharing
- **Team Performance**: Track individual and team productivity metrics
- **Status Tracking**: Color-coded tickets by status (In Progress, QA, Completed, Released, etc.)
- **Story Point Analysis**: Comprehensive analysis of estimation vs. actual effort
- **Cross-project Support**: Work with multiple Jira projects and boards

## How It Works

- **Backend (Node.js/Express)**: Fetches data from Jira using your credentials and exposes a RESTful API
- **Frontend (React + TypeScript)**: Modern, responsive UI with state management via Zustand
- **Data Processing**: Intelligent calculation of sprint metrics, velocity trends, and performance indicators
- **Visualization Engine**: D3.js-powered diagrams and charts for intuitive data representation

## Running Locally

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd jira-custom-dashboards
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in your Jira credentials:
     ```
     JIRA_API_TOKEN=your_api_token
     JIRA_DOMAIN=your_domain.atlassian.net
     JIRA_EMAIL=your_email@company.com
     ```

3. **Install dependencies:**
   ```sh
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend && npm install
   ```

4. **Start the backend:**
   ```sh
   # From the root directory
   npm run start
   ```
   The backend will run on port 4000

5. **Start the frontend:**
   ```sh
   # From the frontend directory
   cd frontend
   npm start
   ```
   The frontend will run on port 3000

6. **Open your browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Choose between Epic Manager or Sprint Manager based on your needs

## API Endpoints

The backend provides the following REST endpoints:

- `GET /api/projects` - List available Jira projects
- `GET /api/epics` - Fetch epics for a selected project
- `GET /api/epic/:epicId` - Get detailed epic information and tickets
- `GET /api/boards` - Get project boards for sprint management
- `GET /api/sprint-tickets` - Fetch tickets for a specific sprint
- `GET /api/sprint-metrics/:sprintId` - Calculate comprehensive sprint analytics
- `GET /api/teams` - Get team information for filtering
- `GET /api/sprint-dates` - Get sprint date ranges

## Sprint Metrics Included

The Sprint Manager provides detailed analytics on:

- **Velocity Tracking**: Current sprint velocity and historical trends
- **Story Point Analysis**: Total, completed, and remaining story points
- **Assignee Performance**: Individual efficiency metrics and workload distribution
- **Status Breakdown**: Visual representation of ticket status distribution
- **Epic Analysis**: Work distribution across epics and projects
- **Time Metrics**: Estimation accuracy, cycle time, and efficiency ratios
- **Work Categorization**: Planned vs. unplanned work analysis

## Epic Visualization Features

The Epic Manager offers:

- **Interactive Diagrams**: Drag-and-drop flowchart visualization
- **Dependency Mapping**: Clear visualization of ticket relationships
- **Team Assignment**: Color-coded tickets by team for easy identification
- **Status Overview**: Quick visual status assessment across the epic
- **Filtering Options**: Dynamic filters for focused analysis

## Requirements

- **Jira Access**: Your Jira user must have API access and appropriate permissions
- **Node.js**: Version 16 or higher
- **Modern Browser**: Chrome, Firefox, Safari, or Edge with ES6+ support

## Notes

- The application will only show tickets for epics and projects you have access to in Jira
- Team filtering is based on the "team" field in your Jira tickets
- Sprint metrics are calculated in real-time based on current Jira data
- All data is fetched directly from Jira - no local caching or storage
- URL parameters are automatically updated for easy sharing of filtered views

## Troubleshooting

- **Backend Connection Issues**: Ensure the backend is running on port 4000 and check your `.env` configuration
- **Jira API Errors**: Verify your API token has the necessary permissions and your Jira domain is correct
- **Frontend Issues**: Check that the proxy configuration in `frontend/package.json` points to the correct backend port

---

Transform your Jira workflow with powerful visualizations and comprehensive analytics. Choose Epic Manager for long-term planning or Sprint Manager for execution tracking - or use both for complete project visibility!