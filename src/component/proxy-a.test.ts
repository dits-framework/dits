import ServiceB from './proxy-b.test'
import { Component, TypeHint } from "./component"


@Component()
@TypeHint(() => [ServiceB])
export default class ServiceA {
  constructor(private b: ServiceB) {
  }

  doA(makeCall: boolean): string {
    if (makeCall) {
      return 'A ran with B: ' + this.b.doB(false)
    }
    return 'A+'
  }
}

it('is an import for another test', () => { })