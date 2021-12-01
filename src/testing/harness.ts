import ZoneHook from '../zones/zones'
import { v4 as UUID } from 'uuid'
import DiContainer from '../stuff/container';


interface DoneCallback {
  (...args: any[]): any;
  fail(error?: string | { message: string }): any;
}

type MyCallback = (cb?: Function) => void | unknown | Promise<void | unknown>
type ProvidesCallback = ((cb: DoneCallback) => void | undefined) | (() => Promise<unknown>);

export default class DitsTestHarness {

  init() {
    ZoneHook.enable()
  }

  shutdown() {
    ZoneHook.disable()
  }

  // wrap(callback: ProvidesCallback): ProvidesCallback {
  wrap(callback: MyCallback): ProvidesCallback {
    return x => {
      new Promise(async (resolve, reject) => {


        const parent = DiContainer.fromZone()
        const child = parent.createChild()

        const testZone = Zone.current.fork({
          name: 'test-' + UUID(),
          properties: {
            [DiContainer.ZONE_PROPERTY]: child
          }
        })
        await testZone.run(async () => {
          try {
            let resolved = false
            const result = await callback((arg?: any) => {
              resolved = true
              resolve(arg)
            })

            if (!resolved) {
              resolve(result)
            }
          } catch (err) {
            reject(err)
          }
        })

      })
        .then(e => x(e))
        .catch(err => {
          if (x.fail) {
            x.fail(err)
          } else {
            throw err
          }
        })
    }
  }
}
