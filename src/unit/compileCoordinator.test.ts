import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CompileCoordinator } from '../compileCoordinator';

test('coalesces busy requests and performs one requested trailing rerun', async () => {
  const coordinator = new CompileCoordinator<number>();
  let runs = 0;
  const task = async () => {
    runs += 1;
    await delay(15);
    return runs;
  };

  const first = coordinator.run('/a.tsqx', task);
  const second = coordinator.run('/a.tsqx', task, true);
  const third = coordinator.run('/a.tsqx', task, true);

  assert.equal(first, second);
  assert.equal(second, third);
  assert.equal(await first, 2);
  assert.equal(runs, 2);
  assert.equal(coordinator.isRunning('/a.tsqx'), false);
});

test('allows different files to compile in parallel', async () => {
  const coordinator = new CompileCoordinator<void>();
  let active = 0;
  let maximumActive = 0;
  const task = async () => {
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    await delay(15);
    active -= 1;
  };

  await Promise.all([
    coordinator.run('/a.tsqx', task),
    coordinator.run('/b.tsqx', task),
  ]);
  assert.equal(maximumActive, 2);
});

function delay(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
