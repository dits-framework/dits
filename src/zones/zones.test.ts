import ZonePatch from './zones'

const simulateTest = async (parent: Zone) => {
  const app = parent.fork({
    name: 'app'
  })

  let before: string | undefined, after: string | undefined

  await app.run(async () => {
    before = Zone.current.name
    await Promise.resolve()
    after = Zone.current.name
  })
  return { before, after }
}

it('should fail', async () => {
  const { before, after } = await simulateTest(Zone.current)
  expect(before).not.toBe(after)
})
it('puts the lotion on its skin', async () => {
  ZonePatch.enable()
  const { before, after } = await simulateTest(Zone.current)
  expect(before).toBe(after)
  ZonePatch.disable()
})



function recurseZones(level: number): PromiseLike<number[]> {
  const name = 'zone' + level
  return new Promise((resolve, reject) => {
    Zone.current.fork({ name })
      .run(async () => {
        try {
          expect(Zone.current.name).toBe(name)
          await Promise.resolve()
          expect(Zone.current.name).toBe(name)

          let finishedZones: number[] = []
          if (level > 1) {
            finishedZones = await recurseZones(level - 1)
          }

          finishedZones.push(level)

          resolve(finishedZones)
        } catch (err) {
          reject(err)
        }
      })
  })
}

it('works for multiple nested', async () => {
  ZonePatch.enable()

  const result = await recurseZones(10)
  console.log(result)

  ZonePatch.disable()
})

