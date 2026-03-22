import type { PresenceInfo } from "./types";

const STALE_THRESHOLD_MS = 60_000; // evict after 60s without heartbeat

export class PresenceManager {
  private state = new Map<number, Map<string, PresenceInfo>>();

  join(workspaceId: number, info: PresenceInfo) {
    let workspace = this.state.get(workspaceId);
    if (!workspace) {
      workspace = new Map();
      this.state.set(workspaceId, workspace);
    }
    workspace.set(info.userId, info);
  }

  leave(workspaceId: number, userId: string) {
    const workspace = this.state.get(workspaceId);
    if (!workspace) return;
    workspace.delete(userId);
    if (workspace.size === 0) this.state.delete(workspaceId);
  }

  heartbeat(workspaceId: number, userId: string) {
    const workspace = this.state.get(workspaceId);
    const entry = workspace?.get(userId);
    if (entry) entry.lastHeartbeat = Date.now();
  }

  setViewing(workspaceId: number, userId: string, eventName: string | null): boolean {
    const workspace = this.state.get(workspaceId);
    const entry = workspace?.get(userId);
    if (!entry) return false;
    const changed = entry.viewingEvent !== (eventName ?? undefined);
    entry.viewingEvent = eventName ?? undefined;
    entry.lastHeartbeat = Date.now();
    return changed;
  }

  getPresence(workspaceId: number): PresenceInfo[] {
    const workspace = this.state.get(workspaceId);
    if (!workspace) return [];
    return Array.from(workspace.values());
  }

  /** Remove entries that haven't sent a heartbeat recently. Returns evicted userIds per workspace. */
  evictStale(): Map<number, string[]> {
    const now = Date.now();
    const evicted = new Map<number, string[]>();

    this.state.forEach((workspace, workspaceId) => {
      const stale: string[] = [];
      workspace.forEach((info, userId) => {
        if (now - info.lastHeartbeat > STALE_THRESHOLD_MS) {
          stale.push(userId);
        }
      });
      if (stale.length > 0) {
        stale.forEach((id) => workspace.delete(id));
        evicted.set(workspaceId, stale);
      }
      if (workspace.size === 0) this.state.delete(workspaceId);
    });

    return evicted;
  }
}

export const presenceManager = new PresenceManager();
