import 'zone.js'
import 'reflect-metadata'

import * as DI from './di/di'


type Config = dits.config.Configuration


/// <reference path = "dits.ns.ts" />
// /// <reference path = "config/config.ts" />
// /// <reference path = "di/di.ns.ts" />
// import './config/config.ns'
// import './di/di.ns'




import security, * as Security from './security/security'

export { security, DI, Config, Security }
export default { security, DI, Security }