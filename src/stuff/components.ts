import DiContainer from "./container";
import SmartProxy from "./proxy";



export interface Constructor<E> {
  new(...args: any[]): E;
}
export interface ComponentDeclaration<T> {
  instance?: T,
  scope: string,
  // proxy: SmartProxy<T>,
  name: string,
  constructor: Constructor<T>,
  type: Constructor<T>,
  parameters: any[],
  dependencies: any[],
  metadata?: any
}

export interface ComponentInstance<T> extends ComponentDeclaration<T> {
  proxy: SmartProxy<T>
}

/**
 * Used to resolve types, in case of circular dependencies
 */
export function TypeHint(hintsFn: HintFn) {
  return (constructor: Constructor<any>) => {
    Reflect.defineMetadata(HINT_KEY, hintsFn, constructor)
    return constructor
  }
}


export function Component<T>(scope: string = 'app'): Wrapper<T> {
  return (constructor: Constructor<T>) => {

    // could look this up via metadata override (from some new decorator)
    const name = constructor.name

    // could look this up via metadata override (from some new decorator)
    // (useful if you want ServiceA to be registered as ServiceB class for mocking / SPI / etc)
    const registerAs = constructor

    const explicitParams = Reflect.getMetadata(HINT_KEY, constructor)
    const parameters = (explicitParams ? explicitParams() : Reflect.getMetadata("design:paramtypes", constructor)) || []

    const cd: ComponentDeclaration<T> = {
      name,
      scope,
      parameters,
      dependencies: parameters.map(() => null),
      constructor,
      type: registerAs
    }

    // could look this up via metadata override (from some new decorator)
    const container = DiContainer.fromZone()
    container.declare(registerAs, cd)

    return constructor
  }
}


export class ComponentRegistry {
  private declarations = new Map<Constructor<unknown>, ComponentDeclaration<unknown>>();

  register<E>(constructor: Constructor<E>, decl: ComponentDeclaration<E>, override: boolean = false) {
    const current = this.declarations.get(constructor);
    if (current && !override) {
      throw new Error('Component already registered for type ' + constructor)
    }

    this.declarations.set(constructor, decl);
  }

  getDeclarations<E>(event: Constructor<E>) {
    const current = this.declarations.get(event) || [];
    return current as unknown as ComponentDeclaration<E>[];
  }

  getHandlers() {
    return this.declarations
  }

  async populate(scope: string, container: DiContainer) {
    const unresolved = new Set<ComponentDeclaration<unknown>>()

    const graph: Map<Constructor<unknown>, unknown> = new Map()

    const targets = [...this.declarations.values()]
      .filter(cd => cd.scope === scope)
      .map(cd => ({
        ...cd,
        proxy: new SmartProxy(cd.type),
      } as ComponentInstance<unknown>))

    targets.forEach(cd => graph.set(cd.type, cd.proxy.proxy))

    // first iterate the list and set the correct proxies to dependencies
    for (const cd of targets) {
      if (cd.instance) {
        process.env.DITS_DEBUG && console.log('Already found instance; skipping dep injection', cd)
        cd.proxy.setTarget(cd.instance)
        continue;
      }
      // console.log('creating', cd.type, cd.parameters, cd.dependencies, cd.hints)
      for (let idx = 0; idx < cd.parameters.length; idx++) {
        if (cd.dependencies[idx]) {
          process.env.DITS_DEBUG && console.log(`strange, dep ${idx} already resolved; skipping`, cd)
          continue
        }
        const dt = cd.parameters[idx]
        // const dep = this.handlers.get(dt)
        // look it up in the container first
        // if you can't find it there, look it up here 
        let dep = container.get(dt)
        if (!dep) {
          dep = graph.get(dt)
        }

        if (dep) {
          cd.dependencies[idx] = dep
        } else {
          cd.metadata = cd.metadata || {}
          cd.metadata.missing = cd.metadata.missing || [] as any[]
          cd.metadata.missing.push({ index: idx, type: dt })
          unresolved.add(cd)
        }
      }
    }
    if (unresolved.size) {
      throw new UnresolvedDependencyError(`Could not resolve ${unresolved.size} ${unresolved.size === 1 ? 'dependency' : 'dependencies'}`, [...unresolved.values()])
    }

    const failed = new FailedInstantiationError('Some components failed instantiation')
    // now iterate and construct as needed
    for (const cd of targets) {
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

    return graph
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

// type Constructor = { new(...args: any[]): any }
type Wrapper<T> = (constructor: Constructor<T>) => any
type HintFn = () => any[]
type Hint<T> = Constructor<T>
const HINT_KEY = Symbol.for('hints')