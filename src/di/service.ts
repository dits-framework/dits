import '../zones/zones'


import { ISettings, ISettingsParam, Logger } from "tslog"
import EventEmitter from 'events'

import { DispatchEvent, Container, HandlerRegistry, ComponentRegistry } from "./di"
import { Principal, ANONYMOUS } from '../security/security'

export const ROOT = Zone.current

export type Authenticator = (e: DispatchEvent) => Principal | PromiseLike<Principal>
export const DEFAULT_AUTHENTICATOR = (e: DispatchEvent) => {
  // enable logging eventually 
  return ANONYMOUS as Principal
}

export interface AppInitContext {
  authenticate: Authenticator
}


export class InitContext {
  constructor(
    public container: Container,
    public zone: Zone
  ) { }
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

  public handlers = new HandlerRegistry()
  public components = new ComponentRegistry()

  public container?: Container
  private properties?: any
  public config?: dits.config.Configuration

  private events = new EventEmitter()

  private log = new Logger({ name: 'dits_service' })

  private resolver: undefined | ((value: unknown) => void)
  private rejector: undefined | ((value: Error | any | void) => void)
  public promise = new Promise((res, rej) => {
    this.resolver = res
    this.rejector = rej
  })

  withProperties(props: any) {
    if (this.properties) {
      throw new Error('Cannot specify app zone properties multiple times')
    }
    this.properties = props
  }


  logger(name: string): Logger
  logger(settings?: ISettingsParam, parentSettings?: ISettings): Logger
  logger(settingsOrString?: ISettingsParam | string, parentSettings?: ISettings) {
    if (settingsOrString instanceof String) {
      return new Logger({ name: settingsOrString as string })
    }
    return new Logger(settingsOrString as ISettingsParam)
  }

  init(config: dits.config.Configuration, handler?: InitHandler): Promise<unknown>
  async init(
    cfg: dits.config.Configuration,
    cOrH?: AppInitContext | InitHandler | undefined,
    h?: InitHandler,
  ) {
    try {
      const { config, context, handler } = this.parseParameters(cfg, cOrH, h)
      const properties = this.parseProperties()
      this.container = properties.container

      if (!this.container) {
        throw new Error('A container must be provided')
      }

      // setup our properties for the Zone itself
      this.config = config
      this.context = context
      this.properties = properties
      this.zone = Zone.current.fork({
        name: 'app',
        properties
      })

      return this.zone.run(async () => {
        //! TODO rework this properly
        // fire some ghetto lifecycle messages 
        await this.emitLifecycle('pre-initialization')
        await this.emitLifecycle('initializing')
        await this.emitLifecycle('initialized')

        // signal that the service itself is ready to go
        this.resolver && this.resolver(undefined)

        // invoke the "service is live" handler
        return this.zone!.run(handler!, this, [new InitContext(this.container!, this.zone!)])
      }, this)
    } catch (err) {
      this.rejector!(err)
    }
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



  //! TODO rework this with proper lifecycles
  private async emitLifecycle(hook: string) {
    try {
      this.emit(hook, this)
      await Promise.all(this.handlerPromises)
      this.handlerPromises.length = 0
    } catch (err) {
      this.log.warn('Failed to process handler promises for ' + hook, this.handlerPromises, err)
      throw new Error(hook + ' failed')
    }
  }

  private handlerPromises: any[] = []
  private registerHandler(event: 'pre-initialization' | 'initializing' | 'initialized', handler: (...args: any[]) => unknown) {
    this.events.once(event, (...args) => {
      const handlerResult = handler(...args)
      this.handlerPromises.push(handlerResult)
    })
  }

  private emit(event: string, ...args: any[]) {
    this.events.emit(event, ...args)
  }

  private parseParameters(config: dits.config.Configuration,
    appCtxOrHandler?: AppInitContext | InitHandler | undefined,
    handler?: InitHandler) {
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
    return {
      config: config as dits.config.Configuration,
      context: appContext as AppInitContext,
      handler: handler as InitHandler,
    }
  }

  private parseProperties() {
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
    return properties
  }
}

// @ts-ignore
const instance = global._DITS_GLOBAL = global._DITS_GLOBAL || new Service()
export default instance
