import { Logger } from "tslog"

import DiContainer from './DiContainer';
import Metadata from './Metadata'
import { DispatchEvent, DispatchPredicate, HandlerDeclaration } from './Handlers'

const log = new Logger({ name: __filename })

export class DispatchPredicateRejectionError extends Error { }

export type DispatchVote<E extends DispatchEvent> = {
  vote: DispatchPredicateVote,
  predicate: DispatchPredicate<E>,
  error?: Error
}

export class DispatchPredicateVote {
  constructor(
    public proceed: boolean,
    public warnings: string[] = [],
    public metadata: any = {}
  ) { }
}

// const invocationInjector = <E extends DispatchEvent>(paramTypes: any[], injectParamsIdx: number[], targetMethod: Function, predicates: DispatchPredicate<E>[]) =>
export const invocationInjector = <E extends DispatchEvent>(target: any, event: E, declaration: HandlerDeclaration<E>) =>
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
        const container = DiContainer.fromZone()
        const lookup = container.get(diType)
        // const lookup = REGISTRY.get(diType)
        // log.log('need to inject', idx, diType, REGISTRY, 'found', lookup)
        if (lookup) {
          results[idx] = lookup
        } else {
          // log.warn('DID NOT FIND LOOKUP')
        }
      } else {
        log.info('no inject on ', idx, declaration.dependencies[idxOffByOne], results[idx])
      }
    })
  return results
}

const VOTE_PASSED = Symbol.for("vote_passed")
async function processVote<E extends DispatchEvent>(event: E, hd: HandlerDeclaration<E>): Promise<symbol | any> {
  const vote = await executeVote(event, hd)

  const failover = Metadata.getFailover(hd.target, hd.propertyKey)
  if (vote.errored) {
    if (failover) {
      return failover
    }
    // log.warn('Some vote results failed', vote)
    throw new Error('Something went wrong while evaluating predicates')
  }

  if (vote.rejected) {
    if (failover) {
      return failover
    }
    // log.warn('Some vote results failed', vote)
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
