
import { AsyncHook, createHook, HookCallbacks } from 'async_hooks'

export default class AsyncPromiseHook implements HookCallbacks {

  hook: AsyncHook

  constructor(private store: Map<number, Zone>) {
    this.hook = createHook({
      init: this.init.bind(this),
      after: this.after.bind(this),
      destroy: this.destroy.bind(this),
    })
  }

  init(asyncId: number, type: string, triggerAsyncId: number) {
    if (type == 'PROMISE') {
      if (this.store.has(triggerAsyncId)) {
        const prev = this.store.get(triggerAsyncId) || {}
        if (this.store.has(asyncId)) {
          // const current = store.get(asyncId) || {}
        } else {
          // tracking.push(asyncId)
          this.store.set(asyncId, prev as Zone)
        }
      }
    }
  }
  after(asyncId: number) {
    if (this.store.has(asyncId)) {
      const shouldHave = this.store.get(asyncId) || {} as any
      if (shouldHave.name && shouldHave.name !== Zone.current.name) {
        this.store.set(asyncId, shouldHave)
      }
    }
  }
  destroy(asyncId: number) {
    if (this.store.has(asyncId)) {
      this.store.delete(asyncId);
    }
  }
}