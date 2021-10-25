// // import { DispatchHandler, InjectDeps, PathPredicate } from "../dispatch"

// import zones from '../zones/zones'
// import request from 'supertest'
// import express, { Request, Response } from "express";
// import { Inject, Handler, HANDLERS } from "./di";
// import Container from "./Container";
// import { configureExpress, GET, HTTP, WebEvent } from "../web/web-di";
// import Hashids from '../../node_modules/hashids/cjs';

// import security from '../security/security'
// import { HasAny } from '../security/security-di';

// import { testTheLibrary } from 'dits'

// zones.init() // just dummy to make sure we load it!


// beforeAll(() => {
//   return zones.initApp(async ({ container }) => {

//   })
// })
// beforeEach(() => {
//   zones.container?.reset()
// })

// export class DummySvc {
//   doBiz() {
//     console.log('doing biz!')
//     return 1337
//   }
// }

// export class DummyDao {
//   findAll() {
//     return []
//   }
// }

// export class Foo {

//   @HTTP("/foo/:id", ["GET", "POST"], HasAny('foobar'))
//   handle(e: WebEvent, @Inject svc: DummySvc) {

//     console.log('handle!!', security.hasAny('user', 'admin'), e.path, svc.doBiz())
//     return {
//       ok: true
//     }
//   }

//   @GET("/bar/:id")
//   bar(e: WebEvent, @Inject svc: DummySvc) {

//     console.log('bar!!', security.hasAny('user', 'admin'), e.path, svc.doBiz())
//     return {
//       ok: true
//     }
//   }

// }

// it('manual test', async () => {


//   const svc = new (class extends DummySvc {
//     doBiz() {
//       // console.log('manual test run!')
//       return -1
//     }
//   })

//   await zones.app!.run(async () => {
//     const container = zones.container!
//     container.register(DummySvc, svc)
//     const impl = new Foo()

//     const e = new WebEvent('/foo/bar', 'GET',
//       {} as Request, {} as Response, {}, {})
//     // @ts-ignore
//     expect(impl.handle(e, null)).rejects.toThrow()

//     // @ts-ignore
//     expect(impl.bar(e, null)).resolves.toMatchObject({ ok: true })



//   })


// })


// true && it('test', async () => {
//   const impl = new Foo()
//   const svc = new (class extends DummySvc {
//     doBiz() {
//       console.log('automated run!')
//       return -1338
//     }
//   })

//   await zones.app!.run(async () => {
//     const container = zones.container!
//     container.register(DummySvc, svc)
//     // this has to be inside of the app scope, otherwise the "root" container won't be created
//     const app = express()
//     configureExpress(app, HANDLERS)


//     const agent = request.agent(app);

//     const result = await new Promise(resolve =>
//       agent.get('/foo/bar')
//         .auth('username', 'password')
//         .set('Accept', 'application/json')
//         .expect('Content-Type', /json/)
//         .expect(200, resolve)
//     )

//     console.log('done', result)
//   })



// })
