import {fcfs} from "../src/algorithms/fcfs";
import {roundRobin} from "../src/algorithms/roundRobin";
import { Process } from "../src/types/process";

/* ---------------------------------- */
/* Test data generator                 */
/* ---------------------------------- */

function generate(n: number): Process[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `P${i}`,
    arrival: Math.floor(Math.random() * 50),
    burst: Math.floor(Math.random() * 20) + 1,
    priority: Math.floor(Math.random() * 5)
  }));
}

/* ---------------------------------- */
/* Benchmark helper                    */
/* ---------------------------------- */

function bench(
  name: string,
  fn: () => void
) {
  const start = process.hrtime.bigint();
  fn();
  const end = process.hrtime.bigint();

  console.log(
    `${name}: ${Number(end - start) / 1e6} ms`
  );
}

/* ---------------------------------- */
/* Run benchmarks                      */
/* ---------------------------------- */

const processes = generate(10_000);

bench("FCFS", () => {
  fcfs(processes);
});

bench("Round Robin (q=4)", () => {
  roundRobin(processes, 4);
});
