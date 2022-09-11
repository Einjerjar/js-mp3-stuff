import EventEmitter from 'events'
import sleep from 'sleep-promise'
import type { Readable } from 'stream'

export declare interface EThrottler<T, V> {
  on(event: 'cycle', listener: (v: V) => void): this
  on(event: 'data', listener: (v: T) => void): this
  on(event: 'empty', listener: () => void): this
  on(event: 'threshold', listener: () => void): this
  on(event: 'end', listener: () => void): this
}

type StreamMeta<T> = {
  item: Readable,
  rate: number,
  size: number,
  extra: T
}

export class EThrottler<T = any, V = any> extends EventEmitter {
  rate = 1024
  interval = 1000
  alert_on_threshold = true
  sent_alert = false
  threshold = 0
  threshold_rate = 80
  current_stream_size = 0
  current_stream_progress = 0

  streams: StreamMeta<V>[] = []
  current_stream: Readable | null = null
  stock: Buffer | null = null

  running = false

  constructor(rate: number, interval = 1000, alert_on_threshold = true, threshold_rate = 80, opts?: { captureRejections?: boolean | undefined }) {
    super(opts)
    this.rate = rate
    this.interval = interval
    this.threshold_rate = Math.max(Math.min(99, threshold_rate), 1)
    this.alert_on_threshold = alert_on_threshold
  }

  addStream(s: Readable, r: number, l: number, m: V) {
    this.streams.push({
      item: s,
      rate: r,
      size: l,
      extra: m
    })
    if (this.current_stream === null) this.cycleStream()
  }

  cycleStream() {
    if (this.streams.length === 0) return
    const s = this.streams[0]
    this.streams = this.streams.slice(1)
    this.current_stream = s.item
    this.rate = s.rate
    this.current_stream_size = s.size
    this.threshold = this.threshold_rate / 100 * this.current_stream_size
    this.current_stream_progress = 0
    this.sent_alert = false
    this.emit('cycle', s.extra)
    console.log('CYCLE', s.rate, s.size, this.threshold)
  }

  async run() {
    if (this.current_stream == null && this.streams.length === 0) {
      throw new Error('Stream to throttle is not assigned')
    }
    if (this.current_stream == null) {
      this.cycleStream()
    }
    if (this.current_stream == null) {
      console.log('Throttle stream empty')
      this.emit('end')
      return
    }
    let x: Buffer
    // console.log(''.padEnd(10, '-'), this.current_stream)

    if (this.stock !== null) {
      x = this.stock
    } else {
      x = this.current_stream.read() as Buffer
    }

    // console.log('1', x)

    this.running = true

    while (x != null) {
      while (x.byteLength < this.rate) {
        const y = this.current_stream.read() as Buffer
        if (y === null) break

        x = Buffer.concat([ x, y ])
      }

      // console.log('3', x)

      if (x.byteLength > this.rate) {
        // console.log('qasd', this.rate, x.byteLength)
        this.stock = x.subarray(this.rate)
        x = x.subarray(0, this.rate)
      } else {
        // console.log('dsaq')
        this.stock = null
      }

      if (x.byteLength < this.rate) {
        this.stock = x.subarray()
        this.emit('empty')
        console.log('Throttle stream empty, cycling, 1')

        // const pStream = this.current_stream

        this.cycleStream()

        // console.log(this.current_stream === null, this.current_stream === pStream)

        // x = this.current_stream.read() as Buffer
        continue

        // console.log(x)
      }

      // console.log('2', x)

      this.emit('data', x)
      this.current_stream_progress += x.byteLength
      await sleep(this.interval)

      if (this.stock !== null) {
        x = this.stock
      } else {
        x = this.current_stream.read() as Buffer
      }

      if (x === null) {
        this.emit('empty')
        console.log('Throttle stream empty, cycling, 2')

        // const pStream = this.current_stream

        this.cycleStream()

        // console.log(this.current_stream === null, this.current_stream === pStream)

        x = this.current_stream.read() as Buffer

        // console.log(x)
      }

      if (this.alert_on_threshold && !this.sent_alert && this.current_stream_progress > this.threshold) {
        this.emit('threshold')
        this.sent_alert = true
      }
    }

    console.log('Throttle stream empty')
    this.emit('end')

    this.running = false
  }
}