import { Process, ScheduledProcess, GanttSlot } from "../types/process";
import { deepClone } from "../utils/clone";

/* ---------------------------------- */
/* Internal strict type                */
/* ---------------------------------- */

interface PriorityProcess extends Process {
  priority: number;   // REQUIRED
  remaining?: number; // only used in preemptive
}

/* ---------------------------------- */
/* Priority – Non-Preemptive           */
/* ---------------------------------- */

export function priorityNonPreemptive(
  processes: Process[]
): {
  result: ScheduledProcess[];
  gantt: GanttSlot[];
} {
  const incoming: PriorityProcess[] = deepClone(processes)
    .map(p => {
      if (p.priority === undefined) {
        throw new Error(`Process ${p.id} is missing priority`);
      }
      return { ...p, priority: p.priority };
    })
    .sort((a, b) => a.arrival - b.arrival);

  const ready: PriorityProcess[] = [];
  const completed: ScheduledProcess[] = [];
  const gantt: GanttSlot[] = [];

  let time = 0;
  let index = 0;

  while (index < incoming.length || ready.length > 0) {
    while (index < incoming.length && incoming[index].arrival <= time) {
      ready.push(incoming[index]);
      index++;
    }

    if (ready.length === 0) {
      time++;
      continue;
    }

    ready.sort((a, b) => a.priority - b.priority);
    const current = ready.shift()!;

    const start = time;
    time += current.burst;

    gantt.push({
      processId: current.id,
      start,
      end: time
    });

    const turnaround = time - current.arrival;
    const waiting = turnaround - current.burst;

    completed.push({
      ...current,
      waiting,
      turnaround
    });
  }

  return { result: completed, gantt };
}

/* ---------------------------------- */
/* Priority – Preemptive               */
/* ---------------------------------- */

export function priorityPreemptive(
  processes: Process[]
): {
  result: ScheduledProcess[];
  gantt: GanttSlot[];
} {
  const incoming: PriorityProcess[] = deepClone(processes)
    .map(p => {
      if (p.priority === undefined) {
        throw new Error(`Process ${p.id} is missing priority`);
      }
      return {
        ...p,
        priority: p.priority,
        remaining: p.burst
      };
    })
    .sort((a, b) => a.arrival - b.arrival);

  const ready: PriorityProcess[] = [];
  const completed: ScheduledProcess[] = [];
  const gantt: GanttSlot[] = [];

  let time = 0;
  let index = 0;
  let current: PriorityProcess | null = null;

  while (index < incoming.length || ready.length > 0 || current) {
    // Admit arrivals
    while (index < incoming.length && incoming[index].arrival <= time) {
      ready.push(incoming[index]);
      index++;
    }

    // Decide preemption
    if (current) {
      ready.push(current);
      current = null;
    }

    if (ready.length === 0) {
      time++;
      continue;
    }

    ready.sort((a, b) => a.priority - b.priority);
    current = ready.shift()!;

    const start = time;
    time++;
    current.remaining!--;

    // Merge Gantt slots
    if (
      gantt.length > 0 &&
      gantt[gantt.length - 1].processId === current.id
    ) {
      gantt[gantt.length - 1].end = time;
    } else {
      gantt.push({
        processId: current.id,
        start,
        end: time
      });
    }

    if (current.remaining === 0) {
      const turnaround = time - current.arrival;
      const waiting = turnaround - current.burst;

      completed.push({
        id: current.id,
        arrival: current.arrival,
        burst: current.burst,
        priority: current.priority,
        waiting,
        turnaround
      });

      current = null;
    }
  }

  return { result: completed, gantt };
}
