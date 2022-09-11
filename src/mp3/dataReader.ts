import { ByteReader } from '@s/byteReader'

export class DataReader {
  r: ByteReader

  constructor(b: ArrayBuffer) {
    this.r = new ByteReader(b)
  }
}