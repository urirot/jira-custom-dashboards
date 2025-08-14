const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Fetch real teams from Jira project
router.get('/', async (req, res) => {
  try {
    const { project } = req.query;
    
    if (!project) {
      return res.status(400).json({ error: 'Project parameter is required' });
    }

    const { JIRA_API_TOKEN, JIRA_DOMAIN, JIRA_EMAIL } = process.env;
    if (!JIRA_API_TOKEN || !JIRA_DOMAIN || !JIRA_EMAIL) {
      return res.status(500).json({ error: 'Jira credentials not set in .env' });
    }

                    // Fetch recent issues to get assignees
                const url = `https://${JIRA_DOMAIN}/rest/api/3/search`;
                const response = await fetch(url, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    jql: `project = "${project}" AND assignee IS NOT EMPTY ORDER BY updated DESC`,
                    maxResults: 200,
                    fields: ['assignee', 'labels']
                  })
                });

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch teams from Jira' });
    }

    const data = await response.json();
    
                    // Extract unique assignees and team information
                const assignees = new Map();
                const teamLabels = new Set();
                
                data.issues.forEach(issue => {
                  if (issue.fields.assignee) {
                    const assignee = issue.fields.assignee;
                    if (!assignees.has(assignee.accountId)) {
                      assignees.set(assignee.accountId, {
                        key: assignee.accountId,
                        name: assignee.displayName,
                        email: assignee.emailAddress,
                        active: assignee.active
                      });
                    }
                  }
                  
                  // Extract team labels
                  if (issue.fields.labels) {
                    issue.fields.labels.forEach(label => {
                      if (label.toLowerCase().includes('team') || 
                          label.toLowerCase().includes('applications') ||
                          label.toLowerCase().includes('indivilage') ||
                          label.toLowerCase().includes('mtm') ||
                          label.toLowerCase().includes('apex') ||
                          label.toLowerCase().includes('anolytics')) {
                        teamLabels.add(label);
                      }
                    });
                  }
                });

                // Convert to array and filter active users
                const teams = Array.from(assignees.values())
                  .filter(assignee => assignee.active)
                  .map(assignee => ({
                    key: assignee.key,
                    name: assignee.name
                  }));

                // Add team labels as teams
                Array.from(teamLabels).forEach(label => {
                  teams.push({
                    key: label.toUpperCase(),
                    name: label
                  });
                });

                // Add "All Teams" option
                teams.unshift({ key: "ALL", name: "All Teams" });

    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

module.exports = router;
