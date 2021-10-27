namespace dits {
  export namespace di {
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

    export class DispatchPredicateVote {
      constructor(
        public proceed: boolean,
        public warnings: string[] = [],
        public metadata: any = {}
      ) { }
    }
  }
}