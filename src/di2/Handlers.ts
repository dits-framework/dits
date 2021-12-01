
export const DispatchEventKey = Symbol.for('DitsEventKey')

export class DispatchEvent {
  public [DispatchEventKey]: string
  constructor(key: string) {
    this[DispatchEventKey] = key
  }
}
interface EventConstructor<E extends DispatchEvent> {
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
  handler: Function,
  predicates: DispatchPredicate<E>[],
  dependencies: any[],
  target: any,
  propertyKey: string,
  method: Function,
  metadata: any
}

export default class HandlerRegistry {
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
