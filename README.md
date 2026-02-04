

# CPU Scheduler JS

A TypeScript-first library implementing classic **CPU scheduling algorithms** with:

* Strict typing
* Timeline (Gantt chart) support
* Deterministic results
* Educational + benchmarking use cases

This package simulates **OS scheduling behavior**, not real kernel scheduling.

---

## Features

* FCFS (First Come First Serve)
* SJF (Shortest Job First)
* SRTF (Shortest Remaining Time First)
* Round Robin
* Priority Scheduling (Preemptive & Non-Preemptive)
* Multilevel Feedback Queue (MLFQ)
* Gantt timeline generation
* TypeScript definitions included

---



## Process Model

All algorithms work on the same base structure.

```ts
interface Process {
  id: string;
  arrival: number;
  burst: number;
  priority?: number; // required for priority algorithms
}
```

Returned result:

```ts
interface ScheduledProcess extends Process {
  waiting: number;
  turnaround: number;
}

interface GanttSlot {
  processId: string;
  start: number;
  end: number;
}
```

---

## Basic Usage

```ts
import { fcfs } from "cpuschedulerjs";

const processes = [
  { id: "P1", arrival: 0, burst: 5 },
  { id: "P2", arrival: 1, burst: 3 }
];

const { result, gantt } = fcfs(processes);

console.log(result);
console.log(gantt);
```

---
Got it. Below is a **README with concrete, copy-pasteable examples for every algorithm**, written as **instructions**, not theory. This is the version users actually understand.

You can replace your current README with this.

---

## Process Format (Required)

All algorithms accept an array of processes.

```ts
interface Process {
  id: string;
  arrival: number;   // arrival time
  burst: number;     // CPU burst time
  priority?: number; // required only for priority algorithms
}
```

All algorithms return:

```ts
interface ScheduledProcess extends Process {
  waiting: number;
  turnaround: number;
}

interface GanttSlot {
  processId: string;
  start: number;
  end: number;
}
```

---

## Example Process Set (used below)

```ts
const processes = [
  { id: "P1", arrival: 0, burst: 5, priority: 2 },
  { id: "P2", arrival: 1, burst: 3, priority: 1 },
  { id: "P3", arrival: 2, burst: 6, priority: 3 }
];
```

---

## FCFS (First Come First Serve)

```ts
import { fcfs } from "cpuschedulerjs";

const { result, gantt } = fcfs(processes);

console.log(result);
console.log(gantt);
```

**Behavior**

* Executes processes in arrival order
* Non-preemptive
* Simple, but unfair to short jobs

---

## SJF (Shortest Job First – Non-Preemptive)

```ts
import { sjf } from "cpuschedulerjs";

const { result, gantt } = sjf(processes);
```

**Behavior**

* Picks shortest burst among arrived processes
* Minimizes average waiting time
* Can cause starvation

---

## SRTF (Shortest Remaining Time First – Preemptive)

```ts
import { srtf } from "cpuschedulerjs";

const { result, gantt } = srtf(processes);
```

**Behavior**

* Preemptive version of SJF
* Re-evaluates at every time unit
* More optimal, but expensive

---

## Round Robin

```ts
import { roundRobin } from "cpuschedulerjs";

const quantum = 2;
const { result, gantt } = roundRobin(processes, quantum);
```

**Behavior**

* Each process gets a fixed time slice
* Fair for time-sharing systems
* Performance depends heavily on quantum size

---

## Priority Scheduling

⚠️ **Priority is mandatory**
Lower number = higher priority.

---

### Priority (Non-Preemptive)

```ts
import { priorityNonPreemptive } from "cpuschedulerjs";

const { result, gantt } = priorityNonPreemptive(processes);
```

**Behavior**

* Highest priority runs first
* Once started, runs to completion
* Can starve low-priority processes

---

### Priority (Preemptive)

```ts
import { priorityPreemptive } from "cpuschedulerjs";

const { result, gantt } = priorityPreemptive(processes);
```

**Behavior**

* Higher-priority arrivals can preempt running process
* More realistic than non-preemptive
* Starvation still possible without aging

---

## MLFQ (Multilevel Feedback Queue)

```ts
import { mlfq } from "cpuschedulerjs";

const quantums = [2, 4, 8];
const { result, gantt } = mlfq(processes, quantums);
```

**Behavior**

