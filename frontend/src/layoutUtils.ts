import { Ticket } from "./types";
import { wrapText, buildLevelMap } from "./utils/d3Utils";
import {
  BOX_WIDTH,
  MIN_BOX_HEIGHT,
  VERTICAL_GAP,
  HORIZONTAL_GAP,
  DIAGRAM_PADDING,
  SUMMARY_FONT_SIZE,
  SUMMARY_LINE_HEIGHT,
  SUMMARY_PADDING,
} from "./constants";

export interface DiagramLayout {
  positions: Record<string, { x: number; y: number }>;
  ticketHeights: Record<string, number>;
  frameBoundingBoxes: { minX: number; minY: number; maxX: number; maxY: number }[];
  frameRoots: Set<string>;
  groupedKeys: Set<string>;
  groups: Ticket[][];
  unframed: Ticket[];
  diagramWidth: number;
  diagramHeight: number;
  minDiagramX: number;
  maxDiagramX: number;
  maxDiagramY: number;
}

export function computeDiagramLayout(tickets: Ticket[]): DiagramLayout {
  const yOffset = 10; // Reduced from 180 to reduce top padding
  const ticketMap: Record<string, Ticket> = {};
  tickets.forEach((t) => {
    ticketMap[t.key] = t;
  });

  // 1. Find all connected groups (frames) in the blocks/blockedBy graph
  const visited = new Set<string>();
  const groups: Ticket[][] = [];
  function dfs(key: string, group: Set<string>) {
    if (visited.has(key)) return;
    visited.add(key);
    group.add(key);
    const t = ticketMap[key];
    if (!t) return;
    [...t.blocks, ...t.blockedBy].forEach((linkedKey) => {
      if (ticketMap[linkedKey]) dfs(linkedKey, group);
    });
  }
  tickets.forEach((t) => {
    if (!visited.has(t.key) && (t.blocks.length > 0 || t.blockedBy.length > 0)) {
      const group = new Set<string>();
      dfs(t.key, group);
      if (group.size > 0) groups.push(Array.from(group).map((k) => ticketMap[k]));
    }
  });

  // 2. Find unframed items (not in any group)
  const groupedKeys = new Set(groups.flat().map((t) => t.key));
  const unframed = tickets.filter((t) => !groupedKeys.has(t.key));

  // 3. Frame-to-frame meta-graph
  const frameBlocks: number[][] = [];
  for (let i = 0; i < groups.length; i++) {
    frameBlocks[i] = [];
    const groupA = groups[i];
    for (let j = 0; j < groups.length; j++) {
      if (i === j) continue;
      const groupB = groups[j];
      if (groupA.some(a => a.blocks.some(b => groupB.map(t => t.key).includes(b)))) {
        frameBlocks[i].push(j);
      }
    }
  }
  // Frame levels: bottom = frames that don't block any other frame
  const frameLevels: number[] = Array(groups.length).fill(0);
  function assignFrameLevel(idx: number, level: number) {
    if (frameLevels[idx] == null || frameLevels[idx] < level) {
      frameLevels[idx] = level;
      frameBlocks[idx].forEach(childIdx => assignFrameLevel(childIdx, level + 1));
    }
  }
  const frameLeaves = groups.map((g, i) => i).filter(i => frameBlocks[i].length === 0);
  frameLeaves.forEach(idx => assignFrameLevel(idx, 0));

  const frameYStart = yOffset + DIAGRAM_PADDING;
  const framePositions: { x: number; y: number; width: number; groupIdx: number }[] = [];

  // --- Calculate ticket positions and frame bounding boxes first (to get true frame widths) ---
  const positions: Record<string, { x: number; y: number }> = {};
  const ticketHeights: Record<string, number> = {};
  const frameBoundingBoxes: { minX: number; minY: number; maxX: number; maxY: number }[] = [];
  const frameRoots: Set<string> = new Set();
  groups.forEach((group, groupIdx) => {
    const levelMap = buildLevelMap(group);
    const maxLevel = Math.max(...Object.values(levelMap));
    const levels: Ticket[][] = Array.from({ length: maxLevel + 1 }, () => []);
    Object.entries(levelMap).forEach(([key, lvl]) => {
      const t = ticketMap[key];
      if (t) levels[lvl].push(t);
    });
    // Find root(s): tickets that are only blockedBy (never block anything in the group)
    const groupKeys = new Set(group.map(t => t.key));
    group.forEach(t => {
      const blocksInGroup = t.blocks.filter(b => groupKeys.has(b));
      if (blocksInGroup.length === 0) {
        frameRoots.add(t.key);
      }
    });
    // Layout: each level is a row, from top to bottom
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let yCursor = frameYStart + 24; // Start at top of frame with padding
    for (let lvl = 0; lvl <= maxLevel; lvl++) {
      const row = levels[lvl];
      // Calculate actual height for each ticket in the row
      const heights = row.map(ticket => {
        const summary = ticket.summary || '';
        const summaryLines = wrapText(summary, BOX_WIDTH, SUMMARY_FONT_SIZE, SUMMARY_PADDING);
        const summaryHeight = summaryLines.length * SUMMARY_LINE_HEIGHT;
        return Math.max(MIN_BOX_HEIGHT, 70 + summaryHeight + 36); // Add extra height for assignee row
      });
      const maxRowHeight = Math.max(...heights, MIN_BOX_HEIGHT);
      const y = yCursor;
      const totalRowWidth = row.length * (BOX_WIDTH + HORIZONTAL_GAP) - HORIZONTAL_GAP;
      const startX = 24 + Math.max(0, (totalRowWidth < 0 ? 0 : 0)); // No extra centering, just left padding
      row.forEach((ticket, i) => {
        const x = startX + i * (BOX_WIDTH + HORIZONTAL_GAP);
        positions[ticket.key] = { x, y };
        ticketHeights[ticket.key] = heights[i];
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x + BOX_WIDTH > maxX) maxX = x + BOX_WIDTH;
        if (y + heights[i] > maxY) maxY = y + heights[i];
      });
      yCursor = y + maxRowHeight + VERTICAL_GAP;
    }
    frameBoundingBoxes.push({ minX, minY, maxX, maxY });
  });

  // --- Position frames using bounding boxes for consistent spacing ---
  const frameGap = 30; // px between dashed borders (minimal gap)
  const borderBuffer = 10; // px buffer on each side to account for border stroke
  let diagramWidth = 0;
  let currentX = DIAGRAM_PADDING;
  const frameY = frameYStart;
  for (let i = 0; i < frameBoundingBoxes.length; i++) {
    const box = frameBoundingBoxes[i];
    const width = (box.maxX - box.minX) + 2 * borderBuffer;
    // Position this frame so its minX-borderBuffer aligns with currentX
    const shiftX = currentX - (box.minX - borderBuffer);
    // Shift all ticket positions in this frame
    groups[i].forEach(ticket => {
      positions[ticket.key].x += shiftX;
    });
    // Update bounding box for this frame
    frameBoundingBoxes[i] = {
      minX: box.minX + shiftX,
      minY: box.minY,
      maxX: box.maxX + shiftX,
      maxY: box.maxY,
    };
    // Save frame position for rendering
    framePositions.push({ x: currentX, y: frameY, width, groupIdx: i });
    currentX += width + frameGap;
    if (diagramWidth < currentX + DIAGRAM_PADDING) diagramWidth = currentX + DIAGRAM_PADDING;
  }

  // --- Recalculate maxFrameHeight after shifting frames ---
  let maxFrameHeight = 0;
  frameBoundingBoxes.forEach(box => {
    const height = box.maxY - box.minY;
    if (height > maxFrameHeight) maxFrameHeight = height;
  });

  // --- The rest of the code (unframed tickets, diagramHeight, etc.) remains unchanged ---
  // Position unframed tickets below frames with proper spacing
  const unframedY = frameYStart + maxFrameHeight + 120;
  if (unframed.length > 0) {
    const unframedWidth = unframed.length * (BOX_WIDTH + HORIZONTAL_GAP) - HORIZONTAL_GAP + 2 * 24;
    if (diagramWidth < unframedWidth + 2 * DIAGRAM_PADDING) diagramWidth = unframedWidth + 2 * DIAGRAM_PADDING;
  }
  
  const diagramHeight = maxFrameHeight + (unframed.length > 0 ? 120 + 180 : 0) + DIAGRAM_PADDING * 2 + 120; // Add extra 120px bottom padding

  // 5. Position tickets within frames (bottom-up by group-internal dependency)
  // This section remains unchanged as it only modifies ticket positions within frames,
  // not the overall diagram layout or frame positioning.
  framePositions.forEach(({ x: frameX, y: frameY, width, groupIdx }) => {
    const group = groups[groupIdx];
    const levelMap = buildLevelMap(group);
    const maxLevel = Math.max(...Object.values(levelMap));
    const levels: Ticket[][] = Array.from({ length: maxLevel + 1 }, () => []);
    Object.entries(levelMap).forEach(([key, lvl]) => {
      const t = ticketMap[key];
      if (t) levels[lvl].push(t);
    });
    // Find root(s): tickets that are only blockedBy (never block anything in the group)
    const groupKeys = new Set(group.map(t => t.key));
    group.forEach(t => {
      const blocksInGroup = t.blocks.filter(b => groupKeys.has(b));
      if (blocksInGroup.length === 0) {
        frameRoots.add(t.key);
      }
    });
    // Layout: each level is a row, from top to bottom
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let yCursor = frameY + 24; // Start at top of frame with padding
    for (let lvl = 0; lvl <= maxLevel; lvl++) {
      const row = levels[lvl];
      // Calculate actual height for each ticket in the row
      const heights = row.map(ticket => {
        const summary = ticket.summary || '';
        const summaryLines = wrapText(summary, BOX_WIDTH, SUMMARY_FONT_SIZE, SUMMARY_PADDING);
        const summaryHeight = summaryLines.length * SUMMARY_LINE_HEIGHT;
        return Math.max(MIN_BOX_HEIGHT, 70 + summaryHeight + 36); // Add extra height for assignee row
      });
      const maxRowHeight = Math.max(...heights, MIN_BOX_HEIGHT);
      const y = yCursor;
      const totalRowWidth = row.length * (BOX_WIDTH + HORIZONTAL_GAP) - HORIZONTAL_GAP;
      const startX = frameX + Math.max(24, (width - totalRowWidth) / 2);
      row.forEach((ticket, i) => {
        const x = startX + i * (BOX_WIDTH + HORIZONTAL_GAP);
        positions[ticket.key] = { x, y };
        ticketHeights[ticket.key] = heights[i];
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x + BOX_WIDTH > maxX) maxX = x + BOX_WIDTH;
        if (y + heights[i] > maxY) maxY = y + heights[i];
      });
      yCursor = y + maxRowHeight + VERTICAL_GAP;
    }
  });
  // Unframed tickets at the bottom
  unframed.forEach((ticket, i) => {
    const summary = ticket.summary || '';
    const summaryLines = wrapText(summary, BOX_WIDTH, SUMMARY_FONT_SIZE, SUMMARY_PADDING);
    const summaryHeight = summaryLines.length * SUMMARY_LINE_HEIGHT;
    const height = Math.max(MIN_BOX_HEIGHT, 70 + summaryHeight + 36); // Add extra height for assignee row
    const x = DIAGRAM_PADDING + 24 + i * (BOX_WIDTH + HORIZONTAL_GAP);
    const y = unframedY + 24; // Start at top of unframed area with padding
    positions[ticket.key] = { x, y };
    ticketHeights[ticket.key] = height;
  });
  // Offset all y positions by yOffset (fixed positive value)
  Object.keys(positions).forEach((key) => {
    positions[key].y += yOffset;
  });
  frameBoundingBoxes.forEach((box, idx) => {
    frameBoundingBoxes[idx] = {
      minX: box.minX,
      minY: box.minY + yOffset,
      maxX: box.maxX,
      maxY: box.maxY + yOffset + 60,
    };
  });
  // Calculate overall diagram bounding box
  let minDiagramX = Infinity, minDiagramY = Infinity, maxDiagramX = -Infinity, maxDiagramY = -Infinity;
  Object.keys(positions).forEach(key => {
    const x = positions[key].x;
    const y = positions[key].y;
    const height = ticketHeights[key];
    if (x < minDiagramX) minDiagramX = x;
    if (y < minDiagramY) minDiagramY = y;
    if (x + BOX_WIDTH > maxDiagramX) maxDiagramX = x + BOX_WIDTH;
    if (y + height > maxDiagramY) maxDiagramY = y + height;
  });
  
  minDiagramX -= DIAGRAM_PADDING;
  maxDiagramX += DIAGRAM_PADDING;
  maxDiagramY += DIAGRAM_PADDING + 120;
  return {
    positions,
    ticketHeights,
    frameBoundingBoxes,
    frameRoots,
    groupedKeys,
    groups,
    unframed,
    diagramWidth,
    diagramHeight,
    minDiagramX,
    maxDiagramX,
    maxDiagramY,
  };
} 