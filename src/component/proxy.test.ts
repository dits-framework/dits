import service from '../di/service'
import 'reflect-metadata'
import SmartProxy from './proxy'
import ComponentRegistry, { Constructor, ComponentDeclaration, FailedInstantiationError } from './registry'
import ServiceA from './proxy-a.test'
import ServiceB from './proxy-b.test'



const registry = new ComponentRegistry()
service.onPreInitialization(() => {
  service.container!.register(ComponentRegistry, registry)
})

// @ts-ignore
service.init({}, ({ container }) => {

  it('builds the graph', async () => {

    // @ts-ignore
    service.autoscan = false

    await service.zone!.run(async () => {
      // const ad = makeDeclaration(ServiceA)
      // const bd = makeDeclaration(ServiceB)

      // registry.register(ServiceA, ad)
      // registry.register(ServiceB, bd)

      try {
        await registry.initialize()
      } catch (err: any) {
        if (err instanceof FailedInstantiationError) {
          console.warn(err.failures)
          throw err
        }
      }

      const a = registry.getOrThrow(ServiceA)
      const b = registry.getOrThrow(ServiceB)

      console.log(a.doA(true))
      console.log(b.doB(true))

      // for( const cd of registry.getDeclarations() ){

      // }
    })
  })

  it('defers the dependencies', async () => {

    // import { ServiceA, ServiceB } from svcs as NodeModule
    const ap = new SmartProxy()
    const bp = new SmartProxy()

    let a = ap.proxy as ServiceA
    let b = bp.proxy as ServiceB

    const asvc = new ServiceA(b)
    const bsvc = new ServiceB(a)

    ap.setTarget(asvc)
    bp.setTarget(bsvc)

    a.doA(true)

    b.doB(true)
  })

  // it('puts the lotion on its skin', async () => {
  //   const target = { id: 5 }
  //   const sp = new SmartProxy()
  //   sp.setTarget(target)
  //   const { proxy } = sp

  //   console.log(Object.keys(proxy), proxy, proxy.id)


  //   // console.log(sp.target, proxy, sp.proxy === target, sp.target === target)

  //   // const unwrapped = SmartProxy.unwrap(proxy)
  //   // console.log(unwrapped === target)
  //   // expect(unwrapped).toBe(target)

  // })
})