* Multiple priority queues
* CPU-bound processes sink down
* Interactive jobs stay responsive
* Closest to real OS schedulers

---

## Gantt Chart Rendering

Every algorithm returns a timeline.

```ts
import { renderGantt } from "cpuschedulerjs";

console.log(renderGantt(gantt));
```

**Output Example**

```
| P1 | P2 | P3 | P1 |
0    2    4    6    11
```

---

## Benchmark Example (Node.js)

Benchmarks measure **algorithm overhead**, not real CPU scheduling.

```ts
import fcfs from "../src/algorithms/fcfs";
import roundRobin from "../src/algorithms/roundRobin";

function generate(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `P${i}`,
    arrival: Math.random() * 50 | 0,
    burst: Math.random() * 20 | 0 + 1,
    priority: Math.random() * 5 | 0
  }));
}

const processes = generate(10_000);

fcfs(processes);
roundRobin(processes, 4);
```

---

## Important Notes

* This is a **logical simulation**
* Time is discrete and deterministic
* No context-switch overhead included
* Designed for learning, testing, and comparison

---
You’re asking for **everything that separates “toy schedulers” from OS-grade models**. Good.
Below is a **clear, implementable design + example code** for **each item**, in the same style as your existing library. No fluff.

I’ll go **one by one**, and I’ll be blunt about what’s realistic and what’s approximation.

---

## 1️⃣ Priority Scheduling + Aging (starvation fix)

### What aging actually does

If a process waits too long, its priority is **gradually improved** so it *eventually* runs.

This is not optional in real systems. Without aging, priority scheduling is broken.

---

### Aging model (simple & correct)

* Lower number = higher priority
* Every `agingInterval` time units:

  * waiting processes get `priority -= 1` (capped at 0)

---

### Example: Priority Preemptive + Aging

```ts
interface PriorityProcess extends Process {
  priority: number;
  remaining: number;
  lastAged: number;
}

export function priorityPreemptiveWithAging(
  processes: Process[],
  agingInterval = 5
): { result: ScheduledProcess[]; gantt: GanttSlot[] } {
  const incoming: PriorityProcess[] = processes.map(p => {
    if (p.priority === undefined) {
      throw new Error(`Process ${p.id} missing priority`);
    }
    return {
      ...p,
      priority: p.priority,
      remaining: p.burst,
      lastAged: p.arrival
    };
  });

  const ready: PriorityProcess[] = [];
  const completed: ScheduledProcess[] = [];
  const gantt: GanttSlot[] = [];

  let time = 0;
  let current: PriorityProcess | null = null;

  while (incoming.length || ready.length || current) {
    // Admit arrivals
    for (let i = 0; i < incoming.length; ) {
      if (incoming[i].arrival <= time) {
        ready.push(incoming.splice(i, 1)[0]);
      } else i++;
    }

    // Aging
    for (const p of ready) {
      if (time - p.lastAged >= agingInterval) {
        p.priority = Math.max(0, p.priority - 1);
        p.lastAged = time;
      }
    }

    if (current) ready.push(current);
    if (!ready.length) {
      time++;
      current = null;
      continue;
    }

    ready.sort((a, b) => a.priority - b.priority);
    current = ready.shift()!;

    const start = time;
    time++;
    current.remaining--;

    // Gantt
    if (gantt.at(-1)?.processId === current.id) {
      gantt.at(-1)!.end = time;
    } else {
      gantt.push({ processId: current.id, start, end: time });
    }

    if (current.remaining === 0) {
      completed.push({
        ...current,
        waiting: time - current.arrival - current.burst,
        turnaround: time - current.arrival
      });
      current = null;
    }
  }

  return { result: completed, gantt };
}
```

---

## 2️⃣ Context-Switch Cost (realistic overhead)

### Reality

Context switching is **not free**. Real schedulers pay a penalty.

We simulate it as:

* `contextSwitchCost` time units **every time CPU switches processes**

---

### Add context-switch cost (generic pattern)

```ts
let lastProcessId: string | null = null;
const CONTEXT_SWITCH_COST = 1;

function applyContextSwitch(
  gantt: GanttSlot[],
  newProcessId: string,
  time: number
): number {
  if (lastProcessId && lastProcessId !== newProcessId) {
    gantt.push({
      processId: "CS",
      start: time,
      end: time + CONTEXT_SWITCH_COST
    });
    time += CONTEXT_SWITCH_COST;
  }
  lastProcessId = newProcessId;
  return time;
}
```

