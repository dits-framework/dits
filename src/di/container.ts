// import { CONTAINER_PROPERTY } from '../zones/zones'
import { ComponentRegistry, ComponentDeclaration } from "./components"
import { HandlerRegistry, HANDLER_KEY } from "../dispatch/handlers"
import { DispatchEvent, EventConstructor, HandlerDeclaration } from "../dispatch/dispatch"

// /**
//  * Keeps track of classes and their instances
//  * TODO: make this zone specific? 
//  */
export default class Container {

  static ZONE_PROPERTY = '_ditsContainer'

  private components = new ComponentRegistry()
  public handlers = new HandlerRegistry()

  private singletons: Map<{ new(...args: any[]): unknown; }, unknown> = new Map();

  constructor(public parent?: Container) { }

  static fromZone() {
    return Zone.current.get(Container.ZONE_PROPERTY)! as Container
  }

  get<T>(key: { new(...args: any[]): unknown; }) {
    let thing = this.singletons.get(key);
    if (!thing) {
      thing = this.parent?.get(key);
    }
    return thing as T | undefined;
  }

  getOrThrow<T>(key: { new(...args: any[]): T; }, errMessage?: string) {
    const s = this.get(key);
    if (!s) {
      throw new Error(errMessage || 'Could not locate dependency by key ' + key);
    }
    return s as T;
  }

  provide<T>(key: { new(...args: any[]): unknown; }, instance: T, override = false) {
    // TODO should we override / sync with components?
    if (this.get(key) && !override) {
      throw new Error('Already registered a singleton of key ' + key);
    }
    this.singletons.set(key, instance);
    return this;
  }

  // TODO rename to component
  declare<T>(key: { new(...args: any[]): unknown; }, declaration: ComponentDeclaration<T>, override = false) {
    this.components.register(key, declaration, override);
    return this;
  }


  // handler<T>(key: { new(...args: any[]): unknown; }, declaration: ComponentDeclaration<T>, override = false) {

  handler<E extends DispatchEvent>(event: EventConstructor<E>, declaration: HandlerDeclaration<E>) {
    this.handlers.register(event, declaration);
    return this;
  }

  reset(parent?: Container | Boolean) {
    this.singletons.clear();
    if (parent instanceof Container) {
      this.parent = parent;
    } else if (parent instanceof Boolean && parent) {
      this.parent = undefined;
    }
  }

  async initialize(scope: string, ...scopes: string[]) {
    for (const s of [scope, ...scopes]) {
      const graph = await this.components.populate(s, this);
      for (const [key, value] of graph.entries()) {

        // const wrap = SmartProxy.getSmartProxy(value)
        // const sym = Symbol.for('handlers')
        // const handlers: HandlerDeclaration<any>[] = Metadata.retrieveMetadata(key, sym)
        // if (handlers) {
        //   console.log(handlers)
        // }

        const handlers = Reflect.getMetadata(HANDLER_KEY, key) as HandlerDeclaration<any>[] | undefined
        if (handlers) {
          handlers.forEach(h => {
            this.handlers.register(h.type, h)
          })
        }

        this.provide(key, value)
      }
    }
  }

  unwrap() {
    return this.singletons
  }

  createChild() {
    return new Container(this)
  }
}
