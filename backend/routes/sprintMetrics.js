const express = require('express');
const router = express.Router();

// Mock sprint data - in real implementation, this would fetch from Jira API
router.get('/:sprintId', async (req, res) => {
  try {
    const { sprintId } = req.params;
    
    // Mock sprint tickets data
    const mockTickets = [
      {
        key: "PROJ-101",
        summary: "Implement user authentication",
        type: "Story",
        status: "Done",
        blocks: [],
        blockedBy: [],
        storyPoints: 8,
        assignee: "John Doe",
        labels: ["planned"],
        epic: "User Management",
        timeEstimate: 16,
        timeSpent: 14
      },
      {
        key: "PROJ-102",
        summary: "Fix login bug",
        type: "Bug",
        status: "Done",
        blocks: [],
        blockedBy: [],
        storyPoints: 3,
        assignee: "Jane Smith",
        labels: ["unplanned"],
        epic: "User Management",
        timeEstimate: 4,
        timeSpent: 6
      },
      {
        key: "PROJ-103",
        summary: "Add password reset feature",
        type: "Story",
        status: "In Progress",
        blocks: [],
        blockedBy: [],
        storyPoints: 5,
        assignee: "John Doe",
        labels: ["planned"],
        epic: "User Management",
        timeEstimate: 10,
        timeSpent: 8
      },
      {
        key: "PROJ-104",
        summary: "Optimize database queries",
        type: "Story",
        status: "Done",
        blocks: [],
        blockedBy: [],
        storyPoints: 13,
        assignee: "Mike Johnson",
        labels: ["claude"],
        epic: "Performance",
        timeEstimate: 20,
        timeSpent: 18
      },
      {
        key: "PROJ-105",
        summary: "Add email notifications",
        type: "Story",
        status: "QA",
        blocks: [],
        blockedBy: [],
        storyPoints: 5,
        assignee: "Jane Smith",
        labels: ["planned"],
        epic: "Notifications",
        timeEstimate: 8,
        timeSpent: 12
      },
      {
        key: "PROJ-106",
        summary: "Update documentation",
        type: "Task",
        status: "Done",
        blocks: [],
        blockedBy: [],
        storyPoints: 2,
        assignee: "Mike Johnson",
        labels: ["extra"],
        epic: "Documentation",
        timeEstimate: 3,
        timeSpent: 2
      },
      {
        key: "PROJ-107",
        summary: "Setup CI/CD pipeline",
        type: "Story",
        status: "Done",
        blocks: [],
        blockedBy: [],
        storyPoints: 8,
        assignee: "John Doe",
        labels: ["planned"],
        epic: "Infrastructure",
        timeEstimate: 12,
        timeSpent: 15
      },
      {
        key: "PROJ-108",
        summary: "Fix mobile responsive issues",
        type: "Bug",
        status: "In Progress",
        blocks: [],
        blockedBy: [],
        storyPoints: 3,
        assignee: "Jane Smith",
        labels: ["unplanned"],
        epic: "UI/UX",
        timeEstimate: 5,
        timeSpent: 4
      }
    ];

    res.json({
      sprintId,
      tickets: mockTickets,
      message: 'Sprint metrics calculated from ticket data'
    });
  } catch (error) {
    console.error('Error fetching sprint metrics:', error);
    res.status(500).json({ error: 'Failed to fetch sprint metrics' });
  }
});

module.exports = router;
