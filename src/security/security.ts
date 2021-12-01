import { DispatchEvent } from "../dispatch/dispatch";

export class SecurityContext {
  constructor(
    public principal: dits.security.Principal
  ) { }
}

export class Authenticator {
  async authenticate<E extends DispatchEvent>(event: E) {
    return ANONYMOUS
  }
}

class AnonymousPrincipal implements dits.security.Principal {
  authenticated = false
  permissions: dits.security.Permission[] = []
}
export const ANONYMOUS = new AnonymousPrincipal()