import { promises as fs } from 'fs'
import { MP3Reader } from './mp3/mp3File'

// const song = './songs/Brittle Bones Nicky (Official Music Video)(MP3_160K).mp3'
// const song = './_songs/hydra.mp3'
const song = './__songs/【8 bit】 Sabaton - A Ghost In The Trenches(MP3_160K).mp3'
// const song = './songs/sample-09s.mp3'

const d = await fs.readFile(song)

const mp3 = new MP3Reader(d.buffer)

console.log(mp3.toString())