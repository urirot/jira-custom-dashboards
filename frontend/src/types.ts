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
}

export interface D3EpicDiagramProps {
  tickets: Ticket[];
  onRefresh?: () => void;
} 