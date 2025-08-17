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

 