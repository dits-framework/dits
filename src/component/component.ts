import service from '../di/service'
import SmartProxy from './proxy'
import ComponentRegistry, { Constructor, ComponentDeclaration } from './registry'

// type Constructor = { new(...args: any[]): any }
type Wrapper<T> = (constructor: Constructor<T>) => any
type HintFn = () => any[]
type Hint<T> = Constructor<T>


/**
 * Used to resolve types, in case of circular dependencies
 */
export function TypeHint(hintsFn: HintFn) {
  return (constructor: Constructor<any>) => {
    Reflect.defineMetadata(HINT_KEY, hintsFn, constructor)
    return constructor
  }
}

export function Component<T>(): Wrapper<T>
export function Component<T>(name: string, ...hints: Hint<T>[]): Wrapper<T>
export function Component<T>(...hints: Hint<T>[]): Wrapper<T>
export function Component<T>(...nameOrHints: (string | Hint<T>)[]): Wrapper<T> {

  let name: string | undefined
  let hints: Hint<T>[]
  if (nameOrHints.length > 0) {
    if (typeof (nameOrHints[0]) === 'string') {
      name = nameOrHints[0] as string
      nameOrHints.shift()
      hints = nameOrHints as Hint<T>[]
    } else {
      hints = nameOrHints as Hint<T>[]
    }
  } else {
    hints = []
  }

  /*
  * TS doesn't face erasure, but it's reflection does have a problem
  * with circular references + decorator's metadata emits. Essentially,
  * whichever one is defined "first" in a cycle will not know what type
  * they depend on (since the "second" hasn't been declared yet)
  *
  * So after looking at creating our own ts compiler, providing compiler
  * transformers + a transform-friendly runtime, etc... we're just gonna
  * go a head and "move the bike" and require you to specify your deps
  * in a (lazily executed) closure.
  */
  return (constructor: Constructor<T>) => {



    service.onInitializing(() => {
      if (!name) {
        name = constructor.name
      }

      const explicitParams = Reflect.getMetadata(HINT_KEY, constructor)

      const parameters = (explicitParams ? explicitParams() : Reflect.getMetadata("design:paramtypes", constructor)) || []

      const cd: ComponentDeclaration<T> = {
        name,
        parameters,
        dependencies: parameters.map(() => null),
        type: constructor,
        proxy: new SmartProxy<T>(),
        hints
      }
      if (!service.container) {
        throw new Error('Could not locate service Container nor ComponentRegistry. Are you importing files outside of the App zone?')
      }
      service.components.register(constructor, cd)
    })


    return constructor
  }
}

export type ComponentType =
  (<T>() => Wrapper<T>)
  | (<T>(name: string, ...hints: Hint<T>[]) => Wrapper<T>)
  | (<T>(...hints: Hint<T>[]) => Wrapper<T>)
  | (<T>(...nameOrHints: (string | Hint<T>)[]) => Wrapper<T>)

const HINT_KEY = Symbol('hints')