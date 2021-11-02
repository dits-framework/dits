// MOST IMPORTANT THING: we load and hotpatch zone.js FIRST
import ZoneHook_Local from './zones/zones'

import 'reflect-metadata'

import * as DI_LOCAL from './di/di'
import security_local, * as SecurityLocal from './security/security'

export type Config = dits.config.Configuration

/// <reference path = "dits.ns.ts" />





const DITS_INSTANCE = Symbol.for('dits')
const g = global as any

let mainExport
if (g[DITS_INSTANCE]) {
  mainExport = {
    default: g[DITS_INSTANCE].default,
    exported: g[DITS_INSTANCE].exported
  }
} else {

  const { service, Inject, Component } = DI_LOCAL
  const exported = { service, Inject, Component, security: SecurityLocal, DI: DI_LOCAL, Security: SecurityLocal, ZoneHook: ZoneHook_Local }
  mainExport = {
    default: service,
    exported
  }
}


export const { service, Inject, Component, security, DI, Security, ZoneHook } = mainExport.exported
export default mainExport.default