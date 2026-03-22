import { EventEmitter } from "node:events";
import type { DomainEvent } from "./types";

class DomainEventBus extends EventEmitter {
  emitDomain(event: DomainEvent) {
    this.emit("domain", event);
  }

  onDomain(handler: (event: DomainEvent) => void) {
    this.on("domain", handler);
  }
}

export const eventBus = new DomainEventBus();

/** Convenience: emit a domain event from any route handler */
export function emitDomainEvent(event: DomainEvent) {
  eventBus.emitDomain(event);
}
