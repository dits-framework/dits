import { root } from '../zones/zones' // always first

import { ISettings, ISettingsParam, Logger } from "tslog"

import ComponentRegistry from '../component/registry'
import { SecurityContext } from '../security/security'

import Container from '../di/container'

import HandlerRegistry from '../di/registry'

export class AnonymousPrincipal implements dits.security.Principal {
  authenticated = false
  permissions: dits.security.Permission[] = []
}
export const ANONYMOUS = new AnonymousPrincipal()


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

  public handlers = new HandlerRegistry()
  public components = new ComponentRegistry()
  public anonymousPrincipal = ANONYMOUS

  private log = new Logger({ name: 'dits_service' })

  public zone?: Zone

  constructor(
    public config: dits.config.Configuration,
    public container: Container = root,
  ) { }

  get principal() {
    const c = Zone.current.get('container') as Container || this.container
    const ctx: SecurityContext | undefined = c?.get(SecurityContext)
    return ctx?.principal || this.anonymousPrincipal
  }


  initialize(handler: InitHandler): Promise<any>
  initialize(config: ServiceConfig): Promise<any>
  async initialize(configOrHandler: InitHandler | ServiceConfig, handler?: InitHandler) {
    const config: ServiceConfig = handler ? configOrHandler as ServiceConfig : {}
    handler = handler || configOrHandler as InitHandler
    this.zone = Zone.current.fork({
      name: config?.zone?.name || 'app',
      properties: config?.zone?.properties
    })

    return this.zone!.run(handler!, this, [new InitContext(this)])
  }

}