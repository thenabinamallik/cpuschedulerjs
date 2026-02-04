import { GanttSlot } from "../types/process";

export function renderGantt(slots: GanttSlot[]): string {
  let timeline = "";
  let timeLine = "0";

  for (const slot of slots) {
    timeline += `| ${slot.processId} `;
    timeLine += " ".repeat(timeline.length - timeLine.length - slot.end.toString().length)
      + slot.end;
  }

  return timeline + "|\n" + timeLine;
}
