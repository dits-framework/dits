import { Logger } from "tslog"
import Container from "../di/container";
import { invocationInjector } from "./invoker";

import { DispatchEvent, DispatchPredicate, EventConstructor, DispatchPredicateVote, DispatchEventKey, HandlerDeclaration } from './dispatch'

import Metadata from '../di/Metadata'

const log = new Logger({ name: __filename })

export const REGISTER_AS_META_KEY = Symbol.for("register_as");

export const HANDLER_KEY = Symbol.for('dits_handlers')


export type HandlerWrapper = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => unknown

export function Handler<E extends DispatchEvent>(eventType: EventConstructor<E>, ...predicates: DispatchPredicate<E>[]): HandlerWrapper {
  return function dynamicHandler(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const paramTypes = Reflect.getMetadata("design:paramtypes", target, propertyKey) as any[]



    // const eventType = paramTypes[0]
    if (!eventType) {
      log.warn(`Could not configure @Handler on ${target?.constructor?.name}:${propertyKey}(...)`)
      throw new Error('Unexpected params')
    }

    let proto = eventType
    while (proto && proto != DispatchEvent) {
      proto = Object.getPrototypeOf(eventType)
    }

    if (!proto) {
      log.warn(`First parameter of @Handler on ${target?.constructor?.name}:${propertyKey}(...) must be a "DispatchEvent"; received ${eventType?.name || 'unknown'}`)
      throw new Error('Unexpected params')
    }

    const originalFn = descriptor.value!
    const dependencies = paramTypes

    const metadata = Metadata.retrieveMetadata(target, propertyKey) || {}


    // allow customization of what type of event is being registered for the handler
    const registerType = Reflect.getMetadata(REGISTER_AS_META_KEY, target, propertyKey) || eventType

    const decl: HandlerDeclaration<E> = {
      type: registerType,
      handler: descriptor.value, // will get overwritten
      predicates,
      dependencies,
      target,
      propertyKey,
      method: originalFn,
      metadata,
    }

    // descriptor.value = invocationInjector(paramTypes, injectParamsIdx, originalFn, predicates)
    descriptor.value = invocationInjector(target, decl)
    decl.handler = descriptor.value



    // const container = DiContainer.fromZone()
    // container.handler(registerType, decl)



    const handlers = Reflect.getMetadata(HANDLER_KEY, target.constructor) || [] as HandlerDeclaration<any>[]
    handlers.push(decl)
    Reflect.defineMetadata(HANDLER_KEY, handlers, target.constructor)
  }
}

export class HandlerRegistry {
  private handlers: Map<EventConstructor<DispatchEvent>, HandlerDeclaration<DispatchEvent>[]> = new Map();

  register<E extends DispatchEvent>(event: EventConstructor<E>, decl: HandlerDeclaration<E>) {
    const current = this.handlers.get(event) || [];
    current.push(decl as unknown as HandlerDeclaration<DispatchEvent>);
    this.handlers.set(event, current);
  }

  getDeclarations<E extends DispatchEvent>(event: EventConstructor<E>) {
    const current = this.handlers.get(event) || [];
    return current as unknown as HandlerDeclaration<E>[];
  }

  unwrap() {
    return this.handlers
  }
}
