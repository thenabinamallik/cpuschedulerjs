import { Process, ScheduledProcess, GanttSlot } from "../types/process";
import { deepClone } from "../utils/clone";

export function sjf(
  processes: Process[]
): {
  result: ScheduledProcess[];
  gantt: GanttSlot[];
} {
  const incoming = deepClone(processes).sort(
    (a, b) => a.arrival - b.arrival
  );

  const ready: Process[] = [];
  const completed: ScheduledProcess[] = [];
  const gantt: GanttSlot[] = [];

  let time = 0;
  let index = 0;

  while (index < incoming.length || ready.length > 0) {
    // Admit arrived processes
    while (index < incoming.length && incoming[index].arrival <= time) {
      ready.push(incoming[index]);
      index++;
    }

    if (ready.length === 0) {
      time++;
      continue;
    }

    // Select shortest job
    ready.sort((a, b) => a.burst - b.burst);
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
