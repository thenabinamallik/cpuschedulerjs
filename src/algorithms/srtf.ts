import { Process, ScheduledProcess, GanttSlot } from "../types/process";
import { deepClone } from "../utils/clone";

interface InternalProcess extends Process {
  remaining: number;
}

export function srtf(
  processes: Process[]
): {
  result: ScheduledProcess[];
  gantt: GanttSlot[];
} {
  const incoming: InternalProcess[] = deepClone(processes)
    .map(p => ({ ...p, remaining: p.burst }))
    .sort((a, b) => a.arrival - b.arrival);

  const ready: InternalProcess[] = [];
  const completed: ScheduledProcess[] = [];
  const gantt: GanttSlot[] = [];

  let time = 0;
  let index = 0;
  let current: InternalProcess | null = null;

  while (
    index < incoming.length ||
    ready.length > 0 ||
    current !== null
  ) {
    // Admit arrivals
    while (index < incoming.length && incoming[index].arrival <= time) {
      ready.push(incoming[index]);
      index++;
    }

    if (current) {
      ready.push(current);
      current = null;
    }

    if (ready.length === 0) {
      time++;
      continue;
    }

    // Pick shortest remaining time
    ready.sort((a, b) => a.remaining - b.remaining);
    current = ready.shift()!;

    const sliceStart = time;
    time++;
    current.remaining--;

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

    if (current.remaining === 0) {
      const turnaround = time - current.arrival;
      const waiting = turnaround - current.burst;

      completed.push({
        id: current.id,
        arrival: current.arrival,
        burst: current.burst,
        waiting,
        turnaround
      });

      current = null;
    }
  }

  return { result: completed, gantt };
}
