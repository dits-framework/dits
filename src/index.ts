// MOST IMPORTANT THING: we load and hotpatch zone.js FIRST
import ZoneHook from './zones/zones'
import 'reflect-metadata'

import * as DI from './di/di'


type Config = dits.config.Configuration


/// <reference path = "dits.ns.ts" />
// /// <reference path = "config/config.ts" />
// /// <reference path = "di/di.ns.ts" />
// import './config/config.ns'
// import './di/di.ns'




import security, * as Security from './security/security'

const { service, Inject, Component } = DI

export { service, Inject, Component, security, DI, Config, Security, ZoneHook }

export default service