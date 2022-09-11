import type { Response } from 'express'
import type { ReadStream } from 'fs'

import fs from 'fs/promises'
import path from 'path'
import { globby } from 'globby'
import { Readable } from 'stream'
import { Router } from 'express'

import log from '@s/logger'
import { MP3Reader } from '@s/mp3/mp3File'
import { EThrottler } from '@s/utils/throttler'
import type { MP3Header } from '@s/mp3/mp3Header'
import type { ID3Footer } from '@s/mp3/id3Footer'

/* -------------------------------------------------- */

const throttle_divider = 4

type SongMeta = {
  id3?: ID3Footer,
  mp3: MP3Header,
  duration: number,
  filename: string
}

const songList = await globby('./__songs/*.mp3')
const throttle = new EThrottler<Buffer, SongMeta>(0, (1000 - 50) / throttle_divider)
const listeners: Response[] = []
let songIndex = 0

throttle.on('cycle', v => {
  const duration = v.duration
  const song_sec = Math.floor(duration % 60).toString().padStart(2, '0')
  const song_min = Math.floor(duration / 60 % 60).toString().padStart(2, '0')
  const song_hr  = Math.floor(duration / 600 % 24).toString().padStart(2, '0')

  const h_duration = `${song_hr}:${song_min}:${song_sec}`

  const n = v.id3?.title || path.parse(v.filename).name
  log.info(`[ ▶️ ] Currently playing: ${n} @ ${h_duration} w/ br:${v.mp3.bit_rate}`)
})

throttle.on('threshold', () => {
  console.log('thresh')
  prepSong()
})

throttle.on('data', v => {
  for (const i of listeners) {
    i.write(v)
  }
})

export const prepSong = async () => {
  const s = songList[songIndex % songList.length]
  const f = await fs.readFile(s)
  const m = new MP3Reader(f.buffer)
  const bit_rate = m.mp3H.bit_rate
  songIndex += 1
  log.info(`[ ! ] Prep Song ${m.id3F?.title || s}`)

  const q = Readable.from(Buffer.from(m.content_no_lame))
  throttle.addStream(q, bit_rate / 8 / throttle_divider, m.content_no_lame.byteLength, {
    id3: m.id3F || undefined,
    mp3: m.mp3H,
    duration: m.duration,
    filename: s
  })

  if (!throttle.running) {
    console.log('[ > ] RUN FOREST RUN')
    throttle.run()
  }
}

// prepSong()

const route = Router()

route.get('/', (req, res) => {
  res.set('content-type', 'audio/mp3')
  res.set('accept-range', 'bytes')

  listeners.push(res)
  log.info(`[ + ] Client [${req.ip}] connected`)

  req.on('close', () => {
    listeners.splice(listeners.indexOf(res), 1)
    log.info(`[ - ] Client [${req.ip}] disconnected`)
  })
})

export const radioRoute = route
export default radioRoute