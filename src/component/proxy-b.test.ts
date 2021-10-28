import ServiceA from './proxy-a.test'
import { Component, TypeHint } from "./component"

@Component()
@TypeHint(() => [ServiceA])
export default class ServiceB {
  constructor(private a: ServiceA) {

  }

  doB(makeCall: boolean): string {
    if (makeCall) {
      return 'B ran with A: ' + this.a.doA(false)
    }
    return 'B-'
  }
}

it('is an import for another test', () => { })