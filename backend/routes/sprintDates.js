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

    // Try to fetch sprints for the board with state filter
    let sprintsUrl = `https://${JIRA_DOMAIN}/rest/agile/1.0/board/${projectBoard.id}/sprint?state=active,future`;
    let sprintsResponse = await fetch(sprintsUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
        'Accept': 'application/json',
      },
    });

    // If that fails, try without state filter
    if (!sprintsResponse.ok) {
      sprintsUrl = `https://${JIRA_DOMAIN}/rest/agile/1.0/board/${projectBoard.id}/sprint`;
      sprintsResponse = await fetch(sprintsUrl, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
          'Accept': 'application/json',
        },
      });
    }

    if (!sprintsResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch sprints from Jira' });
    }

    const sprintsData = await sprintsResponse.json();
    
    // Find current/active sprint - prioritize active over future
    let currentSprint = sprintsData.values.find(sprint => 
      sprint.state === 'active'
    );
                
                // If no active sprint, look for future sprints
                if (!currentSprint) {
                  currentSprint = sprintsData.values.find(sprint => 
                    sprint.state === 'future'
                  );
                }

                if (!currentSprint) {
                  // No active sprint found via board API, try JQL search
                  console.log(`No active or future sprint found for board ${projectBoard.id} in project ${project}`);
                  console.log(`Trying JQL search for active sprints...`);
                  
                  try {
                    // Try multiple JQL queries to find active sprints
                    const jqlQueries = [
                      `project = "${project}" AND sprint IS NOT EMPTY AND sprint in openSprints()`,
                      `project = "${project}" AND sprint IS NOT EMPTY`,
                      `project = "${project}" AND sprint IS NOT EMPTY AND status != "Done"`
                    ];
                    
                    for (let i = 0; i < jqlQueries.length; i++) {
                      const jql = jqlQueries[i];
                      
                      const jqlUrl = `https://${JIRA_DOMAIN}/rest/api/3/search`;
                      const jqlBody = {
                        jql: jql,
                        maxResults: 10,
                        fields: ['sprint', 'status']
                      };
                      
                      const jqlResponse = await fetch(jqlUrl, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
                          'Accept': 'application/json',
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(jqlBody)
                      });
                      
                      if (jqlResponse.ok) {
                        const jqlData = await jqlResponse.json();
                        
                        if (jqlData.issues && jqlData.issues.length > 0) {
                          // Find the first issue with sprint information
                          for (const issue of jqlData.issues) {
                            if (issue.fields.sprint && issue.fields.sprint.length > 0) {
                              const sprint = issue.fields.sprint[0];
                              
                              return res.json({
                                startDate: sprint.startDate ? sprint.startDate.split('T')[0] : null,
                                endDate: sprint.endDate ? sprint.endDate.split('T')[0] : null,
                                sprintName: sprint.name,
                                sprintId: sprint.id.toString()
                              });
                            }
                          }
                        }
                      }
                    }
                  } catch (jqlError) {
                    // JQL search failed, continue to next method
                  }
                  
                  // Try direct sprint search as last resort
                  try {
                    const sprintSearchUrl = `https://${JIRA_DOMAIN}/rest/agile/1.0/sprint?state=active,future&maxResults=50`;
                    const sprintSearchResponse = await fetch(sprintSearchUrl, {
                      headers: {
                        'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
                        'Accept': 'application/json',
                      },
                    });
                    
                    if (sprintSearchResponse.ok) {
                      const sprintSearchData = await sprintSearchResponse.json();
                      
                      if (sprintSearchData.values && sprintSearchData.values.length > 0) {
                        // Find a sprint that might be related to our project
                        const relevantSprint = sprintSearchData.values.find(sprint => 
                          sprint.name.toLowerCase().includes(project.toLowerCase()) ||
                          sprint.name.toLowerCase().includes('sprint')
                        );
                        
                        if (relevantSprint) {
                          return res.json({
                            startDate: relevantSprint.startDate ? relevantSprint.startDate.split('T')[0] : null,
                            endDate: relevantSprint.endDate ? relevantSprint.endDate.split('T')[0] : null,
                            sprintName: relevantSprint.name,
                            sprintId: relevantSprint.id.toString()
                          });
                        }
                      }
                    }
                  } catch (sprintSearchError) {
                    // Direct sprint search failed, continue to final fallback
                  }
                  
                  // If all methods fail, return null
                  return res.json({
                    startDate: null,
                    endDate: null,
                    sprintName: null,
                    sprintId: null
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
