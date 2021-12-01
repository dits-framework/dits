import Service from './service2'




it('test', async () => {

  const svc = new Service({
    name: 'testApp',
    port: 3000,
    envPrefix: 'TEST_'
  })
  console.log('hey there!', svc)

  await svc.initialize(({ service }) => {
    expect(service).toBe(svc)
  })
})