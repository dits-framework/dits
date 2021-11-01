
import Container from './container'
import HandlerRegistry from './registry'
import ComponentRegistry from '../component/registry'
import { Component } from '../component/component'
import { Inject, Metadata, getInjectables } from './annotations'
import service from './service'

export {
  service,
  Container,
  HandlerRegistry,
  ComponentRegistry,
  Inject, Metadata, Component,
}

export const DEK_KEY = Symbol("dek");
export class DispatchEvent {
  [DEK_KEY]: symbol
  constructor(public type: symbol) {
    this[DEK_KEY] = type
  }
}

export type DispatchEventHof<E extends DispatchEvent> =
  ((p1?: any, p2?: any, p3?: any, p4?: any, p5?: any, p6?: any) => DispatchPredicate<E>)

export interface DispatchPredicate<E extends DispatchEvent> {
  (event: E, declaration: HandlerDeclaration<E>): boolean | DispatchPredicateVote;
}

export class DispatchPredicateVote {
  constructor(
    public proceed: boolean,
    public warnings: string[] = [],
    public metadata: any = {}
  ) { }
}

export class DispatchPredicateRejectionError extends Error { }

export interface HandlerDeclaration<E extends DispatchEvent> {
  event: E,
  handler: Function,
  predicates: DispatchPredicate<E>[],
  dependencies: any[],
  target: any,
  propertyKey: string,
  method: Function,
  metadata: any
}


type HandlerWrapper = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => unknown

export function Handler<E extends DispatchEvent>(...predicates: DispatchPredicate<E>[]): HandlerWrapper {
  // const zc: Container | undefined = service.container
  // // const zc: Container | undefined = zones.get('container')
  // if (!zc) {
  //   throw new Error('Could not initialize handler: no zone container found; are you sure you are running inside `initApp` handler?')
  // }

  // const registry: HandlerRegistry | undefined = zc.get(HandlerRegistry)
  // if (!registry) {
  //   throw new Error('Could not initialize handler: no zone handler registry found; are you sure you are running inside `initApp` handler?')
  // }
  return function dynamicHandler(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    service.onInitializing(() => {
      const paramTypes = Reflect.getMetadata("design:paramtypes", target, propertyKey) as any[]

      const eventType = paramTypes[0]
      if (!eventType) {
        console.warn(`Could not configure @Handler on ${target?.constructor?.name}:${propertyKey}(...)`)
        throw new Error('Unexpected params')
      }

      let proto = eventType
      while (proto && proto != DispatchEvent) {
        proto = Object.getPrototypeOf(eventType)
      }

      if (!proto) {
        console.warn(`First parameter of @Handler on ${target?.constructor?.name}:${propertyKey}(...) must be a "DispatchEvent"; received ${eventType?.name || 'unknown'}`)
        throw new Error('Unexpected params')
      }

      const originalFn = descriptor.value!
      const injectParamsIdx: number[] = getInjectables(target, propertyKey) || []
      const dependencies = injectParamsIdx.map(idx => paramTypes[idx])

      const metadata = Metadata.retrieveMetadata(target, propertyKey)

      const decl: HandlerDeclaration<E> = {
        event: eventType,
        handler: descriptor.value, // will get overwritten
        predicates,
        // paramTypes,
        // injectParamsIdx,
        dependencies,
        target,
        propertyKey,
        method: originalFn,
        metadata,
      }

      // descriptor.value = invocationInjector(paramTypes, injectParamsIdx, originalFn, predicates)
      descriptor.value = invocationInjector(target, eventType, decl)
      decl.handler = descriptor.value

      // allow customization of what type of event is being registered for the handler
      const registerType = Reflect.getMetadata(REGISTER_AS_META_KEY, target, propertyKey) || eventType

      const registry = service.container!.getOrThrow(HandlerRegistry, 'Could not locate service Handler Registry; Are you importing files outside app scope?')
      registry.register(registerType, decl)
    })
  }
}

// const invocationInjector = <E extends DispatchEvent>(paramTypes: any[], injectParamsIdx: number[], targetMethod: Function, predicates: DispatchPredicate<E>[]) =>
const invocationInjector = <E extends DispatchEvent>(target: any, event: E, declaration: HandlerDeclaration<E>) =>
  async (...args: any[]) => {

    args = await resolveDependencies(declaration, args)
    const vote = await processVote(event, declaration)

    // If a vote is golden, run the method
    // otherwise, it will return a "failover" value so just return that
    // or of course it could throw an exception... 
    if (vote === VOTE_PASSED) {
      return declaration.method.apply(target, args);
    } else {
      return vote
    }
  }

async function resolveDependencies<E extends DispatchEvent>(declaration: HandlerDeclaration<E>, args: any[]) {
  const results = [...args]
  declaration.dependencies
    .forEach((diType, idxOffByOne) => {
      const idx = idxOffByOne + 1
      if (results[idx] === null || results[idx] === undefined) {
        const container: Container = service.getOrThrow('container')
        const lookup = container.get(diType)
        // const lookup = REGISTRY.get(diType)
        // console.log('need to inject', idx, diType, REGISTRY, 'found', lookup)
        if (lookup) {
          results[idx] = lookup
        } else {
          // console.warn('DID NOT FIND LOOKUP')
        }
      } else {
        console.log('no inject on ', idx, declaration.dependencies[idxOffByOne], results[idx])
      }
    })
  return results
}


type DispatchVote<E extends DispatchEvent> = {
  vote: DispatchPredicateVote,
  predicate: DispatchPredicate<E>,
  error?: Error
}

const VOTE_PASSED = Symbol("vote_passed")
async function processVote<E extends DispatchEvent>(event: E, hd: HandlerDeclaration<E>): Promise<symbol | any> {
  const vote = await executeVote(event, hd)

  const failover = Metadata.getFailover(hd.target, hd.propertyKey)
  if (vote.errored) {
    if (failover) {
      return failover
    }
    // console.warn('Some vote results failed', vote)
    throw new Error('Something went wrong while evaluating predicates')
  }

  if (vote.rejected) {
    if (failover) {
      return failover
    }
    // console.warn('Some vote results failed', vote)
    throw new DispatchPredicateRejectionError('A condition to continue was not met')
  }

  return VOTE_PASSED
}
async function executeVote<E extends DispatchEvent>(event: E, hd: HandlerDeclaration<E>) {
  const votes = await Promise.all(
    hd.predicates.map(async predicate => {
      try {
        let vote = await predicate(event, hd)
        if (vote instanceof Boolean) {
          vote = new DispatchPredicateVote(vote as boolean)
        }
        return { vote, predicate } as DispatchVote<E>
      } catch (error: any) {
        return { error, predicate, vote: new DispatchPredicateVote(false) } as DispatchVote<E>
      }
    })
  )
  const vote = {
    total: votes.length,
    passed: votes.filter(e => e.vote).length,
    rejected: votes.filter(e => !e.vote && !e.error).length,
    errored: votes.filter(e => e.error).length,
    warnings: votes.filter(e => e.vote.warnings),
    votes: votes
  }

  return vote
}

export const REGISTER_AS_META_KEY = Symbol("register_as");