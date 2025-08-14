// Shared types for the diagram

export interface Ticket {
  key: string;
  summary: string;
  type: string;
  status: string;
  blocks: string[];
  blockedBy: string[];
  isCurrentSprint?: boolean;
  storyPoints?: number;
  assignee?: string;
  team?: string | { value: string; id: string; self: string };
  labels?: string[];
  epic?: string;
  created?: string;
  updated?: string;
  resolved?: string;
  timeSpent?: number;
  timeEstimate?: number;
}

export interface D3EpicDiagramProps {
  tickets: Ticket[];
  onRefresh?: () => void;
}

// Sprint Manager Types
export interface Sprint {
  id: string;
  name: string;
  state: string;
  startDate: string;
  endDate: string;
  goal: string;
  rapidViewId?: number;
}

export interface SprintMetrics {
  // Top Stats
  totalTickets: number;
  completedTickets: number;
  inProgressTickets: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  velocity: number;
  averageVelocity: number;
  velocityTrend: 'increasing' | 'decreasing' | 'stable';
  
  // Assignee Stats
  assigneeStats: Array<{
    name: string;
    tickets: number;
    storyPoints: number;
    completedTickets: number;
    completedStoryPoints: number;
    efficiency: number;
  }>;
  
  // Status Breakdown
  statusBreakdown: Record<string, number>;
  
  // Epic Analysis
  epicBreakdown: Array<{
    epic: string;
    tickets: number;
    storyPoints: number;
    percentage: number;
  }>;
  
  // Type Analysis
  typeBreakdown: Array<{
    type: string;
    tickets: number;
    storyPoints: number;
    percentage: number;
  }>;
  
  // Label Analysis (planned/unplanned/extra/claude)
  labelBreakdown: Array<{
    category: string;
    tickets: number;
    storyPoints: number;
    percentage: number;
  }>;
  
  // Velocity Analysis
  velocityHistory: Array<{
    sprint: string;
    velocity: number;
    date: string;
  }>;
  
  // Estimation vs Actual
  estimationAccuracy: {
    onTimePercentage: number;
    overTimePercentage: number;
    underTimePercentage: number;
    averageAccuracy: number;
    ticketAccuracy: Array<{
      key: string;
      summary: string;
      estimated: number;
      actual: number;
      accuracy: number;
      status: 'on-time' | 'over-time' | 'under-time';
    }>;
  };
  
  // Time Analysis
  timeMetrics: {
    totalEstimatedHours: number;
    totalActualHours: number;
    totalSpentHours: number;
    efficiency: number;
    averageCycleTime: number;
  };
} 