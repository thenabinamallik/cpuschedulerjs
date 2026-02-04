import { Process, ScheduledProcess, GanttSlot } from "../types/process";
import { deepClone } from "../utils/clone";

interface InternalProcess extends Process {
  remaining: number;
}

export function roundRobin(
  processes: Process[],
  quantum: number
): {
  result: ScheduledProcess[];
  gantt: GanttSlot[];
} {
  if (quantum <= 0) {
    throw new Error("Quantum must be > 0");
  }

  const incoming: InternalProcess[] = deepClone(processes)
    .map(p => ({ ...p, remaining: p.burst }))
    .sort((a, b) => a.arrival - b.arrival);

  const ready: InternalProcess[] = [];
  const completed: ScheduledProcess[] = [];
  const gantt: GanttSlot[] = [];

  let time = 0;
  let index = 0;

  while (
    index < incoming.length ||
    ready.length > 0
  ) {
    // Admit arrived processes
    while (index < incoming.length && incoming[index].arrival <= time) {
      ready.push(incoming[index]);
      index++;
    }

    if (ready.length === 0) {
      time++;
      continue;
    }

    const current = ready.shift()!;
    const sliceStart = time;
    const execTime = Math.min(quantum, current.remaining);

    time += execTime;
    current.remaining -= execTime;

    // Merge timeline slices
    if (
      gantt.length > 0 &&
      gantt[gantt.length - 1].processId === current.id
    ) {
      gantt[gantt.length - 1].end = time;
    } else {
      gantt.push({
        processId: current.id,
        start: sliceStart,
        end: time
      });
    }

    // Admit arrivals during execution
    while (index < incoming.length && incoming[index].arrival <= time) {
      ready.push(incoming[index]);
      index++;
    }

    if (current.remaining > 0) {
      ready.push(current); // requeue
    } else {
      const turnaround = time - current.arrival;
      const waiting = turnaround - current.burst;

      completed.push({
        id: current.id,
        arrival: current.arrival,
        burst: current.burst,
        waiting,
        turnaround
      });
    }
  }

  return { result: completed, gantt };
}
