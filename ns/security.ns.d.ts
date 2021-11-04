
namespace dits {
  export namespace security {
    export type Permission = String
    export interface Principal {
      authenticated: boolean
      permissions: Permission[]
    }
  }
}