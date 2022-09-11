import { Readable, type ReadableOptions } from 'stream'
import { EThrottler } from '@s/utils/throttler'

class NStream extends Readable {
  start = 0
  end = 100
  cursor = this.start

  constructor(opts?: ReadableOptions, start = 0, end = 100) {
    super(opts)
    this.start = start
    this.end = end
  }

  _read(): void {
    this.push(Buffer.from(this.cursor.toString(), 'utf8'))
    this.cursor++
    if (this.cursor >= this.end) {
      this.push(null)
    }
  }
}

const td = new TextDecoder()
const ex = new EThrottler(6, 100)
ex.addStream(new NStream())

ex.on('data', (v: Buffer) => {
  console.log(td.decode(v))
})

ex.run()