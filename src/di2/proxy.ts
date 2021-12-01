
export const TARGET_KEY = Symbol.for('target')

export const PROXY_KEY = Symbol.for('row')


export const NO_TARGET = {}

export default class SmartProxy<T extends Record<string | symbol, any>> {
  target: T
  proxy: T
  stateDirty = false
  constructor(target?: T) {
    const smartProxy = this
    this.target = target || NO_TARGET as T
    this.proxy = new Proxy(this.target, {
      deleteProperty: (_, property) => {
        if (smartProxy.target && smartProxy.target[property]) {
          delete (smartProxy.target[property]);
          smartProxy.stateDirty = true
        }
        return true;
      },
      get: (_, property, receiver) => {
        if (property === TARGET_KEY) {
          return smartProxy.target === NO_TARGET ? undefined : smartProxy.target;
        }
        if (property === PROXY_KEY) {
          return smartProxy
        }
        let result = smartProxy.target ? smartProxy.target[property] : null
        // if (options && options.filterGet) {
        //   const before = result
        //   result = options.filterGet(property, result, this.target, receiver)
        // }

        return result;
      },
      has: (_, property) => {
        return (property in (smartProxy.target || {}));
      },
      set: (_, property, value, receiver) => {
        let target = smartProxy.target
        if (property === TARGET_KEY) {
          target = value;
        } else if (target && property) {
          // @ts-ignore
          target[property] = value
        }


        smartProxy.stateDirty = true
        return (true);
      },
      getOwnPropertyDescriptor: (t, key) => {
        return Object.getOwnPropertyDescriptor(smartProxy.target, key)
      },
      ownKeys: (t) => {
        // const arr = [TARGET_KEY, ...(options?.ignoreProperties || [])]
        const arr: Array<string | symbol> = [TARGET_KEY]
        return Object.keys(smartProxy.target).filter(k => 0 > arr.indexOf(k))
      }
    })
  }

  setTarget(target?: T) {
    this.target = target || NO_TARGET as T
  }

  // I get the current target of the swappable proxy.
  static getTargetOf(proxy: any) {
    return proxy ? proxy[TARGET_KEY] : undefined;
  }

  // I set a new target for the swappable proxy.
  static setTargetOf(proxy: any, target: any) {
    proxy[TARGET_KEY] = target;
  }

  static unwrap<T extends Record<string | symbol, unknown>>(proxy: T) {
    return (proxy ? proxy[TARGET_KEY] : proxy) || proxy
  }

  static getSmartProxy<T>(proxy: any): SmartProxy<T> | undefined {
    return proxy ? proxy[PROXY_KEY] : undefined
  }
}
