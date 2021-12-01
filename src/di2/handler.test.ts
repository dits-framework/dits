import '../zones/zones'
import { Component } from './Component'
import DiContainer from './DiContainer'

import DitsTestHarness from '../testing/harness'
import { DispatchEvent, Handler, DispatchPredicate } from './Handlers'


const harness = new DitsTestHarness()

beforeAll(() => harness.init())
afterAll(() => harness.shutdown())

const createClasses = () => {
  @Component()
  class SimpleDb {

    async query(sql: string) {
      return [{ id: 1 }]
    }
  }

  @Component()
  class FooDao {

    constructor(public db: SimpleDb) { }

    async getFoo(id: number) {
      return await this.db.query(`select * from foo where id = ${id}`)
    }
  }

  @Component()
  class FooService {

    constructor(public dao: FooDao) { }

    async ensureFoo(id: number) {
      const foo = await this.dao.getFoo(id)
      if (!foo) {
        throw new Error('Failed to find foo ' + id)
      }
      return foo
    }
  }

  class FooEvent extends DispatchEvent {
    constructor() {
      super('foo')
    }
  }

  function ExampleHandler(path: string, ...predicates: DispatchPredicate<FooEvent>[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      // do whatever other metadata stuff you want / need for this implementation
      Handler(...predicates)(target, propertyKey, descriptor)
    }
  }

  @Component()
  class FooHandler {

    @ExampleHandler('test')
    async test1(e: FooEvent) {
      console.log('being handled!')

      return {}
    }
  }

  return {
    SimpleDb,
    FooDao,
    FooService,
    FooHandler,
    FooEvent
  }
}


it('manually provided components work?', harness.wrap(async () => {
  const { FooEvent, FooHandler } = createClasses()

  const container = DiContainer.fromZone()

  await container.initialize('app')

  console.log(container.handlers.getDeclarations(FooEvent))

  // const handler = container.getOrThrow(FooHandler)
  // const event = new FooEvent()

  // await handler.test1(event)



}))

