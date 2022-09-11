import express from 'express'

import log from '@s/logger'
import radioRoute, { prepSong } from '@r/radio'
// import radioRoute, { prepSong } from '@r/radio_c'

/* -------------------------------------------------- */

const app = express()
app.use('/radio', radioRoute)
app.use(express.static('./public'))

prepSong()

const server = app.listen(3030, () => {
  log.info('[ ♦️ ] Listening')
  log.info(''.padEnd(20, '-'))
})

server.on('connection', s => {
  s.setTimeout(10 * 1000)
})