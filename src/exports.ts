// MOST IMPORTANT THING: we load and hotpatch zone.js FIRST
import ZoneHook_Local from './zones/zones'
import { AsyncHook } from 'async_hooks'

import 'reflect-metadata'

import * as DI from './di/di'
import security_local, * as SecurityLocal from './security/security'

export type Config = dits.config.Configuration

/// <reference path = "dits.ns.ts" />





const DITS_INSTANCE = Symbol.for('dits')
const g = global as any

export type Exported = {
  service: DI.Service,
  Inject: typeof DI.Inject,
  Component: typeof DI.Component,
  Handler: typeof DI.Handler,
  Container: typeof DI.Container,
  DispatchEvent: typeof DI.DispatchEvent,

  // Metadata: (key: symbol, value: any) => (target: any, propertyKey: string) => unknown,
  ComponentRegistry: typeof DI.ComponentRegistry,
  HandlerRegistry: typeof DI.HandlerRegistry,
  Metadata: typeof DI.Metadata,
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
  default: DI.Service,
  exported: Exported
}
if (g[DITS_INSTANCE]) {
  mainExport = {
    default: g[DITS_INSTANCE].default,
    exported: g[DITS_INSTANCE].exported
  }
} else {

  const { service, Inject, Component } = DI

  const exported = {
    service,
    Inject,
    Handler: DI.Handler,
    Container: DI.Container,
    DispatchEvent: DI.DispatchEvent,
    Component: DI.Component,
    Metadata: DI.Metadata,
    ComponentRegistry: DI.ComponentRegistry,
    HandlerRegistry: DI.HandlerRegistry,

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
  Inject,
  Component,
  DispatchEvent,
  Container,
  Metadata,
  Handler,
  ComponentRegistry, HandlerRegistry,
  security, Security, ZoneHook
} = mainExport.exported
export default mainExport.default