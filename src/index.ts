
import service, { AppInitContext } from './zones/service'

import { Inject, Metadata } from './di/annotations'
import HandlerRegistry from './di/HandlerRegistry'



import {
  Handler, HandlerDeclaration, DEK_KEY, REGISTER_AS_META_KEY,
  DispatchEvent, DispatchPredicate, DispatchEventHof,
  DispatchPredicateVote, DispatchPredicateRejectionError
} from './di/di'
import Container from './di/Container'
import * as security from './security/security'



export {

  Handler, HandlerDeclaration, DEK_KEY, REGISTER_AS_META_KEY,
  DispatchEvent, DispatchPredicate, DispatchEventHof,
  DispatchPredicateVote, DispatchPredicateRejectionError,

  HandlerRegistry,
  Container,
  Inject,
  Metadata,

  // namespaces
  service,
  AppInitContext,

  security,

}


export function testTheLibrary(a: number, b: number): number {
  return a + b
}