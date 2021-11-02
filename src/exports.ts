// MOST IMPORTANT THING: we load and hotpatch zone.js FIRST
import ZoneHook_Local from './zones/zones'
import { AsyncHook } from 'async_hooks'

import 'reflect-metadata'

import * as DI_LOCAL from './di/di'
import security_local, * as SecurityLocal from './security/security'

export type Config = dits.config.Configuration

/// <reference path = "dits.ns.ts" />





const DITS_INSTANCE = Symbol.for('dits')
const g = global as any

export type Exported = {
  service: DI_LOCAL.Service,
  Inject: (target: Object, propertyKey: string | symbol, parameterIndex: number) => unknown,
  Component: DI_LOCAL.ComponentType,
  Metadata: (key: symbol, value: any) => (target: any, propertyKey: string) => unknown,
  ComponentRegistry: typeof DI_LOCAL.ComponentRegistry,
  HandlerRegistry: typeof DI_LOCAL.HandlerRegistry,
  security: SecurityLocal.SecurityService,
  Security: {
    // principal: SecurityLocal.Principal
    BasePrincipal: typeof SecurityLocal.BasePrincipal
    AnonymousPrincipal: typeof SecurityLocal.AnonymousPrincipal
    ANONYMOUS: SecurityLocal.AnonymousPrincipal
  },
  ZoneHook: AsyncHook
}

let mainExport: {
  default: DI_LOCAL.Service,
  exported: Exported
}
if (g[DITS_INSTANCE]) {
  mainExport = {
    default: g[DITS_INSTANCE].default,
    exported: g[DITS_INSTANCE].exported
  }
} else {
  const { service, Inject, Component } = DI_LOCAL
  const exported = {
    service,

    Inject,
    Component: DI_LOCAL.Component,
    Metadata: DI_LOCAL.Metadata,
    ComponentRegistry: DI_LOCAL.ComponentRegistry,
    HandlerRegistry: DI_LOCAL.HandlerRegistry,

    security: security_local,
    Security: {
      BasePrincipal: SecurityLocal.BasePrincipal,
      AnonymousPrincipal: SecurityLocal.AnonymousPrincipal,
      ANONYMOUS: SecurityLocal.ANONYMOUS
    },
    ZoneHook: ZoneHook_Local
  } as Exported
  mainExport = {
    default: service,
    exported
  }
}

export const {
  service,
  Inject, Component, Metadata,
  ComponentRegistry, HandlerRegistry,
  security, Security, ZoneHook
} = mainExport.exported
export default mainExport.default