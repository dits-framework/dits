import 'zone.js'
import 'reflect-metadata'
import { createZonePatch } from './zone-patch'
import AsyncPromiseHook from './promise-hook'
import DiContainer from '../stuff/container'



// @ts-ignore
export const root = global._DITS_ROOT = global._DITS_ROOT as DiContainer || new DiContainer()

// first, we declare the global zone here so we can 
// monkey patch zone.js awesome work
declare namespace global {
  var Zone: Zone
}

// next, we keep a record of all the async executioners
const store = new Map<number, Zone>()

// we create a subclass of Zone that can use our store if needed
const patchedZone = createZonePatch(store, root)

//after that, we hook into async_hooks whenever async/await + promises are at play
const promiseHook = new AsyncPromiseHook(store)

// and finally, we replace the default Zone.js with a subclass
global.Zone = patchedZone

// give back these nifty guys for checking out
export { patchedZone, promiseHook }

// and ultimately export the hook so it can be turned on and off
export default promiseHook.hook
