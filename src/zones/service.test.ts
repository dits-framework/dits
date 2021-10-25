import 'zone.js';
import service from './service'


it('basic test', async () => {
  console.log('Got zones?', service)

  service.init(async (container) => {
    console.log('what up dawg', container)

  })
})