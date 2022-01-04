// import { CONTAINER_PROPERTY } from '../zones/zones'
import { Logger } from "tslog"
import { ComponentRegistry, ComponentDeclaration } from "./components"
import { HandlerRegistry, HANDLER_KEY } from "../dispatch/handlers"
import { DispatchEvent, EventConstructor, HandlerDeclaration } from "../dispatch/dispatch"

const log = new Logger({ name: __filename })

// /**
//  * Keeps track of classes and their instances
//  * TODO: make this zone specific? 
//  */


type ConstructorOrAbstractConstructor<T> = { new(...args: any[]): T; } | Function & { prototype: T }
export default class Container {

  static ZONE_PROPERTY = '_ditsContainer'

  public components = new ComponentRegistry()
  public handlers = new HandlerRegistry()

  private singletons: Map<ConstructorOrAbstractConstructor<any>, unknown> = new Map();

  constructor(public name: string, public parent?: Container) { }

  static fromZone() {
    return Zone.current.get(Container.ZONE_PROPERTY)! as Container
  }

  get<T, C extends ConstructorOrAbstractConstructor<T>>(key: C): T | undefined {
    let thing = this.singletons.get(key);
    if (!thing) {
      thing = this.parent?.get(key);
    }
    return thing as T | undefined;
  }

  getOrThrow<T, C extends ConstructorOrAbstractConstructor<T>>(key: C, errMessage?: string): T {
    const s = this.get(key);
    if (!s) {
      throw new Error(errMessage || 'Could not locate dependency by key ' + key);
    }
    return s as T;
  }

  provide<T>(key: ConstructorOrAbstractConstructor<T>, instance: T, override = false) {
    // TODO should we override / sync with components?
    if (this.get(key) && !override) {
      throw new Error('Already registered a singleton of key ' + key);
    }
    this.singletons.set(key, instance);
    return this;
  }

  // TODO rename to component
  declare<T>(key: ConstructorOrAbstractConstructor<T>, declaration: ComponentDeclaration<T>, override = false) {
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
      for (const container of this.getAncestry()) {
        const graph = await container.components.populate(s, this);
        for (const [key, value] of graph.entries()) {
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
  }

  private getAncestry(asc: boolean = true) {
    const ancestry = []
    let target: Container | undefined = this
    while (target) {
      asc ? ancestry.unshift(target) : ancestry.push(target)
      target = target.parent
    }
    return ancestry
  }

  unwrap() {
    return this.singletons
  }

  createChild(name: string) {
    return new Container(name, this)
  }
}
