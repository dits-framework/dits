import security, { Permission } from './security'
import { DispatchEvent, HandlerDeclaration } from '../di/di'

export type HasAnyConfiguration = {
  permissions: Permission[]
}


export const HasAny = <E extends DispatchEvent>(...permissions: Permission[]) => {
  return (e: E, declaration: HandlerDeclaration<E>) => {
    return security.hasAny(...permissions)
  }
}