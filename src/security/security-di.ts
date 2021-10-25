import { DispatchEvent, DispatchEventHof, HandlerDeclaration } from "../di/di"
import security, { Permission } from "./security"

export type HasAnyConfiguration = {
  permissions: Permission[]
}


export const HasAny = <E extends DispatchEvent>(...permissions: Permission[]) => {
  return (e: E, declaration: HandlerDeclaration<E>) => {
    return security.hasAny(...permissions)
  }
}