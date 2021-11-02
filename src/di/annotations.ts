const METADATA_META_KEY = Symbol.for("dits_metadata");
const INJECT_META_KEY = Symbol.for("dits_inject");
const FAILOVER_META_KEY = Symbol.for("dits_failover");

/**
 * 
 * Designate a handler parameter as a injectable dependency
 */
export function Inject(target: Object, propertyKey: string | symbol, parameterIndex: number) {
  const injectParamsIdx: number[] = Reflect.getOwnMetadata(INJECT_META_KEY, target, propertyKey) || [];
  injectParamsIdx.push(parameterIndex);
  Reflect.defineMetadata(INJECT_META_KEY, injectParamsIdx, target, propertyKey);
}
export const getInjectables = (target: any, propertyKey: string | symbol) => {
  return Reflect.getOwnMetadata(INJECT_META_KEY, target, propertyKey) || [] as number[]
}

export interface MetadataType {
  (key: symbol, value: any): ((target: any, propertyKey: string) => any)

  defineMetadata: (key: string | symbol, value: any, target: any, propertyKey: string | symbol) => void;
  retrieveOwnMetadata: (target: any, propertyKey: string | symbol) => any;
  retrieveMetadata: (target: any, propertyKey: string | symbol) => any;
  getFailover: (target: any, propertyKey: string | symbol) => any;
  PredicateFailoverValue: (value: any) => (target: any, propertyKey: string) => void;
}

/**
 * Define metadata on a handler. Used primarily for plugins.
 */
export const Metadata: MetadataType = function Metadata(key: symbol, value: any) {
  return function (target: any, propertyKey: string) {
    const meta = Reflect.getMetadata(METADATA_META_KEY, target, propertyKey) || {}
    if (meta[key]) {
      throw new Error(`Metadata key "${propertyKey}" already provided for target ${target}`)
    }
    meta[key] = value
    Reflect.defineMetadata(METADATA_META_KEY, meta, target, propertyKey)
  };
}


/**
 * If voting for handler execution fails, supply this value instead.
 */
Metadata.PredicateFailoverValue = (value: any) => {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(FAILOVER_META_KEY, value, target, propertyKey)
  }
}

Metadata.getFailover = (target: any, propertyKey: string | symbol) => {
  return Reflect.getMetadata(FAILOVER_META_KEY, target, propertyKey)
}


Metadata.retrieveMetadata = (target: any, propertyKey: string | symbol) => {
  return Reflect.getMetadata(METADATA_META_KEY, target, propertyKey)
}

Metadata.retrieveOwnMetadata = (target: any, propertyKey: string | symbol) => {
  return Reflect.getOwnMetadata(METADATA_META_KEY, target, propertyKey)
}

Metadata.defineMetadata = (key: string | symbol, value: any, target: any, propertyKey: string | symbol) => {
  Reflect.defineMetadata(key, value, target, propertyKey)
}
