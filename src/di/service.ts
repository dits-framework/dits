import { root } from '../zones/zones' // always first

import { ISettings, ISettingsParam, Logger } from "tslog"
import { ANONYMOUS, SecurityContext } from '../security/security'

import Container from './container'




export interface ServiceConfig {
  zone?: {
    name?: string,
    properties?: any
  }
}

export class InitContext {
  constructor(public service: Service) { }
}

export type InitHandler =
  (() => unknown | Promise<unknown>)
  | ((context: InitContext) => unknown | Promise<unknown>)


export default class Service {

  static ZONE_KEY = '_ditsService'

  private log = new Logger({ name: 'dits_service' })

  public zone?: Zone

  static fromZone(): Service {
    const container = Container.fromZone()
    return container.getOrThrow(Service, 'Could not locate Service from Zone\'s container.')
  }

  constructor(
    public config: dits.config.Configuration,
    public container: Container = root,
  ) {
    container.provide(Service, this, true)
  }

  get principal() {
    const c = Container.fromZone()
    const ctx: SecurityContext | undefined = c.get(SecurityContext)
    return ctx?.principal || ANONYMOUS
  }

  initialize(handler: InitHandler): Promise<any>
  initialize(config: ServiceConfig): Promise<any>
  async initialize(configOrHandler: InitHandler | ServiceConfig, handler?: InitHandler) {
    const config: ServiceConfig = handler ? configOrHandler as ServiceConfig : {}
    handler = handler || configOrHandler as InitHandler
    // this.zone = Zone.current.fork({
    //   name: config?.zone?.name || 'app',
    //   properties: {
    //     ...(config?.zone?.properties || {}),
    //     [Container.ZONE_PROPERTY]: this.container,
    //     [Service.ZONE_KEY]: this
    //   }
    // })
    this.zone = Zone.root
    return this.zone!.run(handler!, this, [new InitContext(this)])
  }

  fork(name: string, properties?: any) {
    const container = this.container.createChild(name)
    return this.zone!.fork({
      name,
      properties: {
        ...(properties || {}),
        [Container.ZONE_PROPERTY]: container,
        [Service.ZONE_KEY]: this
      }
    })
  }

}