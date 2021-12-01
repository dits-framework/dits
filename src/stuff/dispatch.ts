
export const DispatchEventKey = Symbol.for('DitsEventKey')

export class DispatchEvent {
  public [DispatchEventKey]: string
  constructor(key: string) {
    this[DispatchEventKey] = key
  }
}
export interface EventConstructor<E extends DispatchEvent> {
  new(...args: any[]): E;
}

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

export interface HandlerDeclaration<E extends DispatchEvent> {
  event: E,
  type: E,
  handler: Function,
  predicates: DispatchPredicate<E>[],
  dependencies: any[],
  target: any,
  propertyKey: string,
  method: Function,
  metadata: any
}