// /**
//  * Keeps track of classes and their instances
//  * TODO: make this zone specific? 
//  */
export default class Container {

  private singletons: Map<{ new(...args: any[]): unknown; }, unknown> = new Map();

  constructor(public parent?: Container) { }

  get<T>(key: { new(...args: any[]): unknown; }) {
    let thing = this.singletons.get(key);
    if (!thing) {
      thing = this.parent?.get(key);
    }
    return thing as T | undefined;
  }

  getOrThrow<T>(key: { new(...args: any[]): unknown; }) {
    const s = this.get(key);
    if (!s) {
      throw new Error('Could not locate dependency by key ' + key);
    }
    return s as T;
  }

  register<T>(key: { new(...args: any[]): unknown; }, instance: T) {
    if (this.get(key)) {
      throw new Error('Already registered a singleton of key ' + key);
    }
    this.singletons.set(key, instance);
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
}
