import { Ticket, SprintMetrics } from '../types';

export function calculateSprintMetrics(tickets: Ticket[]): SprintMetrics {
  // Filter out tickets without story points for meaningful analysis
  const validTickets = tickets.filter(t => (t.storyPoints || 0) > 0);
  
  // Top Stats
  const totalTickets = validTickets.length;
  const completedTickets = validTickets.filter(t => 
    ['Done', 'Closed', 'Resolved', 'Accepted'].includes(t.status)
  ).length;
  const inProgressTickets = validTickets.filter(t => 
    ['In Progress', 'QA', 'Review'].includes(t.status)
  ).length;
  
  const totalStoryPoints = Math.round(validTickets.reduce((sum, t) => sum + (t.storyPoints || 0), 0) * 10) / 10;
  const completedStoryPoints = Math.round(validTickets
    .filter(t => ['Done', 'Closed', 'Resolved', 'Accepted'].includes(t.status))
    .reduce((sum, t) => sum + (t.storyPoints || 0), 0) * 10) / 10;
  
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
    
    if (['Done', 'Closed', 'Resolved', 'Accepted'].includes(ticket.status)) {
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

  // Estimation vs Actual Analysis
  // For real Jira data, we'll use story points as a proxy for time estimation
  const estimationTickets = validTickets.filter(t => t.storyPoints && t.storyPoints > 0);
  const onTimeTickets = estimationTickets.filter(t => {
    const storyPoints = t.storyPoints || 0;
    const actual = ['Done', 'Closed', 'Resolved', 'Accepted'].includes(t.status) ? 
      storyPoints : storyPoints * 0.5;
    return actual <= storyPoints;
  }).length;
  const overTimeTickets = estimationTickets.filter(t => {
    const storyPoints = t.storyPoints || 0;
    const actual = ['Done', 'Closed', 'Resolved', 'Accepted'].includes(t.status) ? 
      storyPoints : storyPoints * 0.5;
    return actual > storyPoints * 1.2;
  }).length;
  const underTimeTickets = estimationTickets.filter(t => {
    const storyPoints = t.storyPoints || 0;
    const actual = ['Done', 'Closed', 'Resolved', 'Accepted'].includes(t.status) ? 
      storyPoints : storyPoints * 0.5;
    return actual < storyPoints * 0.8;
  }).length;

  const ticketAccuracy = estimationTickets.map(ticket => {
    const storyPoints = ticket.storyPoints || 0;
    // For real data, we'll use story points as estimated effort
    // and completion status as a proxy for actual effort
    const estimated = Math.round(storyPoints * 10) / 10;
    const actual = Math.round((['Done', 'Closed', 'Resolved', 'Accepted'].includes(ticket.status) ? 
      storyPoints : storyPoints * 0.5) * 10) / 10; // Assume 50% completion for in-progress tickets
    const accuracy = estimated > 0 ? Math.round((actual / estimated) * 100) : 100;
    const status: 'on-time' | 'over-time' | 'under-time' = 
      actual <= estimated ? 'on-time' :
      actual > estimated * 1.2 ? 'over-time' : 'under-time';

    return {
      key: ticket.key,
      summary: ticket.summary,
      estimated,
      actual,
      accuracy,
      status
    };
  }).sort((a, b) => b.accuracy - a.accuracy);

  // For real data, we'll use story points as a proxy for time
  const totalEstimatedHours = Math.round(estimationTickets.reduce((sum, t) => sum + (t.storyPoints || 0), 0) * 10) / 10;
  const totalActualHours = Math.round(estimationTickets.reduce((sum, t) => {
    const storyPoints = t.storyPoints || 0;
    return sum + (['Done', 'Closed', 'Resolved', 'Accepted'].includes(t.status) ? 
      storyPoints : storyPoints * 0.5);
  }, 0) * 10) / 10;
  const totalSpentHours = Math.round(validTickets.reduce((sum, t) => sum + (t.storyPoints || 0), 0) * 10) / 10;

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

    // Estimation vs Actual
    estimationAccuracy: {
      onTimePercentage: estimationTickets.length > 0 ? Math.round((onTimeTickets / estimationTickets.length) * 100) : 0,
      overTimePercentage: estimationTickets.length > 0 ? Math.round((overTimeTickets / estimationTickets.length) * 100) : 0,
      underTimePercentage: estimationTickets.length > 0 ? Math.round((underTimeTickets / estimationTickets.length) * 100) : 0,
      averageAccuracy: estimationTickets.length > 0 ? Math.round(ticketAccuracy.reduce((sum, t) => sum + t.accuracy, 0) / estimationTickets.length) : 100,
      ticketAccuracy
    },

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
