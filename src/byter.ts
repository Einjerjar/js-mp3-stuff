import { promises as fs } from 'fs'

// const song = './songs/Brittle Bones Nicky (Official Music Video)(MP3_160K).mp3'
// const song = './_songs/hydra.mp3'
// const song = './songs/【8 bit】 Sabaton - A Ghost In The Trenches(MP3_160K).mp3'
const song = './songs/sample-09s.mp3'

const d = await fs.readFile(song)

class ID3Version {
  major = 0
  revision = 0

  constructor(d: Buffer | null = null) {
    if (d === null) return

    this.major = d.readInt8(3)
    this.revision = d.readInt8(4)
  }

  toString() {
    return `ID3v2.${this.major}.${this.revision}`
  }
}

class ID3ExtendedHeader {
  size = 0
  flags = 0
  padding = 0

  constructor(d: Buffer | null = null) {
    if (d === null) return

    this.size = d.readUint32LE()
    this.flags = d.readUint16LE()
    this.padding = d.readUint32LE()
  }

  toString() {
    return `SIZE: ${this.size}; FLAGS: ${this.flags.toString(16)}; PADDING: ${this.padding}`
  }
}

class ID3Flags {
  flags = 0
  unsynchronization = false
  extended_header: ID3ExtendedHeader | null = null
  experimental = false

  constructor(d: Buffer | null = null) {
    if (d === null) return

    this.flags = d.readUint8(5)
    this.unsynchronization = !!(this.flags >> 7 & 1)
    this.experimental = !!(this.flags >> 5 & 1)
    if (this.flags >> 6 & 1) {
      this.extended_header = new ID3ExtendedHeader(d)
    }
  }

  toString() {
    return `UNSYNC: ${this.unsynchronization}; EXPERIMENT: ${this.experimental}; EXTENDED_HEADER: ${this.extended_header != null}`
  }
}

enum RateMode {
  VBR_ABR,
  CBR,
  INVALID
}

class LameHeader {
  ident = ''
  rate_mode: RateMode = RateMode.INVALID
  flags = 0
  frame_size = 0
  stream_size = 0

  constructor(d: Buffer, ix: number) {
    const td = new TextDecoder()
    this.ident = td.decode(d.buffer.slice(ix + 0x24, 4))
    if (this.ident === 'Info') this.rate_mode = RateMode.CBR
    if (this.ident === 'Xing')  this.rate_mode = RateMode.VBR_ABR
    if (this.rate_mode === RateMode.INVALID) return

    d = d.subarray(ix + 0x24)
    this.flags = d.readUint32BE(4)
    this.frame_size = d.readUint32BE(8)
    this.stream_size = d.readUint32BE(12)
  }
}

class ID3Header {
  ident: string
  version: ID3Version = new ID3Version()
  flags: ID3Flags = new ID3Flags()
  size = 0
  // a_size = 0

  constructor(d: Buffer) {
    const td = new TextDecoder()
    this.ident = td.decode(d.buffer.slice(0, 3))
    if (this.ident !== 'ID3') {
      console.error('FILE DOES NOT HAVE ID3 TAG')
      return
    }
    this.version = new ID3Version(d)
    this.flags = new ID3Flags(d)
    this.size =
      (d.readInt8(6) & 0x7f) << 21 |
      (d.readInt8(7) & 0x7f) << 14 |
      (d.readInt8(8) & 0x7f) << 7 |
      d.readInt8(9) & 0x7f
    // this.a_size = this.size * 4
  }
}

enum MP3Version {
  MPEG_2_5,
  RESERVED,
  MPEG_2,
  MPEG_1
}

enum MP3Layer {
  RESERVED,
  LAYER_3,
  LAYER_2,
  LAYER_1,
}

const MP3BitrateMap = [
  /* 0000 */ [ -1, -1, -1, -1, -1 ],
  /* 0001 */ [ 32, 32, 32, 32, 8 ],
  /* 0010 */ [ 64, 48, 40, 48, 16 ],
  /* 0011 */ [ 96, 56, 48, 56, 24 ],
  /* 0100 */ [ 128, 64, 56, 64, 32 ],
  /* 0101 */ [ 160, 80, 64, 80, 40 ],
  /* 0110 */ [ 192, 96, 80, 96, 48 ],
  /* 0111 */ [ 224, 112, 96, 112, 56 ],
  /* 1000 */ [ 256, 128, 112, 128, 64 ],
  /* 1001 */ [ 288, 160, 128, 144, 80 ],
  /* 1010 */ [ 320, 192, 160, 160, 96 ],
  /* 1011 */ [ 352, 224, 192, 176, 112 ],
  /* 1100 */ [ 384, 256, 224, 192, 128 ],
  /* 1101 */ [ 416, 320, 256, 224, 144 ],
  /* 1110 */ [ 448, 384, 320, 256, 160 ],
  /* 1111 */ [ 0, 0, 0, 0 ],
]

class MP3Bitrate {
  rate = 0

  constructor(b = 0, v: MP3Version = MP3Version.RESERVED, l: MP3Layer = MP3Layer.RESERVED) {
    if (b > 14) {
      return
    }

    let ix = 0
    if (v === MP3Version.MPEG_1) {
      if (l === MP3Layer.LAYER_1) ix = 0
      if (l === MP3Layer.LAYER_2) ix = 1
      if (l === MP3Layer.LAYER_3) ix = 2
    }
    if (v === MP3Version.MPEG_2 || v === MP3Version.MPEG_2_5) {
      if (l === MP3Layer.LAYER_1) ix = 3
      if (l === MP3Layer.LAYER_2 || l === MP3Layer.LAYER_3) ix = 4
    }

    this.rate = MP3BitrateMap[b][ix]
  }
}

