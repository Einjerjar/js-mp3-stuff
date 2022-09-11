export const toStringChunks = (s: string, l: number) => {
  const x = []
  while(s.length > l) {
    x.push(s.slice(0, l))
    s = s.slice(l)
  }
  x.push(s)
  return x
}

export const hex = (i: number) => '0x' + i.toString(16)
export const bin = (i: number) => '0b' + i.toString(2)
export const hex_u = (i: number) => '0x' + toStringChunks(i.toString(16), 2).join('_')
export const bin_u = (i: number) => '0b' + toStringChunks(i.toString(2), 8).join('_')

export const qrep = (i: number, _hex=false, _bin=false, segment=false) => {
  const h = _hex ? ', ' + (segment ? hex_u(i) : hex(i)) : ''
  const b = _bin ? ', ' + (segment ? bin_u(i) : bin(i)) : ''

  return `${i.toString()}${h}${b}`
}