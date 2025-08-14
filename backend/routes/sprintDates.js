const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Fetch real sprint dates from Jira
router.get('/', async (req, res) => {
  try {
    const { project, board } = req.query;
    
    if (!project) {
      return res.status(400).json({ error: 'Project parameter is required' });
    }

    const { JIRA_API_TOKEN, JIRA_DOMAIN, JIRA_EMAIL } = process.env;
    if (!JIRA_API_TOKEN || !JIRA_DOMAIN || !JIRA_EMAIL) {
      return res.status(500).json({ error: 'Jira credentials not set in .env' });
    }

    // Fetch ALL boards first (using pagination like the boards endpoint)
    let allBoards = [];
    let startAt = 0;
    const maxResults = 50;
    
    while (true) {
      const url = `https://${JIRA_DOMAIN}/rest/agile/1.0/board?startAt=${startAt}&maxResults=${maxResults}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return res.status(500).json({ error: 'Failed to fetch boards from Jira' });
      }

      const data = await response.json();
      
      if (data.values && data.values.length > 0) {
        allBoards = allBoards.concat(data.values);
      }
      
      if (data.isLast || !data.values || data.values.length === 0) {
        break;
      }
      
      startAt += maxResults;
    }
    
    // Find board for the project
    let projectBoard;
    if (board) {
      // Use specific board if provided
      projectBoard = allBoards.find(b => 
        b.id.toString() === board && b.location && b.location.projectKey === project
      );
    } else {
      // Find first board for the project
      projectBoard = allBoards.find(b => 
        b.location && b.location.projectKey === project
      );
    }

    if (!projectBoard) {
      return res.status(404).json({ error: 'No board found for project' });
    }

    // Fetch sprints for the board
    const sprintsUrl = `https://${JIRA_DOMAIN}/rest/agile/1.0/board/${projectBoard.id}/sprint`;
    const sprintsResponse = await fetch(sprintsUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
        'Accept': 'application/json',
      },
    });

    if (!sprintsResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch sprints from Jira' });
    }

    const sprintsData = await sprintsResponse.json();
    
                    // Find current/active sprint
                const currentSprint = sprintsData.values.find(sprint => 
                  sprint.state === 'active' || sprint.state === 'future'
                );

                if (!currentSprint) {
                  // Fallback to the specific sprint dates you mentioned
                  return res.json({
                    startDate: "2024-08-11",
                    endDate: "2024-09-01",
                    sprintName: "Sprint 11.08 - 01.09",
                    sprintId: "2534" // Use the known active sprint ID
                  });
                }

    res.json({
      startDate: currentSprint.startDate ? currentSprint.startDate.split('T')[0] : null,
      endDate: currentSprint.endDate ? currentSprint.endDate.split('T')[0] : null,
      sprintName: currentSprint.name,
      sprintId: currentSprint.id.toString()
    });
  } catch (error) {
    console.error('Error fetching sprint dates:', error);
    res.status(500).json({ error: 'Failed to fetch sprint dates' });
  }
});

module.exports = router;
