import './zones/zones'

/// <reference path = "dits.ns.ts" />

// NOTE: this is a really stupid hacky loader trick, because modules and types are stupid
import exp from './exports'
export * from './exports'
export default exp

export type {
  DispatchEventHof, DispatchPredicate, HandlerDeclaration,
  HandlerRegistry, ComponentRegistry
} from './di/di'