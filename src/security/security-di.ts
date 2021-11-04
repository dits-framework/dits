import { service, DispatchEvent, HandlerDeclaration } from '../di/di'

export const HasAny = <E extends DispatchEvent>(...permissions: dits.security.Permission[]) => {
  return (e: E, declaration: HandlerDeclaration<E>) => {
    const pp = service.principal.permissions
    return permissions.reduce((s, n) => s || pp.indexOf(n) >= 0, false)
  }
}