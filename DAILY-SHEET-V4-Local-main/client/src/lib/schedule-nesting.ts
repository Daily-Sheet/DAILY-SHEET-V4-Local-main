import { getLocalTimeMinutes } from "@/lib/timeUtils";

export type ScheduleNode = {
  item: any;
  children: ScheduleNode[];
};

function toMinutes(dateVal: any): number {
  return getLocalTimeMinutes(dateVal);
}

function itemStartMinutes(item: any): number {
  return toMinutes(item.startTime) + (item.isNextDay ? 24 * 60 : 0);
}

function endMinutes(item: any): number {
  const offset = item.isNextDay ? 24 * 60 : 0;
  if (!item.endTime) return toMinutes(item.startTime) + offset;
  let end = toMinutes(item.endTime) + offset;
  const start = toMinutes(item.startTime) + offset;
  if (end < start) end += 24 * 60;
  return end;
}

export function buildNestedSchedule(items: any[]): ScheduleNode[] {
  const nodes: ScheduleNode[] = [];
  const sorted = [...items].sort((a, b) => {
    const startDiff = itemStartMinutes(a) - itemStartMinutes(b);
    if (startDiff !== 0) return startDiff;
    const durA = endMinutes(a) - itemStartMinutes(a);
    const durB = endMinutes(b) - itemStartMinutes(b);
    return durB - durA;
  });

  for (const item of sorted) {
    const start = itemStartMinutes(item);
    const end = endMinutes(item);

    const insertInto = (nodeList: ScheduleNode[]): boolean => {
      for (let i = nodeList.length - 1; i >= 0; i--) {
        const parent = nodeList[i];
        const pStart = itemStartMinutes(parent.item);
        const pEnd = endMinutes(parent.item);
        if (pEnd - pStart <= 0) continue;
        if (start >= pStart && end <= pEnd && start < pEnd && (start !== pStart || end !== pEnd)) {
          if (!insertInto(parent.children)) {
            parent.children.push({ item, children: [] });
          }
          return true;
        }
      }
      return false;
    }

    if (!insertInto(nodes)) {
      nodes.push({ item, children: [] });
    }
  }
  return nodes;
}

export function flattenNested(nodes: ScheduleNode[], depth = 0): { item: any; depth: number }[] {
  const result: { item: any; depth: number }[] = [];
  for (const node of nodes) {
    result.push({ item: node.item, depth });
    if (node.children.length > 0) {
      result.push(...flattenNested(node.children, depth + 1));
    }
  }
  return result;
}
