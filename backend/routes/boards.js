const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Fetch boards from Jira project
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

    console.log('Fetching boards for project:', project);
    
    let allBoardsFromAPI = [];
    let startAt = 0;
    const maxResults = 50;
    let batchNumber = 1;
    let totalExpected = 0;
    
    while (true) {
      const url = `https://${JIRA_DOMAIN}/rest/agile/1.0/board?startAt=${startAt}&maxResults=${maxResults}`;
      console.log(`Fetching batch ${batchNumber} from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch boards: ${response.status}`);
        break;
      }

      const data = await response.json();
      
      if (batchNumber === 1) {
        totalExpected = data.total;
        console.log(`Total boards expected: ${totalExpected}`);
      }
      
      console.log(`Batch ${batchNumber} response:`, {
        valuesLength: data.values?.length || 0,
        total: data.total,
        isLast: data.isLast
      });
      
      if (data.values && data.values.length > 0) {
        allBoardsFromAPI = allBoardsFromAPI.concat(data.values);
        console.log(`Added ${data.values.length} boards. Total: ${allBoardsFromAPI.length}/${totalExpected}`);
      }
      
      if (data.isLast || !data.values || data.values.length === 0) {
        console.log(`Reached end. Total collected: ${allBoardsFromAPI.length}/${totalExpected}`);
        break;
      }
      
      startAt += maxResults;
      batchNumber++;
      
      if (batchNumber > 5) {
        console.log('Safety limit reached');
        break;
      }
    }
    
    console.log(`Finished fetching. Total: ${allBoardsFromAPI.length}`);
    
    const filteredProjectBoards = allBoardsFromAPI.filter(board => 
      board.location && board.location.projectKey === project
    );
    
    console.log(`Project boards: ${filteredProjectBoards.length}`);
    
    // Check for board 143
    const board143 = filteredProjectBoards.find(board => board.id === 143);
    if (board143) {
      console.log('✅ Board 143 found:', board143.name);
    } else {
      console.log('❌ Board 143 NOT found');
    }
    
    const boards = filteredProjectBoards.map(board => ({
      id: board.id,
      name: board.name,
      type: board.type,
      projectKey: board.location?.projectKey
    }));

    console.log(`Returning ${boards.length} boards`);
    res.json(boards);
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

module.exports = router;
