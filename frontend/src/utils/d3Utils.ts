import { Ticket } from "../types";

export function getJiraUrl(ticketKey: string) {
  return `https://taranis.atlassian.net/browse/${ticketKey}`;
}

export function getBoxColor(ticket: Ticket) {
  const status = ticket.status.toLowerCase();
  if (["released", "accepted", "approved"].includes(status)) return "#b6e8c9"; // green
  return "#fff";
}

export function getTextColor(ticket: Ticket) {
  return "#222";
}

export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  padding: number
) {
  const charsPerLine = Math.floor((maxWidth - 2 * padding) / (fontSize * 0.6));
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  words.forEach((word) => {
    if ((currentLine + " " + word).trim().length > charsPerLine) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += " " + word;
    }
  });
  if (currentLine) lines.push(currentLine.trim());
  return lines;
}

export function buildLevelMap(group: Ticket[]): { [key: string]: number } {
  const levelMap: { [key: string]: number } = {};
  const groupKeys = new Set(group.map((t) => t.key));
  const leaves = group.filter(
    (t) => t.blocks.filter((b) => groupKeys.has(b)).length === 0
  );
  function assignLevel(ticket: Ticket, level: number) {
    if (levelMap[ticket.key] == null || levelMap[ticket.key] < level) {
      levelMap[ticket.key] = level;
      group.forEach((parent) => {
        if (parent.blocks.includes(ticket.key)) {
          assignLevel(parent, level + 1);
        }
      });
    }
  }
  leaves.forEach((leaf) => assignLevel(leaf, 0));
  return levelMap;
}

export interface EstimationPerformance {
  onTimePercentage: number;
  overTimePercentage: number;
  totalEstimatedDays: number;
  totalActualDays: number;
  efficiencyPercentage: number;
  ticketPerformance: Array<{
    key: string;
    summary: string;
    storyPoints: number;
    estimatedDays: number;
    actualDays: number;
    performance: 'on-time' | 'over-time' | 'under-time';
    efficiency: number;
  }>;
}

export function calculateEstimationPerformance(tickets: Ticket[]): EstimationPerformance {
  // For now, we'll use mock data since we don't have access to Jira history
  // In a real implementation, this would query Jira API for ticket history
  const completedTickets = tickets.filter(t => 
    ['Accepted', 'Approved', 'Completed', 'Released'].includes(t.status) &&
    (t.storyPoints || 0) > 0.1 // Filter out tickets with 0.1 or less story points
  );

  const ticketPerformance = completedTickets.map(ticket => {
    const storyPoints = ticket.storyPoints || 0;
    // Mock: assume 1 story point = 1 day (standard agile estimation)
    const estimatedDays = storyPoints;
    // Mock: generate realistic actual days (slightly varied from estimated)
    const actualDays = Math.max(1, estimatedDays + (Math.random() - 0.5) * 2);
    
    const performance: 'on-time' | 'over-time' | 'under-time' = actualDays <= estimatedDays ? 'on-time' : 'over-time';
    const efficiency = estimatedDays > 0 ? (estimatedDays / actualDays) * 100 : 100;
    
    return {
      key: ticket.key,
      summary: ticket.summary,
      storyPoints,
      estimatedDays,
      actualDays: Math.round(actualDays * 10) / 10, // Round to 1 decimal
      performance,
      efficiency: Math.round(efficiency * 10) / 10
    };
  }).sort((a, b) => a.efficiency - b.efficiency); // Sort by efficiency (ascending)

  const totalEstimatedDays = ticketPerformance.reduce((sum, t) => sum + t.estimatedDays, 0);
  const totalActualDays = ticketPerformance.reduce((sum, t) => sum + t.actualDays, 0);
  
  const onTimeTickets = ticketPerformance.filter(t => t.performance === 'on-time').length;
  const overTimeTickets = ticketPerformance.filter(t => t.performance === 'over-time').length;
  
  const onTimePercentage = completedTickets.length > 0 ? 
    Math.round((onTimeTickets / completedTickets.length) * 100) : 0;
  const overTimePercentage = completedTickets.length > 0 ? 
    Math.round((overTimeTickets / completedTickets.length) * 100) : 0;
  
  const efficiencyPercentage = totalEstimatedDays > 0 ? 
    Math.round((totalEstimatedDays / totalActualDays) * 100) : 100;

  return {
    onTimePercentage,
    overTimePercentage,
    totalEstimatedDays: Math.round(totalEstimatedDays * 10) / 10,
    totalActualDays: Math.round(totalActualDays * 10) / 10,
    efficiencyPercentage,
    ticketPerformance
  };
} 