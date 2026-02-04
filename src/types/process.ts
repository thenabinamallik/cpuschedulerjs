export interface Process {
  id: string;
  arrival: number;
  burst: number;
  priority?: number;
}

export interface ScheduledProcess extends Process {
  waiting: number;
  turnaround: number;
}

export interface GanttSlot {
  processId: string;
  start: number;
  end: number;
}
