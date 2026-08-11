interface CoordinatorState<T> {
  rerun: boolean;
  promise: Promise<T>;
}

export class CompileCoordinator<T> {
  private readonly states = new Map<string, CoordinatorState<T>>();

  run(key: string, task: () => Promise<T>, rerunIfBusy = false): Promise<T> {
    const existing = this.states.get(key);
    if (existing) {
      if (rerunIfBusy) {
        existing.rerun = true;
      }
      return existing.promise;
    }

    const state = { rerun: false } as CoordinatorState<T>;
    state.promise = (async () => {
      let result: T;
      do {
        state.rerun = false;
        result = await task();
      } while (state.rerun);
      return result;
    })().finally(() => {
      this.states.delete(key);
    });
    this.states.set(key, state);
    return state.promise;
  }

  isRunning(key: string): boolean {
    return this.states.has(key);
  }
}
