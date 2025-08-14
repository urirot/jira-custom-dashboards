# Jira Feature Flowchart

A visual tool to explore and filter Jira epics and their tickets, showing dependencies and team assignments in a flowchart diagram.

## What It Does
- Connects to your Jira instance and fetches all tickets for a selected epic.
- Visualizes tickets and their dependencies as a flowchart.
- Lets you filter tickets by project, epic, and team.
- Colors tickets by status for quick visual insight (e.g., In Progress, QA, Completed, Released, etc.).

## How It Works
- The backend (Node.js/Express) fetches data from Jira using your credentials and exposes a simple API.
- The frontend (React) provides a modern UI to select projects, epics, and teams, and displays the flowchart using D3-based layout logic.
- All tickets for the selected epic are fetched (no pagination limit), and team filters are dynamically generated from the data.

## Running Locally

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd jira-custom-dashboards
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in your Jira credentials (API token, domain, email).

3. **Install dependencies:**
   ```sh
   npm install
   cd frontend && npm install
   ```

4. **Start the backend:**
   ```sh
   npm run start
   ```

5. **Start the frontend:**
   ```sh
   cd frontend
   npm start
   ```

6. **Open your browser:**
   - Go to [http://localhost:3001](http://localhost:3001)

## Notes
- Make sure your Jira user has API access and the correct permissions.
- The app will only show tickets for epics and projects you have access to in Jira.
- Team filtering is based on the "team" field in your Jira tickets.

---

Enjoy visualizing your Jira epics and their dependencies! 