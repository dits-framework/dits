import '../zones/zones'
import { DispatchEvent, Container, HandlerRegistry, ComponentRegistry } from "./di"
import { Principal, ANONYMOUS } from '../security/security'

import EventEmitter from 'events'

export const ROOT = Zone.current

export type Authenticator = (e: DispatchEvent) => Principal | PromiseLike<Principal>
export const DEFAULT_AUTHENTICATOR = (e: DispatchEvent) => {
  // enable logging eventually 
  return ANONYMOUS as Principal
}

export interface AppInitContext {
  authenticate: Authenticator
}


export type InitContext = {
  container: Container,
  zone: Zone
}

export interface InitHandler {
  (context: InitContext): Promise<unknown>
}

/**
 * Represents a running application context
 */
export class Service {

  // public anonymous = ANONYMOUS
  public context?: AppInitContext
  public zone?: Zone
  public container?: Container
  private properties?: any
  public config?: dits.config.Configuration

  private events = new EventEmitter()

  withProperties(props: any) {
    if (this.properties) {
      throw new Error('Cannot specify app zone properties multiple times')
    }
    this.properties = props
  }

  init(config: dits.config.Configuration, handler?: InitHandler): Promise<unknown>
  async init(
    config: dits.config.Configuration,
    appCtxOrHandler?: AppInitContext | InitHandler | undefined,
    handler?: InitHandler,
  ) {

    let appContext: AppInitContext | undefined

    // figure out which method they called
    if (appCtxOrHandler && (appCtxOrHandler as AppInitContext).authenticate) {
      // appCtx is good
      appContext = appCtxOrHandler as AppInitContext
    } else if (appCtxOrHandler instanceof Function) {
      handler = appCtxOrHandler as InitHandler
    }

    if (!appContext) {
      appContext = { authenticate: DEFAULT_AUTHENTICATOR }
    }

    // if they're not interested in a callback, do nothing
    if (!handler) {
      handler = async () => ({ container: this.container!, zone: this.zone! })
    }

    if (!handler || !(handler instanceof Function)) {
      throw new Error('Must provide a valid callable handler')
    }

    const properties = { ...(this.properties || {}) }
    if (properties?.container) {
      if (properties.container instanceof Container) {
        // using preconfigured
      } else {
        throw new Error('Cannot provide a pre-configured container that does not extend Container')
      }
    } else {
      properties.container = new Container()
    }

    this.container = properties.container

    let handlers = this.container?.get(HandlerRegistry)
    if (!handlers) {
      handlers = new HandlerRegistry()
      this.container?.register(HandlerRegistry, handlers)
    }

    let components = this.container?.get(ComponentRegistry)
    if (!components) {
      components = new ComponentRegistry()
      this.container?.register(ComponentRegistry, components)
    }

    this.config = config
    this.context = appContext
    this.properties = properties
    this.zone = Zone.current.fork({
      name: 'app',
      properties
    })

    try {
      this.emit('pre-initialization', this)
      await Promise.all(this.handlerPromises)
      this.handlerPromises.length = 0
    } catch (err) {
      console.warn('Failed pre-initialization', this.handlerPromises, err)
      throw new Error('PreInitialization failed')
    }

    try {
      this.emit('initializing', this)
      await Promise.all(this.handlerPromises)
      this.handlerPromises.length = 0
    } catch (err) {
      console.warn('Failed initialization', this.handlerPromises, err)
      throw new Error('Initialization failed')
    }

    try {
      this.emit('initialized', this)
      await Promise.all(this.handlerPromises)
      this.handlerPromises.length = 0
    } catch (err) {
      console.warn('Failed post-initializion', this.handlerPromises, err)
      throw new Error('PostInitialization failed')
    }

    return this.zone.run(handler, this, [{ container: this.container!, zone: this.zone! }])
  }

  fork(name: string, properties: any = {}, extra: any = {}) {
    const zone = Zone.current.fork({
      ...extra,
      name,
      properties
    })
    return zone
  }

  get<T>(key: string): T | undefined {
    return Zone.current.get(key) as T || undefined
  }

  getOrThrow<T>(key: string) {
    const s = this.get(key)
    if (!s) {
      throw new Error(`${Zone.current.name} does not have property by key  ${key}`)
    }
    return s as T
  }

  get current() {
    return Zone.current
  }

  onPreInitialization(handler: (...args: any[]) => unknown) {
    this.registerHandler('pre-initialization', handler)
  }

  onInitializing(handler: (...args: any[]) => unknown) {
    this.registerHandler('initializing', handler)
  }


  private handlerPromises: any[] = []
  private registerHandler(event: 'pre-initialization' | 'initializing' | 'initialized', handler: (...args: any[]) => unknown) {
    this.events.once(event, (...args) => {
      const handlerResult = handler(...args)
      this.handlerPromises.push(handlerResult)
    })
  }

  private emit(event: string, ...args: any[]) {
    // console.log('emiting', event, args.length, this.handlerPromises.length)
    this.events.emit(event, ...args)
    // console.log('emitted', event, args.length, this.handlerPromises.length)
  }

}

export default new Service()
