import { DispatchEvent, Container, HandlerRegistry } from "./di"
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


export type InitContext = {
  container: Container,
  zone: Zone
}

export interface InitHandler {
  (context: InitContext): Promise<unknown>
}

export class Service {

  // public anonymous = ANONYMOUS
  public context?: AppInitContext
  public zone?: Zone
  public container?: Container
  private properties?: any
  public config?: dits.config.Configuration

  withProperties(props: any) {
    if (this.properties) {
      throw new Error('Cannot specify app zone properties multiple times')
    }
    this.properties = props
  }

  init(config: dits.config.Configuration, handler?: InitHandler): Promise<unknown>
  init(
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

    let registry = this.container?.get(HandlerRegistry)
    if (!registry) {
      registry = new HandlerRegistry()
      this.container?.register(HandlerRegistry, registry)
    }

    this.config = config
    this.context = appContext
    this.properties = properties
    this.zone = Zone.current.fork({
      name: 'app',
      properties
    })
    Object.seal(this)

    // return this.zone.runGuarded(() => {
    //   // const h = this.zone!.wrap(handler!, 'dits-service?')
    //   // console.log('running in zone', this.zone?.name)
    //   // return h(({ container: this.container!, zone: this.zone! }))
    //   return handler!(({ container: this.container!, zone: this.zone! }))
    // })
    return this.zone.runGuarded(handler, this, [{ container: this.container!, zone: this.zone! }])
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

}

export default new Service()
