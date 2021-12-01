import Service from '../di/service'
import { DispatchEvent, HandlerDeclaration } from '../dispatch/dispatch'

export const HasAny = <E extends DispatchEvent>(...permissions: dits.security.Permission[]) => {
  return (e: E, declaration: HandlerDeclaration<E>) => {
    const pp = Service.fromZone()?.principal?.permissions || []
    return permissions.reduce((s, n) => s || pp.indexOf(n) >= 0, false)
  }
}