import { Process, ScheduledProcess, GanttSlot } from "../types/process";
import { deepClone } from "../utils/clone";

interface InternalProcess extends Process {
  remaining: number;
  queueLevel: number;
  lastExecuted: number;
}

export function mlfq(
  processes: Process[],
  quantums: number[] = [2, 4, 8]
): {
  result: ScheduledProcess[];
  gantt: GanttSlot[];
} {
  const incoming = deepClone(processes)
    .map(p => ({
      ...p,
      remaining: p.burst,
      queueLevel: 0,
      lastExecuted: p.arrival
    }))
    .sort((a, b) => a.arrival - b.arrival);

  const queues: InternalProcess[][] = quantums.map(() => []);
  const completed: ScheduledProcess[] = [];
  const gantt: GanttSlot[] = [];

  let time = 0;
  let index = 0;

  while (
    index < incoming.length ||
    queues.some(q => q.length > 0)
  ) {
    // Admit newly arrived processes
    while (index < incoming.length && incoming[index].arrival <= time) {
      queues[0].push(incoming[index]);
      index++;
    }

    // Find highest priority non-empty queue
    const level = queues.findIndex(q => q.length > 0);

    if (level === -1) {
      time++;
      continue;
    }

    const current = queues[level].shift()!;
    const execTime = Math.min(
      quantums[level],
      current.remaining
    );

    const start = time;
    time += execTime;
    current.remaining -= execTime;

    gantt.push({
      processId: current.id,
      start,
      end: time
    });

    // Admit arrivals during execution
    while (index < incoming.length && incoming[index].arrival <= time) {
      queues[0].push(incoming[index]);
      index++;
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
    } else {
      // Demote process
      const nextLevel = Math.min(
        level + 1,
        queues.length - 1
      );
      current.queueLevel = nextLevel;
      queues[nextLevel].push(current);
    }
  }

  return { result: completed, gantt };
}
