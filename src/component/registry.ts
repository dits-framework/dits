import SmartProxy from "./proxy";



export interface Constructor<E> {
  new(...args: any[]): E;
}
export interface ComponentDeclaration<T> {
  instance?: T,
  proxy: SmartProxy<T>,
  name: string,
  type: Constructor<T>,
  parameters: any[],
  dependencies: any[],
  hints: any[],
  metadata?: any
}

export default class ComponentRegistry {
  private handlers = new Map<Constructor<unknown>, ComponentDeclaration<unknown>>();

  private graph?: Map<Constructor<unknown>, unknown>

  register<E>(constructor: Constructor<E>, decl: ComponentDeclaration<E>) {
    const current = this.handlers.get(constructor);
    if (current) {
      throw new Error('Component already registered for type ' + constructor)
    }

    this.handlers.set(constructor, decl);
  }

  getDeclarations<E>(event: Constructor<E>) {
    const current = this.handlers.get(event) || [];
    return current as unknown as ComponentDeclaration<E>[];
  }

  getHandlers() {
    return this.handlers
  }

  async initialize() {
    const unresolved = new Set<ComponentDeclaration<unknown>>()

    // first iterate the list and set the correct proxies to dependencies
    for (const cd of this.handlers.values()) {
      if (cd.instance) {
        process.env.DITS_DEBUG && console.log('Already found instance; skipping dep injection', cd)
        continue;
      }
      // console.log('creating', cd.type, cd.parameters, cd.dependencies, cd.hints)
      for (let idx = 0; idx < cd.parameters.length; idx++) {
        if (cd.dependencies[idx]) {
          process.env.DITS_DEBUG && console.log(`strange, dep ${idx} already resolved; skipping`, cd)
          continue
        }
        const dt = cd.parameters[idx]
        const dep = this.handlers.get(dt)
        if (dep) {
          cd.dependencies[idx] = dep.proxy.proxy
        } else {
          cd.metadata = cd.metadata || {}
          cd.metadata.missing = cd.metadata.missing || [] as any[]
          cd.metadata.missing.push({ index: idx, type: dt })
          unresolved.add(cd)
        }
      }
    }
    if (unresolved.size) {
      throw new UnresolvedDependencyError(`${unresolved.size} Unresolved dependencies`, [...unresolved.values()])
    }

    const failed = new FailedInstantiationError('Some components failed instantiation')
    // now iterate and construct as needed
    for (const cd of this.handlers.values()) {
      if (cd.instance) {
        process.env.DITS_DEBUG && console.log('Already found instance; skipping instantiation', cd)
      } else {
        try {
          cd.instance = new cd.type(...cd.dependencies)
        } catch (err: any) {
          failed.failures.push({
            declaration: cd,
            error: err
          })
        }
      }
      cd.proxy.setTarget(cd.instance)
    }

    if (failed.failures.length > 0) {
      throw failed
    }

    this.graph = new Map<Constructor<unknown>, ComponentDeclaration<unknown>>()
    for (const cd of this.handlers.values()) {
      this.graph.set(cd.type, cd.proxy.proxy)
    }
  }

  get<T>(key: Constructor<T>) {
    if (!this.graph) {
      throw new Error('Graph not initialized yet')
    }
    return this.graph.get(key) as T | undefined;
  }

  getOrThrow<T>(key: Constructor<T>, errMessage?: string) {
    const s = this.get(key);
    if (!s) {
      throw new Error(errMessage || 'Could not locate component by key ' + key);
    }
    return s as T;
  }
}

export class UnresolvedDependencyError extends Error {
  constructor(message: string, public unresolvedComponents: ComponentDeclaration<unknown>[]) {
    super(message)
  }
}

export class FailedInstantiationError extends Error {
  failures: { declaration: ComponentDeclaration<unknown>, error: Error }[] = [];

  constructor(message: string) {
    super(message)
  }
}