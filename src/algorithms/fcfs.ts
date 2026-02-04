import { Process, ScheduledProcess, GanttSlot } from "../types/process";
import { deepClone } from "../utils/clone";

export function fcfs(processes: Process[]): {
  result: ScheduledProcess[];
  gantt: GanttSlot[];
} {
  const list = deepClone(processes).sort(
    (a, b) => a.arrival - b.arrival
  );

  let time = 0;
  const gantt: GanttSlot[] = [];
  const result: ScheduledProcess[] = [];

  for (const p of list) {
    if (time < p.arrival) time = p.arrival;

    const start = time;
    time += p.burst;

    gantt.push({ processId: p.id, start, end: time });

    result.push({
      ...p,
      waiting: start - p.arrival,
      turnaround: time - p.arrival
    });
  }

  return { result, gantt };
}
