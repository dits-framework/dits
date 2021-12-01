// import { CONTAINER_PROPERTY } from '../zones/zones'
import ComponentRegistry, { ComponentDeclaration } from "./ComponentRegistry"

// /**
//  * Keeps track of classes and their instances
//  * TODO: make this zone specific? 
//  */
export default class DiContainer {

  static ZONE_PROPERTY = '_ditsContainer'

  private components = new ComponentRegistry()

  private singletons: Map<{ new(...args: any[]): unknown; }, unknown> = new Map();

  constructor(public parent?: DiContainer) { }


  static fromZone() {
    return Zone.current.get(DiContainer.ZONE_PROPERTY)! as DiContainer
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

  declare<T>(key: { new(...args: any[]): unknown; }, declaration: ComponentDeclaration<T>, override = false) {
    this.components.register(key, declaration, override);
    return this;
  }

  reset(parent?: DiContainer | Boolean) {
    this.singletons.clear();
    if (parent instanceof DiContainer) {
      this.parent = parent;
    } else if (parent instanceof Boolean && parent) {
      this.parent = undefined;
    }
  }

  async initialize(scope: string, ...scopes: string[]) {
    for (const s of [scope, ...scopes]) {
      await this.components.populate(s, this);
    }
  }

  unwrap() {
    return this.singletons
  }

  createChild() {
    return new DiContainer(this)
  }
}
