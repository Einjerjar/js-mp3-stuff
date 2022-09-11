import { qrep } from '@s/utils/utils'

export enum MPEG_VERSION {
  VERSION_2_5,
  RESERVED,
  VERSION_2,
  VERSION_1
}

export enum MPEG_LAYER {
  RESERVED,
  LAYER_3,
  LAYER_2,
  LAYER_1
}

enum MP3ChannelMode {
  STEREO,
  JOINT_STEREO,
  DUAL_CHANNEL,
  SINGLE_CHANNEL
}

enum MP3Emphasis {
  NONE,
  MS_50_15,
  RESERVED,
  CCIT_J_17
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

const MP3FrequencyMap = [
  /* 00 */ [ 44100, 22050, 11025 ],
  /* 01 */ [ 48000, 24000, 12000 ],
  /* 10 */ [ 32000, 16000, 8000 ],
  /* 11 */ [ -1, -1, -1, -1 ],
]

export class MP3Header{
  mpeg_version = MPEG_VERSION.RESERVED
  layer = MPEG_LAYER.RESERVED
  error_protection = false
  bit_ref = 0
  bit_rate = 0
  sampling_rate = 0
  freq_ref = 0
  frequency = 0
  padded = false
  padding = 0
  channel: MP3ChannelMode = MP3ChannelMode.STEREO
  mode_extension = 0
  copyrighted = false
  original = false
  emphasis = MP3Emphasis.NONE
  samples_per_frame = 0
  frame_size = 0
  frame_length = 0

  constructor(left: number, right: number) {
    this.mpeg_version       = left >> 3 & 0b11 as MPEG_VERSION
    this.layer              = left >> 1 & 0b11 as MPEG_LAYER
    this.error_protection   = !!(left & 0b1)
    this.bit_ref            = right >> 12
    this.bit_rate           = this.getBitRate() * 1000
    this.freq_ref           = right >> 10 & 0b11
    this.frequency          = this.getFrequency()
    this.padded             = !!(right >> 9 & 0b1)
    this.padding            = this.getPadding()
    this.channel            = right >> 6 & 0b11 as MP3ChannelMode
    this.mode_extension     = right >> 4 & 0b11
    this.copyrighted        = !!(right >> 3 & 0b1)
    this.original           = !!(right >> 2 & 0b1)
    this.emphasis           = right & 0b11 as MP3Emphasis
    this.samples_per_frame  = this.getSamplesPerFrame()
    this.frame_size         = this.getFrameSize()
    this.frame_length       = this.getFrameLength()
  }

  getFrameLength() {
    const b = this.bit_rate
    const s = this.frequency
    const p = this.padding

    return Math.round(144 * b / s + p)
  }

  getFrameSize() {
    const b = this.bit_rate
    const s = this.samples_per_frame
    const f = this.frequency
    const p = this.padded
    const d = this.padding
    return Math.ceil(b * 1000 / 8 * s / f + (p ? 1 : 0) * d)
  }

  getSamplesPerFrame() {
    const v = this.mpeg_version
    const l = this.layer

    let x = 384

    if (v === MPEG_VERSION.VERSION_1) {
      if (l === MPEG_LAYER.LAYER_2 || l === MPEG_LAYER.LAYER_3) x = 1152
    }
    if (v === MPEG_VERSION.VERSION_2 || v === MPEG_VERSION.VERSION_2_5) {
      if (l === MPEG_LAYER.LAYER_2) x = 1158
      if (l === MPEG_LAYER.LAYER_3) x = 576
    }

    return x
  }

  getPadding() {
    const v = this.mpeg_version
    const p = this.padded
    if (!p) return 0

    if (v === MPEG_VERSION.VERSION_1) return 32
    return 8
  }

  getFrequency() {
    const v = this.mpeg_version
    const f = this.freq_ref
    let ix = 0
    if (v === MPEG_VERSION.VERSION_2) ix = 1
    if (v === MPEG_VERSION.VERSION_2_5) ix = 2

    return MP3FrequencyMap[f][ix]
  }

  getBitRate() {
    const v = this.mpeg_version
    const l = this.layer
    const b = this.bit_ref
    let ix = 0b1111

    if (v === MPEG_VERSION.VERSION_1) {
      if (l === MPEG_LAYER.LAYER_1) ix = 0
      if (l === MPEG_LAYER.LAYER_2) ix = 1
      if (l === MPEG_LAYER.LAYER_3) ix = 2
    }

    if (v === MPEG_VERSION.VERSION_2 || v === MPEG_VERSION.VERSION_2_5) {
      if (l === MPEG_LAYER.LAYER_1) ix = 3
      if (l === MPEG_LAYER.LAYER_2 || l === MPEG_LAYER.LAYER_3) ix = 4
    }

    return MP3BitrateMap[b][ix]
  }

  toString() {
    return 'MP3 HEADER\n'
      + '\n'.padStart(20, '-')
      + `MPEG version       : ${MPEG_VERSION[this.mpeg_version]}\n`
      + `MPEG layer         : ${MPEG_LAYER[this.layer]}\n`
      + `Error Protection   : ${this.error_protection}\n`
      + `Bit Rate           : ${this.bit_rate}\n`
      + `Frequency          : ${this.frequency}\n`
      + `Padded             : ${this.padded}\n`
      + `Padding            : ${this.padding}\n`
      + `Channel Mode       : ${MP3ChannelMode[this.channel]}\n`
      + `Mode Extension     : ${qrep(this.mode_extension, false, true)}\n`
      + `Copyrighted        : ${this.copyrighted}\n`
      + `Original           : ${this.original}\n`
      + `Samples per frame  : ${qrep(this.samples_per_frame, true)}\n`
      + `Frame size         : ${qrep(this.frame_size, true)}\n`
      + `Frame length       : ${qrep(this.frame_length, true)}\n`
      + '\n'.padStart(20, '-')
  }
}