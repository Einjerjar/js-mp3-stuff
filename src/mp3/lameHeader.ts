import { qrep } from '@s/utils/utils'
import { DataReader } from './dataReader'

export class LameFlags {
  l: number
  r: number
  number_of_frames = false
  size_in_bytes = false
  toc_data = false
  vbr_scale = false

  constructor(l: number, r: number) {
    this.number_of_frames = !!(r & 0b1)
    this.size_in_bytes    = !!(r & 0b10)
    this.toc_data         = !!(r & 0b100)
    this.vbr_scale        = !!(r & 0b1000)

    this.l = l
    this.r = r
  }

  toString() {
    return `0x${this.l.toString(16)}${this.r.toString(16)}; `
      + `NOF: ${this.number_of_frames}; `
      + `SIB: ${this.size_in_bytes}; `
      + `TOC: ${this.toc_data}; `
      + `VBR: ${this.vbr_scale}; `
  }
}

export class LameHeader extends DataReader {
  flags: LameFlags
  frame_size = 0
  stream_size = 0
  toc_entries = ''
  vbr_scale = 0
  lame_version = ''
  revision = 0
  vbr_type = 0
  lowpass_frequency = 0
  peak_signal = 0
  radio_replay_pad = 0
  radio_replay_set_name = 0
  radio_replay_originator_code = 0
  radio_replay_gain = 0
  audiophile_replay_gain = 0
  flag_ath_type = 0
  flag_expn_psy_tune = 0
  flag_safe_joint = 0
  flag_no_gap_more = 0
  flag_no_gap_previous = 0
  average_bit_rate = 0
  delay_padding_delay_high = 0
  delay_padding_delay_low = 0
  delay_padding_padding_high = 0
  delay_padding_padding_low = 0
  noise_shaping = 0
  stereo_mode = 0
  non_optimal = 0
  source_frequency = 0
  unused = 0
  preset = 0
  music_length = 0
  music_crc = 0
  crc = 0

  constructor(b: ArrayBuffer) {
    super(b)
    this.r.seek(4)
    this.flags = new LameFlags(this.r.readWord(), this.r.readWord())
    if (this.flags.number_of_frames)  this.frame_size   = this.r.readDWord()
    if (this.flags.size_in_bytes)     this.stream_size  = this.r.readDWord()
    if (this.flags.toc_data)          this.toc_entries  = this.r.readString(100)
    if (this.flags.vbr_scale)         this.vbr_scale    = this.r.readDWord()

    let dummy = 0
    this.lame_version                 = this.r.readString(9)

    dummy                             = this.r.readByte()
    this.revision                     = dummy >> 4
    this.vbr_type                     = dummy & 0xf
    this.lowpass_frequency            = this.r.readByte()
    this.peak_signal                  = this.r.readDWord()

    dummy                             = this.r.readWord()
    this.radio_replay_pad             = dummy >> 14
    this.radio_replay_set_name        = dummy >> 12 & 0xf
    this.radio_replay_originator_code = dummy >> 10 & 0xf
    this.radio_replay_gain            = dummy & 0x3f_f
    this.audiophile_replay_gain       = this.r.readWord()

    dummy                             = this.r.readByte()
    this.flag_ath_type                = dummy >> 4
    this.flag_expn_psy_tune           = dummy >> 3 & 0b1
    this.flag_safe_joint              = dummy >> 2 & 0b1
    this.flag_no_gap_more             = dummy >> 1 & 0b1
    this.flag_no_gap_previous         = dummy & 0b1
    this.average_bit_rate             = this.r.readByte()
    this.delay_padding_delay_high     = this.r.readByte()

    dummy                             = this.r.readByte()
    this.delay_padding_delay_low      = dummy >> 4
    this.delay_padding_padding_high   = dummy & 0xf
    this.delay_padding_padding_low    = this.r.readByte()

    dummy                             = this.r.readByte()
    this.noise_shaping                = dummy >> 6
    this.stereo_mode                  = dummy >> 3 & 0b111
    this.non_optimal                  = dummy >> 2 & 0b1
    this.source_frequency             = dummy & 0b11
    this.unused                       = this.r.readByte()
    this.preset                       = this.r.readWord()
    this.music_length                 = this.r.readDWord()
    this.music_crc                    = this.r.readWord()
    this.crc                          = this.r.readWord()
  }

  toString() {
    return  'LAME HEADER\n'
      + '\n'.padStart(20, '-')
      + `Flags                        : ${this.flags.toString()}\n`
      + `Frame Size                   : ${qrep(this.frame_size, true)}\n`
      + `Stream Size                  : ${qrep(this.stream_size, true)}\n`
      + 'Toc Entries                  : [REDACTED]\n'
      + `Vbr Scale                    : ${this.vbr_scale}\n`
      + `Lame Version                 : ${this.lame_version}\n`
      + `Revision                     : ${this.revision}\n`
      + `Vbr Type                     : ${this.vbr_type}\n`
      + `Lowpass Frequency            : ${this.lowpass_frequency}\n`
      + `Peak Signal                  : ${this.peak_signal}\n`
      + `Radio Replay Pad             : ${this.radio_replay_pad}\n`
      + `Radio Replay Set Name        : ${this.radio_replay_set_name}\n`
      + `Radio Replay Originator Code : ${this.radio_replay_originator_code}\n`
      + `Radio Replay Gain            : ${this.radio_replay_gain}\n`
      + `Audiophile Replay Gain       : ${this.audiophile_replay_gain}\n`
      + `Flag Ath Type                : ${this.flag_ath_type}\n`
      + `Flag Expn Psy Tune           : ${this.flag_expn_psy_tune}\n`
      + `Flag Safe Joint              : ${this.flag_safe_joint}\n`
      + `Flag No Gap More             : ${this.flag_no_gap_more}\n`
      + `Flag No Gap Previous         : ${this.flag_no_gap_previous}\n`
      + `Average Bit Rate             : ${this.average_bit_rate}\n`
      + `Delay Padding Delay High     : ${this.delay_padding_delay_high}\n`
      + `Delay Padding Delay Low      : ${this.delay_padding_delay_low}\n`
      + `Delay Padding Padding High   : ${this.delay_padding_padding_high}\n`
      + `Delay Padding Padding Low    : ${this.delay_padding_padding_low}\n`
      + `Noise Shaping                : ${this.noise_shaping}\n`
      + `Stereo Mode                  : ${this.stereo_mode}\n`
      + `Non Optimal                  : ${this.non_optimal}\n`
      + `Source Frequency             : ${this.source_frequency}\n`
      + `Unused                       : ${this.unused}\n`
      + `Preset                       : ${this.preset}\n`
      + `Music Length                 : ${this.music_length}\n`
      + `Music Crc                    : ${qrep(this.music_crc, true, false, true)}\n`
      + `Crc                          : ${qrep(this.crc, true, false, true)}\n`
      + '\n'.padStart(20, '-')
  }
}