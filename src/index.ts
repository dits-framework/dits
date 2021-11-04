import ZoneHook from './zones/zones'

/// <reference path = "dits.ns.ts" />

import { service } from './di/di'
import { SecurityContext } from './security/security'


export {
  ZoneHook,
  SecurityContext
}

export {
  Inject,
  Handler,
  Container,
  Component,
  DispatchEvent,
  ComponentRegistry,
  HandlerRegistry,
  Metadata,
} from './di/di'

export type {
  DispatchEventHof, DispatchPredicate, HandlerDeclaration,
} from './di/di'

export default service