Use this **before executing a process slice**.

This will clearly show **why small RR quantums are bad**.

---

## 3️⃣ CFS-style Scheduler (Linux-inspired)

Linux does **not** use RR, SJF, or Priority.

It uses **Completely Fair Scheduler (CFS)**.

---

### Core idea (simplified but correct)

* Each process has `vruntime`
* Scheduler always runs process with **lowest vruntime**
* vruntime increases proportional to execution time / weight
* No fixed quantum

---

### Minimal CFS Simulation

```ts
interface CFSProcess extends Process {
  vruntime: number;
  remaining: number;
  weight: number; // derived from priority
}

export function cfs(
  processes: Process[]
): { result: ScheduledProcess[]; gantt: GanttSlot[] } {
  const ready: CFSProcess[] = processes.map(p => ({
    ...p,
    remaining: p.burst,
    vruntime: 0,
    weight: p.priority ? 1024 / (p.priority + 1) : 1024
  }));

  const completed: ScheduledProcess[] = [];
  const gantt: GanttSlot[] = [];
  let time = 0;

  while (ready.length) {
    ready.sort((a, b) => a.vruntime - b.vruntime);
    const p = ready.shift()!;

    const start = time;
    time++;
    p.remaining--;
    p.vruntime += 1024 / p.weight;

    if (gantt.at(-1)?.processId === p.id) {
      gantt.at(-1)!.end = time;
    } else {
      gantt.push({ processId: p.id, start, end: time });
    }

    if (p.remaining === 0) {
      completed.push({
        ...p,
        waiting: time - p.arrival - p.burst,
        turnaround: time - p.arrival
      });
    } else {
      ready.push(p);
    }
  }

  return { result: completed, gantt };
}
```

⚠️ This is **conceptually correct**, not kernel-accurate. That’s intentional.

---

## 4️⃣ Visualization UI (React)

You do **not** need D3 to start. Keep it simple.

---

### Simple Gantt Chart Component (React)

```tsx
type GanttSlot = {
  processId: string;
  start: number;
  end: number;
};

export function GanttChart({ slots }: { slots: GanttSlot[] }) {
  return (
    <div style={{ display: "flex", border: "1px solid #333" }}>
      {slots.map((s, i) => (
        <div
          key={i}
          style={{
            width: (s.end - s.start) * 30,
            borderRight: "1px solid #000",
            padding: "8px",
            background: s.processId === "CS" ? "#999" : "#4ade80"
          }}
        >
          {s.processId}
        </div>
      ))}
    </div>
  );
}
```

---

### Use it

```tsx
const { gantt } = roundRobin(processes, 2);

<GanttChart slots={gantt} />;
```

---
You’re asking for **everything that separates “toy schedulers” from OS-grade models**. Good.
Below is a **clear, implementable design + example code** for **each item**, in the same style as your existing library. No fluff.

I’ll go **one by one**, and I’ll be blunt about what’s realistic and what’s approximation.

---

## 1️⃣ Priority Scheduling + Aging (starvation fix)

### What aging actually does

If a process waits too long, its priority is **gradually improved** so it *eventually* runs.

This is not optional in real systems. Without aging, priority scheduling is broken.

---

### Aging model (simple & correct)

* Lower number = higher priority
* Every `agingInterval` time units:

  * waiting processes get `priority -= 1` (capped at 0)

---

### Example: Priority Preemptive + Aging

```ts
interface PriorityProcess extends Process {
  priority: number;
  remaining: number;
  lastAged: number;
}

export function priorityPreemptiveWithAging(
  processes: Process[],
  agingInterval = 5
): { result: ScheduledProcess[]; gantt: GanttSlot[] } {
  const incoming: PriorityProcess[] = processes.map(p => {
    if (p.priority === undefined) {
      throw new Error(`Process ${p.id} missing priority`);
    }
    return {
      ...p,
      priority: p.priority,
      remaining: p.burst,
      lastAged: p.arrival
    };
  });

  const ready: PriorityProcess[] = [];
  const completed: ScheduledProcess[] = [];
  const gantt: GanttSlot[] = [];

  let time = 0;
  let current: PriorityProcess | null = null;

  while (incoming.length || ready.length || current) {
    // Admit arrivals
    for (let i = 0; i < incoming.length; ) {
      if (incoming[i].arrival <= time) {
        ready.push(incoming.splice(i, 1)[0]);
      } else i++;
    }

    // Aging
    for (const p of ready) {
      if (time - p.lastAged >= agingInterval) {
        p.priority = Math.max(0, p.priority - 1);
        p.lastAged = time;
      }
    }

    if (current) ready.push(current);
    if (!ready.length) {
      time++;
      current = null;
      continue;
    }

    ready.sort((a, b) => a.priority - b.priority);
    current = ready.shift()!;

    const start = time;
    time++;
    current.remaining--;

    // Gantt
    if (gantt.at(-1)?.processId === current.id) {
      gantt.at(-1)!.end = time;
    } else {
      gantt.push({ processId: current.id, start, end: time });
    }

    if (current.remaining === 0) {
      completed.push({
        ...current,
        waiting: time - current.arrival - current.burst,
        turnaround: time - current.arrival
      });
      current = null;
    }
  }

  return { result: completed, gantt };
}
```