const MP3FrequencyMap = [
  /* 00 */ [ 44100, 22050, 11025 ],
  /* 01 */ [ 48000, 24000, 12000 ],
  /* 10 */ [ 32000, 16000, 8000 ],
  /* 11 */ [ -1, -1, -1, -1 ],
]

class MP3Frequency {
  freq = -1

  constructor(f = 3, v: MP3Version = MP3Version.RESERVED) {
    if (f > 3) return

    let ix = 0
    if (v === MP3Version.MPEG_1) ix = 0
    if (v === MP3Version.MPEG_2) ix = 1
    if (v === MP3Version.MPEG_2_5) ix = 2

    this.freq = MP3FrequencyMap[f][ix]
  }
}

enum MP3ChannelMode {
  STEREO,
  JOINT_STEREO,
  DUAL_CHANNEL,
  SINGLE_CHANNEL
}

const MP3SamplePerFrameMap = [
  []
]

class MP3Header {
  full = 0
  version: MP3Version = MP3Version.RESERVED
  layer: MP3Layer = MP3Layer.RESERVED
  error_protection = false
  bit_rate = 0
  frequency = 0
  padded = false
  padding = 0
  framesize = 0
  samples_per_frame = 0
  channel: MP3ChannelMode = MP3ChannelMode.STEREO

  constructor(d: Buffer, ix: number) {
    this.full = d.readUint32BE(ix)
    const left = d.readUInt16BE(ix)
    const right_a = d.readUInt8(ix + 2)
    const right_b = d.readUInt8(ix + 3)
    const sync = left >> 5 == 0x7ff
    const b_section = left & 0x1f
    this.version = b_section >> 3 as MP3Version
    this.layer = (b_section & 0b110) >> 1 as MP3Layer
    this.error_protection = !!(b_section & 0x1)
    this.bit_rate = new MP3Bitrate(right_a >> 4, this.version, this.layer).rate
    this.frequency = new MP3Frequency((right_a & 0xf) >> 2, this.version).freq
    this.padded = !!(right_a >> 1 & 0b1)
    if (this.padded) {
      if (this.layer === MP3Layer.LAYER_1) this.padding = 32
      if (this.layer === MP3Layer.LAYER_2 || this.layer === MP3Layer.LAYER_3) this.padding = 8
    }
    if (this.version === MP3Version.MPEG_1) {
      if (this.layer === MP3Layer.LAYER_1) this.samples_per_frame = 384
      if (this.layer === MP3Layer.LAYER_2 || this.layer === MP3Layer.LAYER_3) this.samples_per_frame = 1152
    }
    if (this.version === MP3Version.MPEG_2 || this.version === MP3Version.MPEG_2_5) {
      if (this.layer === MP3Layer.LAYER_1) this.samples_per_frame = 384
      if (this.layer === MP3Layer.LAYER_2) this.samples_per_frame = 1158
      if (this.layer === MP3Layer.LAYER_3) this.samples_per_frame = 576
    }
    this.framesize = Math.floor(this.bit_rate * 1000 / 8 * this.samples_per_frame / this.frequency + (this.padded ? 1 : 0) * this.padding)
    this.channel = right_b >> 6 as MP3ChannelMode
  }
}

const toStringChunks = (s: string, l: number) => {
  const x = []
  while(s.length > l) {
    x.push(s.slice(0, l))
    s = s.slice(l)
  }
  x.push(s)
  return x
}

const q = new ID3Header(d)
const qq = new MP3Header(d, q.size + 10)

console.log('\n' + song)

console.log(''.padEnd(20, '-'))
console.log('VERSION:', q.version.toString())
console.log('FLAGS:  ', q.flags.toString())
console.log('FLAGS:  ', q.flags.flags.toString(16))
console.log('EXTEND: ', q.flags.extended_header?.toString())
console.log('SIZE:   ', q.size, '0x' + q.size.toString(16), '0x' + (q.size + 10).toString(16))
// console.log('A_SIZE: ', q.a_size, '0x' + q.a_size.toString(16), '0x' + (q.a_size + 10).toString(16))

console.log(''.padEnd(20, '-'))
console.log('HEADER (HEX):    ', toStringChunks(qq.full.toString(16), 2).join('_'))
console.log('HEADER (BIN):    ', toStringChunks(qq.full.toString(2), 8).join('_'))
console.log('Version:         ', MP3Version[qq.version])
console.log('Layer:           ', MP3Layer[qq.layer], qq.layer.toString(2))
console.log('Error_Protection:', qq.error_protection)
console.log('Bit_Rate:        ', qq.bit_rate, '0x' + qq.bit_rate.toString(16))
console.log('Frequency:       ', qq.frequency, '0x' + qq.frequency.toString(16))
console.log('Padded:          ', qq.padded)
console.log('PadSize:         ', qq.padding, '0x' + qq.padding.toString(16))
console.log('SamplesPerFrame: ', qq.samples_per_frame, '0x' + qq.samples_per_frame.toString(16))
console.log('FrameSize:       ', qq.framesize, '0x' + qq.framesize.toString(16))
console.log('ChannelMode:     ', MP3ChannelMode[qq.channel])