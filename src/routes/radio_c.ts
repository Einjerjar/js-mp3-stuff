import type { Response } from 'express'

import fs from 'fs'
import path from 'path'
import Throttle from 'throttle'
import { Router } from 'express'
import { globby } from 'globby'
import { ffprobe } from '@dropb/ffprobe'

import log from '@s/logger'

/* -------------------------------------------------- */

const listeners: Response[] = []
let current_song: fs.ReadStream | null = null

const songList = await globby('./songs/')
let songIndex = 0

export const prepSong = async () => {
  const s = songList[songIndex % songList.length]
  const ff_info = await ffprobe(s)
  const bit_rate = parseInt(ff_info.format.bit_rate)
  const duration = parseFloat(ff_info.format.duration)
  const throttle = new Throttle(bit_rate / 8)

  const song_sec = Math.floor(duration % 60).toString().padStart(2, '0')
  const song_min = Math.floor(duration / 60 % 60).toString().padStart(2, '0')
  const song_hr  = Math.floor(duration / 600 % 24).toString().padStart(2, '0')

  const h_duration = `${song_hr}:${song_min}:${song_sec}`

  current_song = fs.createReadStream(s)
  current_song.pipe(throttle).on('data', (chunk: any) => {
    console.log(chunk)
    for (const i of listeners) {
      i.write(chunk)
    }
  })
  current_song.on('end', async () => {
    songIndex += 1
    // console.log('a', listeners.length)
    prepSong()
  })

  log.info(`[ ▶️ ] Currently playing: ${path.parse(s).name} @ ${h_duration} w/ br:${bit_rate}`)
  // console.log('b', listeners.length)
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