---

## 2️⃣ Context-Switch Cost (realistic overhead)

### Reality

Context switching is **not free**. Real schedulers pay a penalty.

We simulate it as:

* `contextSwitchCost` time units **every time CPU switches processes**

---

### Add context-switch cost (generic pattern)

```ts
let lastProcessId: string | null = null;
const CONTEXT_SWITCH_COST = 1;

function applyContextSwitch(
  gantt: GanttSlot[],
  newProcessId: string,
  time: number
): number {
  if (lastProcessId && lastProcessId !== newProcessId) {
    gantt.push({
      processId: "CS",
      start: time,
      end: time + CONTEXT_SWITCH_COST
    });
    time += CONTEXT_SWITCH_COST;
  }
  lastProcessId = newProcessId;
  return time;
}
```

Use this **before executing a process slice**.

This will clearly show **why small RR quantums are bad**.

---

## 3️⃣ CFS-style Scheduler (Linux-inspired)

Linux does **not** use RR, SJF, or Priority.

It uses **Completely Fair Scheduler (CFS)**.

---

### Core idea (simplified but correct)

* Each process has `vruntime`
* Scheduler always runs process with **lowest vruntime**
* vruntime increases proportional to execution time / weight
* No fixed quantum

---

### Minimal CFS Simulation

```ts
interface CFSProcess extends Process {
  vruntime: number;
  remaining: number;
  weight: number; // derived from priority
}

export function cfs(
  processes: Process[]
): { result: ScheduledProcess[]; gantt: GanttSlot[] } {
  const ready: CFSProcess[] = processes.map(p => ({
    ...p,
    remaining: p.burst,
    vruntime: 0,
    weight: p.priority ? 1024 / (p.priority + 1) : 1024
  }));

  const completed: ScheduledProcess[] = [];
  const gantt: GanttSlot[] = [];
  let time = 0;

  while (ready.length) {
    ready.sort((a, b) => a.vruntime - b.vruntime);
    const p = ready.shift()!;

    const start = time;
    time++;
    p.remaining--;
    p.vruntime += 1024 / p.weight;

    if (gantt.at(-1)?.processId === p.id) {
      gantt.at(-1)!.end = time;
    } else {
      gantt.push({ processId: p.id, start, end: time });
    }

    if (p.remaining === 0) {
      completed.push({
        ...p,
        waiting: time - p.arrival - p.burst,
        turnaround: time - p.arrival
      });
    } else {
      ready.push(p);
    }
  }

  return { result: completed, gantt };
}
```

⚠️ This is **conceptually correct**, not kernel-accurate. That’s intentional.

---

## 4️⃣ Visualization UI (React)

You do **not** need D3 to start. Keep it simple.

---

### Simple Gantt Chart Component (React)

```tsx
type GanttSlot = {
  processId: string;
  start: number;
  end: number;
};

export function GanttChart({ slots }: { slots: GanttSlot[] }) {
  return (
    <div style={{ display: "flex", border: "1px solid #333" }}>
      {slots.map((s, i) => (
        <div
          key={i}
          style={{
            width: (s.end - s.start) * 30,
            borderRight: "1px solid #000",
            padding: "8px",
            background: s.processId === "CS" ? "#999" : "#4ade80"
          }}
        >
          {s.processId}
        </div>
      ))}
    </div>
  );
}
```

---

### Use it

```tsx
const { gantt } = roundRobin(processes, 2);

<GanttChart slots={gantt} />;
```

---
