// class Foo extends Promise {

//   // constructor(e: new <T>(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void) => Promise<T>){
//   constructor(...args) {
//     const asyncId = asyncHooks.executionAsyncId()
//     console.info('promise constructor', Zone.current.name, asyncId)
//     // @ts-ignore
//     super(...args)
//   }
//   then (...args) {
//     console.log('then?')
//     return super.then(...args)
//   }
// }
// // @ts-ignore
// globalThis.Promise = Foo;


require('zone.js')
const asyncHooks = require('async_hooks')
const fs = require('fs');
const { fd } = process.stdout;

const log = (...args) => {
  fs.writeSync(fd, args.map(v => `${v instanceof Object ? Object.keys(v) : v}`).join(' ') + "\n")
}


const store = new Map();

//must setup initial root
// store.set(asyncHooks.executionAsyncId(), Zone.current)

const ZONE_SYM = Symbol("zone")
const origZone = Zone
const origRun = origZone.prototype.run
origZone.prototype.run = function (...args) {
  const asyncId = asyncHooks.executionAsyncId()
  store.set(asyncId, this)

  asyncHooks.executionAsyncResource()[ZONE_SYM] = this
  // log('running FINDME', args, Zone.current.name, this.name, asyncId)
  return origRun.apply(this, args)
}

class MyZone extends origZone.constructor {

  static get current () {
    const asyncId = asyncHooks.executionAsyncId()
    const prev = store.get(asyncId) || {}
    const current = origZone.current || {}

    if (prev.name && prev.name !== current.name) {
      // throw new Error(`${asyncId} ${prev.name} ${current.name}`)
      log(`overwriting ${asyncId} ${prev.name} ${current.name}`)
      return prev
    }
    return current
  }

  fork () {
    throw new Error('you found me')
  }
}
// Object.setPrototypeOf(MyZone, origZone)
globalThis.Zone = MyZone
global.Zone = MyZone



const tracking = []
const asyncHook = asyncHooks.createHook({
  init: (asyncId, type, triggerAsyncId, resource) => {
    if (type == 'PROMISE') {
      tracking.push(asyncId)
      const res = asyncHooks.executionAsyncResource(triggerAsyncId)
      // const ctx = res ? res[ZONE_SYM] || {} : {}
      const prev = store.get(triggerAsyncId) || {}
      log('[init]\t going from', triggerAsyncId, 'to', asyncId, 'in zone', Zone.current.name, `prev: ${prev.name}`,)
      // log('init', type, Zone.current.name, asyncId, triggerAsyncId, res, asyncHooks.executionAsyncId())
      if (store.has(triggerAsyncId)) {
        const prev = store.get(triggerAsyncId) || {}
        if (store.has(asyncId)) {
          const current = store.get(asyncId) || {}
          log(`[write]\t Not gonna overwrite ${current.name} (${asyncId}) with ${prev.name} (${triggerAsyncId}) `)
        } else {
          log(`[write]\t Overwrite ${asyncId} with ${prev.name} (from ${triggerAsyncId}) `)
          tracking.push(asyncId)
          store.set(asyncId, prev)
        }

      }
    }
  },
  before (asyncId) {
    if (tracking.find(e => e === asyncId)) {
      // fs.writeSync(fd, `before ${Zone.current.name} ${asyncId}\n`)
    }
  },
  after (asyncId) {
    if (tracking.find(e => e === asyncId)) {
      const shouldHave = store.get(asyncId) || {}
      if (shouldHave.name == Zone.current.name) {
        log(`[after]\t ${Zone.current.name} matched ${shouldHave.name} \n`)
      } else {
        log(`[after]\t mismatched ${Zone.current.name} ${shouldHave.name} ${asyncId} \n`)
        if (shouldHave.name) {
          // Zone.current = shouldHave
          log('[after]\t did it for ' + asyncId)
          store.set(asyncId, shouldHave)
        }
      }
    }
  },
  resolve (asyncId) {
    // if (tracking.find(e => e === asyncId)) {
    fs.writeSync(fd, `resolve ${Zone.current.name} ${asyncId}\n`)
    // }
  },
  destroy: (asyncId) => {

    if (store.has(asyncId)) {
      console.log('destroying', asyncId)
      store.delete(asyncId);
    }
  }
});
asyncHook.enable()

const app = MyZone.current.fork({
  name: 'app'
})

const holder = {
  holder: true,
  async doThing () {
    console.log('\n\n\nin doThing test method', MyZone.current.name, asyncHooks.executionAsyncId(), '\n\n\n')
    const result = await new Promise(resolve => {
      resolve(100)
    })
    console.log('after thing', Zone.current.name, asyncHooks.executionAsyncId())
    return result
  }
}

app.run(() => holder.doThing())


/*
Init callback async id --> 4
Destroy callback async id -->4
*/