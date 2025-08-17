import { Ticket, SprintMetrics } from '../types';

export function calculateSprintMetrics(tickets: Ticket[]): SprintMetrics {
  // Helper function to check if a ticket is completed
  const isCompleted = (status: string): boolean => {
    const completedStatuses = [
      'Done', 'Closed', 'Resolved', 'Accepted', 'Complete', 'Finished', 
      'Verified', 'Deployed', 'Released', 'Live', 'Production Ready', 'Approved'
    ];
    return completedStatuses.some(completedStatus => 
      status.toLowerCase().includes(completedStatus.toLowerCase())
    );
  };

  // Helper function to check if a ticket is in progress
  const isInProgress = (status: string): boolean => {
    const inProgressStatuses = [
      'In Progress', 'QA', 'Review', 'Testing', 'Code Review', 
      'In Development', 'Development', 'QA Testing', 'Peer Review'
    ];
    return inProgressStatuses.some(progressStatus => 
      status.toLowerCase().includes(progressStatus.toLowerCase())
    );
  };

  // Filter out tickets without story points or with 0.1 story points for meaningful analysis
  const validTickets = tickets.filter(t => (t.storyPoints || 0) > 0.1);
  
  // Debug: Log all unique statuses to help identify what statuses are actually being used
  const uniqueStatuses = Array.from(new Set(tickets.map(t => t.status)));
  console.log('Available statuses in tickets:', uniqueStatuses);
  
  // Top Stats
  const totalTickets = validTickets.length;
  const completedTickets = validTickets.filter(t => isCompleted(t.status)).length;
  const inProgressTickets = validTickets.filter(t => isInProgress(t.status)).length;
  
  const totalStoryPoints = Math.round(validTickets.reduce((sum, t) => sum + (t.storyPoints || 0), 0) * 10) / 10;
  const completedStoryPoints = Math.round(validTickets
    .filter(t => isCompleted(t.status))
    .reduce((sum, t) => sum + (t.storyPoints || 0), 0) * 10) / 10;
  
  // Debug: Log calculation details
  console.log('Sprint Metrics Calculation:', {
    totalTickets: tickets.length,
    validTickets: validTickets.length,
    ticketsWithLowStoryPoints: tickets.filter(t => (t.storyPoints || 0) > 0 && (t.storyPoints || 0) <= 0.1).length,
    completedTickets,
    totalStoryPoints,
    completedStoryPoints,
    completionPercentage: totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0
  });
  
  const velocity = completedStoryPoints;
  const averageVelocity = totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalTickets) * 100) / 100 : 0;
  
  // Mock velocity trend (in real implementation, this would compare with previous sprints)
  const velocityTrend: 'increasing' | 'decreasing' | 'stable' = 
    completedStoryPoints > totalStoryPoints * 0.8 ? 'increasing' :
    completedStoryPoints < totalStoryPoints * 0.6 ? 'decreasing' : 'stable';

  // Assignee Stats
  const assigneeMap = new Map<string, {
    tickets: number;
    storyPoints: number;
    completedTickets: number;
    completedStoryPoints: number;
  }>();

  validTickets.forEach(ticket => {
    const assignee = ticket.assignee || 'Unassigned';
    const current = assigneeMap.get(assignee) || {
      tickets: 0,
      storyPoints: 0,
      completedTickets: 0,
      completedStoryPoints: 0
    };

    current.tickets++;
    current.storyPoints += ticket.storyPoints || 0;
    
    if (isCompleted(ticket.status)) {
      current.completedTickets++;
      current.completedStoryPoints += ticket.storyPoints || 0;
    }

    assigneeMap.set(assignee, current);
  });

  const assigneeStats = Array.from(assigneeMap.entries()).map(([name, stats]) => ({
    name,
    ...stats,
    efficiency: stats.storyPoints > 0 ? Math.round((stats.completedStoryPoints / stats.storyPoints) * 100) : 0
  })).sort((a, b) => b.efficiency - a.efficiency);

  // Status Breakdown
  const statusBreakdown = validTickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Epic Analysis
  const epicMap = new Map<string, { tickets: number; storyPoints: number }>();
  validTickets.forEach(ticket => {
    const epic = ticket.epic || 'No Epic';
    const current = epicMap.get(epic) || { tickets: 0, storyPoints: 0 };
    current.tickets++;
    current.storyPoints += ticket.storyPoints || 0;
    epicMap.set(epic, current);
  });

  const epicBreakdown = Array.from(epicMap.entries()).map(([epic, stats]) => ({
    epic,
    ...stats,
    percentage: Math.round((stats.storyPoints / totalStoryPoints) * 100)
  })).sort((a, b) => b.storyPoints - a.storyPoints);

  // Type Analysis
  const typeMap = new Map<string, { tickets: number; storyPoints: number }>();
  validTickets.forEach(ticket => {
    const type = ticket.type;
    const current = typeMap.get(type) || { tickets: 0, storyPoints: 0 };
    current.tickets++;
    current.storyPoints += ticket.storyPoints || 0;
    typeMap.set(type, current);
  });

  const typeBreakdown = Array.from(typeMap.entries()).map(([type, stats]) => ({
    type,
    ...stats,
    percentage: Math.round((stats.storyPoints / totalStoryPoints) * 100)
  })).sort((a, b) => b.storyPoints - a.storyPoints);

  // Label Analysis (planned/unplanned/extra/claude)
  // If there's no label for "extra" or "unplanned", the task is planned
  const categorizeByLabels = (ticket: Ticket): string => {
    const labels = ticket.labels || [];
    if (labels.includes('claude')) return 'Claude';
    if (labels.includes('unplanned')) return 'Unplanned';
    if (labels.includes('extra')) return 'Extra';
    
    // If no specific labels are found, categorize as planned
    return 'Planned';
  };

  const labelMap = new Map<string, { tickets: number; storyPoints: number }>();
  validTickets.forEach(ticket => {
    const category = categorizeByLabels(ticket);
    const current = labelMap.get(category) || { tickets: 0, storyPoints: 0 };
    current.tickets++;
    current.storyPoints += ticket.storyPoints || 0;
    labelMap.set(category, current);
  });

  const labelBreakdown = Array.from(labelMap.entries()).map(([category, stats]) => ({
    category,
    ...stats,
    percentage: Math.round((stats.storyPoints / totalStoryPoints) * 100)
  })).sort((a, b) => b.storyPoints - a.storyPoints);

  // Velocity History (removed for now)
  const velocityHistory = [
    { sprint: 'Current', velocity: velocity, date: new Date().toISOString() }
  ];



  // For real data, we'll use story points as a proxy for time
  const totalEstimatedHours = Math.round(validTickets.reduce((sum: number, t: Ticket) => sum + (t.storyPoints || 0), 0) * 10) / 10;
  const totalActualHours = Math.round(validTickets.reduce((sum: number, t: Ticket) => {
    const storyPoints = t.storyPoints || 0;
    return sum + (isCompleted(t.status) ? 
      storyPoints : storyPoints * 0.5);
  }, 0) * 10) / 10;
  const totalSpentHours = Math.round(validTickets.reduce((sum: number, t: Ticket) => sum + (t.storyPoints || 0), 0) * 10) / 10;

  return {
    // Top Stats
    totalTickets,
    completedTickets,
    inProgressTickets,
    totalStoryPoints,
    completedStoryPoints,
    velocity,
    averageVelocity,
    velocityTrend,

    // Assignee Stats
    assigneeStats,

    // Status Breakdown
    statusBreakdown,

    // Epic Analysis
    epicBreakdown,

    // Type Analysis
    typeBreakdown,

    // Label Analysis
    labelBreakdown,

    // Velocity Analysis
    velocityHistory,



    // Time Analysis
    timeMetrics: {
      totalEstimatedHours,
      totalActualHours,
      totalSpentHours,
      efficiency: totalActualHours > 0 ? Math.round((totalActualHours / totalEstimatedHours) * 100) : 100,
      averageCycleTime: validTickets.length > 0 ? Math.round(totalSpentHours / validTickets.length * 10) / 10 : 0
    }
  };
}
