import '../zones/zones'
import { Component } from './Component'
import DiContainer from './DiContainer'

import DitsTestHarness from '../testing/harness'


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

  class ManuallyProvidedComponent {

    canRunCode() {
      return true
    }
  }

  @Component()
  class FooService {

    constructor(public dao: FooDao, public security: ManuallyProvidedComponent) { }

    async ensureFoo(id: number) {
      if (!this.security.canRunCode()) {
        throw new Error('not allowed')
      }
      const foo = await this.dao.getFoo(id)
      if (!foo) {
        throw new Error('Failed to find foo ' + id)
      }
      return foo
    }
  }

  return {
    SimpleDb,
    FooDao,
    FooService,
    ManuallyProvidedComponent
  }
}


it('manually provided components work?', harness.wrap(async () => {
  const { ManuallyProvidedComponent } = createClasses()

  const container = DiContainer.fromZone()
  container.provide(ManuallyProvidedComponent, new ManuallyProvidedComponent())
  await container.initialize('app')

  console.log(Zone.current.name, container)

}))

it('manually provided components missing blows up', harness.wrap(async () => {
  const { ManuallyProvidedComponent } = createClasses()

  const container = DiContainer.fromZone()
  await expect(container.initialize('app')).rejects.toThrowError()

  console.log(Zone.current.name, container)
}))