// import BluebirdPromise from 'bluebird';
// // @ts-ignore

import { createHook } from 'async_hooks';

const asyncHook = createHook({
  init(asyncId, type, triggerAsyncId, resource) {
    console.log('wtf1')
  },
  destroy(asyncId) {
    console.log('wtf2')
  }
});
asyncHook.enable()

// class Foo<T> extends Promise<T> {

//   // constructor(e: new <T>(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void) => Promise<T>){
//   constructor(...args: any[]) {
//     console.info('FINDME')
//     // @ts-ignore
//     super(...args)

//   }
//   // // then(handler: Handler<T>){
//   // // @ts-ignore
//   // then(handler: <TResult1 = T, TResult2 = never>(onfulfilled?: (value: T) => TResult1 | PromiseLike<TResult1>, onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>) => Promise<unknown>) {
//   //   return Promise.resolve({} as T)
//   // }
// }
// @ts-ignore
globalThis.Promise = Foo;

import 'zone.js/node';
// import service from './service'


// it('basic test', async () => {
//   console.log('Got zones?', service)

//   service.init(async (container) p=> {
//     console.log('what up dawg', container)

//   })
// })


it('zone test', async () => {

  // const p = Promise
  // const result = await new Promise((resolve, reject) => {
  //   resolve(1)
  // })
  // console.log(p, result)

  const app = Zone.current.fork({
    name: 'app'
  })

  // console.log('zone1', Zone.current.name)

  const name = await app.run(async () => {
    expect(Zone.current.name).toBe('app')

    await new Promise(r => setTimeout(r, 100))
    expect(Zone.current.name).toBe('app')

    setTimeout(function () {
      expect(Zone.current.name).toBe('app')
    }, 100)
  })
})