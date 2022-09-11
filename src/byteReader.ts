export class ByteReader {
  c = 0
  b: ArrayBuffer
  dv: DataView
  td: TextDecoder = new TextDecoder()

  constructor(b: ArrayBuffer) {
    this.b = b
    this.dv = new DataView(b, 0)
  }

  readString(length = 1, seek = true) {
    if (this.c + length > this.length()) {
      throw new Error('Insufficient bytes for reading')
    }
    const v = this.td.decode(this.b.slice(this.c, this.c + length))
    if (seek) this.seek(length)
    return v
  }

  readByteArray(length = 1, seek = true) {
    if (this.c + length > this.length()) {
      throw new Error('Insufficient bytes for reading')
    }
    const v = this.b.slice(this.c, this.c + length)
    if (seek) this.seek(length)
    return v
  }

  readByte(seek = true) {
    if (this.c + 1 > this.length()) {
      throw new Error('Insufficient bytes for reading')
    }
    const v = this.dv.getUint8(this.c)
    if (seek) this.seek(1)
    return v
  }

  readWord(litteEndian = false, seek = true) {
    if (this.c + 2 > this.length()) {
      throw new Error('Insufficient bytes for reading')
    }
    const v = this.dv.getUint16(this.c, litteEndian)
    if (seek) this.seek(2)
    return v
  }

  readDWord(litteEndian = false, seek = true) {
    if (this.c + 4 > this.length()) {
      throw new Error('Insufficient bytes for reading')
    }
    const v = this.dv.getUint32(this.c, litteEndian)
    if (seek) this.seek(4)
    return v
  }

  seek(c: number) {
    c = this.c + c
    c = Math.min(Math.max(0, c), this.length())
    this.c = c
  }

  r_seek(c: number)  {
    if (c < 0 || c > this.length()) c = this.length()
    this.c = c
  }

  length() {
    return this.b.byteLength
  }
}