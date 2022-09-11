import { qrep } from '@s/utils/utils'
import { DataReader } from './dataReader'

export class ID3Flags {
  unsync: boolean
  extended_header: boolean
  experimental: boolean

  constructor(i: number) {
    this.unsync = !!(i >> 7)
    this.extended_header = !!(i >> 6)
    this.experimental = !!(i >> 5)
  }

  toString() {
    return `UNSYNC: [${this.unsync}]; EXTENDED: [${this.extended_header}]; EXPERIMENTAL: [${this.experimental}]`
  }
}

export class ID3Header extends DataReader {
  ident: string
  version: { major: number, revision: number }
  flags: ID3Flags
  size: number

  constructor(b: ArrayBuffer) {
    super(b)

    this.ident = this.r.readString(3)
    this.version = {
      major: this.r.readByte(),
      revision: this.r.readByte()
    }
    this.flags = new ID3Flags(this.r.readByte())
    this.size =
      (this.r.readByte() & 0x7f) << 21 |
      (this.r.readByte() & 0x7f) << 14 |
      (this.r.readByte() & 0x7f) << 7 |
      this.r.readByte() & 0x7f
  }

  toString() {
    return  'ID3 HEADER\n'
      + '\n'.padStart(20, '-')
      + `Version: ID3v2.${this.version.major}.${this.version.revision}\n`
      + `Flags  : ${this.flags.toString()}\n`
      + `Size   : ${qrep(this.size, true)}\n`
      + '\n'.padStart(20, '-')
  }
}