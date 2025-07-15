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
}

export interface D3EpicDiagramProps {
  tickets: Ticket[];
  onRefresh?: () => void;
} 