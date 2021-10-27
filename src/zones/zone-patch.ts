import asyncHooks from 'async_hooks'

export const createZonePatch = (store: Map<number, Zone>) => {

  // TODO: clean up this block, as it is naaasty

  const origZone = Zone
  // @ts-ignore
  const zoneProto = origZone.prototype
  const origRun = zoneProto.run
  zoneProto.run = function (...args: any[]) {
    const asyncId = asyncHooks.executionAsyncId()
    store.set(asyncId, this)
    return origRun.apply(this, args)
  }

  // @ts-ignore
  return class extends zoneProto.constructor {
    static get current() {
      const asyncId = asyncHooks.executionAsyncId()
      const prev = store.get(asyncId) || {} as any
      const current = origZone.current || {}

      if (prev.name && prev.name !== current.name) {
        return prev
      }
      return current
    }
  } as Zone
}