import { DispatchEvent, HandlerDeclaration } from './di';



interface EventConstructor<E extends DispatchEvent> {
  new(...args: any[]): E;
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
}
