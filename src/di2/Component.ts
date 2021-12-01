import SmartProxy from './proxy'
import ComponentRegistry, { Constructor, ComponentDeclaration } from './ComponentRegistry'
import DiContainer from './DiContainer'

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




export function Component<T>(scope: string = 'app'): Wrapper<T> {

  // nameOrHint && nameOrHints.unshift(nameOrHint)

  // let name: string | undefined
  // let hints: Hint<T>[]
  // if (nameOrHints.length > 0) {
  //   if (typeof (nameOrHints[0]) === 'string') {
  //     name = nameOrHints[0] as string
  //     nameOrHints.shift()
  //     hints = nameOrHints as Hint<T>[]
  //   } else {
  //     hints = nameOrHints as Hint<T>[]
  //   }
  // } else {
  //   hints = []
  // }

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

export type ComponentType =
  (<T>() => Wrapper<T>)
  | (<T>(name: string, ...hints: Hint<T>[]) => Wrapper<T>)
  | (<T>(...hints: Hint<T>[]) => Wrapper<T>)
  | (<T>(...nameOrHints: (string | Hint<T>)[]) => Wrapper<T>)
  | typeof Component

const HINT_KEY = Symbol.for('hints')