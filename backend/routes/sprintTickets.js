const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Fetch sprint tickets from Jira API
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

    // First, get the board's filter and active sprint
    let activeSprintId = null;
    let activeSprintName = null;
    let boardFilter = null;
    
    if (board) {
      try {
        // Get board details including its filter
        const boardUrl = `https://${JIRA_DOMAIN}/rest/agile/1.0/board/${board}`;
        const boardResponse = await fetch(boardUrl, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
            'Accept': 'application/json',
          },
        });

        if (boardResponse.ok) {
          const boardData = await boardResponse.json();
          boardFilter = boardData.filter?.query || null;
        }

        // Try to get board configuration which might include the filter
        const boardConfigUrl = `https://${JIRA_DOMAIN}/rest/agile/1.0/board/${board}/configuration`;
        const boardConfigResponse = await fetch(boardConfigUrl, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
            'Accept': 'application/json',
          },
        });

                if (boardConfigResponse.ok) {
          const boardConfigData = await boardConfigResponse.json();
          
          // Check if filter is in configuration
        if (boardConfigData.filter && !boardFilter) {
          // The filter is referenced by ID, we need to fetch the actual filter
          const filterId = boardConfigData.filter.id;
          
          // Fetch the actual filter details
          const filterUrl = `https://${JIRA_DOMAIN}/rest/api/2/filter/${filterId}`;
          const filterResponse = await fetch(filterUrl, {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
              'Accept': 'application/json',
            },
          });

          if (filterResponse.ok) {
            const filterData = await filterResponse.json();
            boardFilter = filterData.jql || null;
            
            // Clean up the filter to make it work with Jira API
            if (boardFilter) {
              // Remove ORDER BY clause as it's not needed for ticket fetching
              boardFilter = boardFilter.replace(/ORDER BY.*$/i, '').trim();
              // Remove the project filter since we'll add it separately
              boardFilter = boardFilter.replace(/AND project = "TARANIS PRODUCT"/i, '').trim();
              // Clean up any double ANDs
              boardFilter = boardFilter.replace(/^\s*AND\s*/i, '').trim();
            }
          }
        }
        }

        // Get sprints for the specific board
        const sprintsUrl = `https://${JIRA_DOMAIN}/rest/agile/1.0/board/${board}/sprint?state=active`;
        const sprintsResponse = await fetch(sprintsUrl, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
            'Accept': 'application/json',
          },
        });

        if (sprintsResponse.ok) {
          const sprintsData = await sprintsResponse.json();
          
          if (sprintsData.values && sprintsData.values.length > 0) {
            const activeSprint = sprintsData.values[0]; // Get the first active sprint
            activeSprintId = activeSprint.id;
            activeSprintName = activeSprint.name;
          }
        }
      } catch (error) {
        console.error('Error fetching board data:', error);
      }
    }

    // Build JQL query - combine board filter with sprint filter
    let jql = '';
    
    if (boardFilter) {
      // Use the board's filter as the base
      jql = boardFilter;
      
      // Add sprint filter to the board filter
      if (activeSprintId) {
        jql += ` AND sprint = ${activeSprintId}`;
      }
    } else {
      // Fallback to project filter if no board filter
      jql = `project = "${project}"`;
      
      if (activeSprintId) {
        jql += ` AND sprint = ${activeSprintId}`;
      } else {
        // If no active sprint found for this board, return empty results
        console.log(`No active sprint found for board ${board}, returning empty results`);
        return res.json({
          tickets: [],
          total: 0,
          sprintName: 'No Active Sprint',
          dateRange: 'No Active Sprint',
          activeSprintId: null
        });
      }
    }
    



    


    // Fetch tickets from Jira
    const url = `https://${JIRA_DOMAIN}/rest/api/3/search`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jql: jql,
        maxResults: 200,
        fields: ['summary', 'issuetype', 'status', 'assignee', 'customfield_10014', 'labels', 'created', 'updated', 'priority', 'parent']
      })
    });

    if (!response.ok) {
      console.error('Jira API response not ok:', response.status, response.statusText);
      return res.status(500).json({ error: 'Failed to fetch tickets from Jira' });
    }

    const data = await response.json();

    

    // Transform tickets to match our format
    const tickets = data.issues.map(issue => ({
      key: issue.key,
      summary: issue.fields.summary,
      type: issue.fields.issuetype?.name || 'Unknown',
      status: issue.fields.status?.name || 'Unknown',
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      storyPoints: issue.fields.customfield_10014 || 0, // Story points field
      labels: issue.fields.labels || [],
      created: issue.fields.created,
      updated: issue.fields.updated,
      priority: issue.fields.priority?.name || 'Medium',
      team: issue.fields.assignee?.displayName || 'Unassigned',
      epic: issue.fields.parent?.fields?.summary || 'No Epic'
    }));

    res.json({
      tickets: tickets,
      total: data.total,
      sprintName: activeSprintName || `${project} Sprint`,
      dateRange: activeSprintId ? `Sprint ${activeSprintId}` : 'Active Sprint',
      activeSprintId: activeSprintId
    });
  } catch (error) {
    console.error('Error fetching sprint tickets:', error);
    res.status(500).json({ error: 'Failed to fetch sprint tickets' });
  }
});





module.exports = router;
