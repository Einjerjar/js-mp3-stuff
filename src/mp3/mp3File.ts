import { qrep } from '@s/utils/utils'
import { DataReader } from './dataReader'
import { ID3Footer } from './id3Footer'
import { ID3Header } from './id3Header'
import { LameHeader } from './lameHeader'
import { MP3Header } from './mp3Header'

export class MP3Reader extends DataReader {
  id3H: ID3Header | null = null
  mp3H: MP3Header
  lameH: LameHeader | null = null
  id3F: ID3Footer | null = null
  content: ArrayBuffer
  content_no_lame: ArrayBuffer
  actual_start = 0
  actual_end = 0
  duration = 0

  constructor(b: ArrayBuffer) {
    super(b)

    if (this.r.readString(3, false) === 'ID3') this.id3H = new ID3Header(b.slice(0, 10))

    const ix_slice        = this.id3H ? this.id3H.size + 10 : 0
    this.r.seek(ix_slice)
    this.mp3H             = new MP3Header(this.r.readWord(), this.r.readWord())

    const iy_slice        = ix_slice + 0x24
    this.r.r_seek(iy_slice)

    const lameMagic       = this.r.readString(4, false)
    if ([ 'Xing', 'Info' ].includes(lameMagic))
      this.lameH          = new LameHeader(b.slice(iy_slice))

    // this.actual_start = ix_slice + this.mp3H.frame_length
    this.actual_start = ix_slice
    this.r.r_seek(b.byteLength - 0x80)

    const id3FooterMagic  = this.r.readString(3, false)
    if (id3FooterMagic    == 'TAG')
      this.id3F           = new ID3Footer(b.slice(b.byteLength - 0x80))

    this.actual_end       = this.id3F ? b.byteLength - 0x80 : b.byteLength
    this.content          = b.slice(this.actual_start, this.actual_end)
    this.content_no_lame  = b.slice(this.actual_start + this.mp3H.frame_length, this.actual_end)
    this.duration         = this.getDuration()
  }

  getDuration() {
    return this.content.byteLength / this.mp3H.bit_rate * 8
  }

  toString() {
    return ''
      + (this.id3H?.toString() ?? '')
      + this.mp3H.toString()
      + (this.lameH?.toString() ?? '')
      + (this.id3F?.toString() ?? '')
      + `Content Length: ${qrep(this.content.byteLength, true)}`
      // + `${qrep(this.actual_start, true)}\n`
      // + `${qrep(this.r.readWord(), true)} ${qrep(this.r.readWord(), true)}\n`
      // + `${this.r.readString(3)}\n`
  }
}