
export type Permission = String

export const Permissions = {
  SUPER_ADMIN: 'superadmin' as Permission
} as Record<string, Permission>

export enum PrincipalType {
  USER = 'user', INTEGRATION = 'integration'
}

export interface PrincipalMember {
  id: number
}

export interface Principal {
  anonymous: boolean
  tenant: number
  type: PrincipalType
  impersonating: boolean
  permissions: Permission[]
  asUser: () => UserPrincipal
  asIntegration: () => IntegrationPrincipal
}

export abstract class BasePrincipal implements Partial<Principal> {

  asUser(): UserPrincipal {
    throw new Error('Principal is not of type UserPrincipal')
  }

  asIntegration(): IntegrationPrincipal {
    throw new Error('Principal is not of type IntegrationPrincipal')
  }
}

export class AnonymousPrincipal extends BasePrincipal {
  anonymous = true
  type = PrincipalType.USER
  impersonating = false
  permissions = []
  tenant = 0
}
export const ANONYMOUS = new AnonymousPrincipal()

export class UserPrincipal extends BasePrincipal {
  anonymous = false
  type = PrincipalType.USER
  impersonating: boolean

  constructor(
    public tenant: number,
    public identity: number,
    public audit: number,
    public member?: PrincipalMember,
    public permissions: Permission[] = []
  ) {
    super()
    this.impersonating = audit !== identity
  }

  asUser() {
    return this
  }

}

export class IntegrationPrincipal extends BasePrincipal {
  anonymous = false
  type = PrincipalType.INTEGRATION
  impersonating = false

  constructor(
    public tenant: number,
    public tid: number,
    public key: string,
    public identity: number,
    public audit: number,
    public permissions: Permission[] = []
  ) {
    super()
  }

  asIntegration() {
    return this
  }
}

export class SecurityService {

  get principal() {
    const principal: Principal | undefined = Zone.current.get('principal')
    return principal || ANONYMOUS
  }

  hasAny(...permissions: Permission[]) {
    return !!permissions.find(e => this.principal.permissions.find(p => p === e))
  }

}

export default new SecurityService()