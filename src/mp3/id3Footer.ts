import { DataReader } from './dataReader'

enum V1_GENRES {
  /* 00 */ BLUES,
  /* 01 */ CLASSIC_ROCK,
  /* 02 */ COUNTRY,
  /* 03 */ DANCE,
  /* 04 */ DISCO,
  /* 05 */ FUNK,
  /* 06 */ GRUNGE,
  /* 07 */ HIP_HOP,
  /* 08 */ JAZZ,
  /* 09 */ METAL,
  /* 10 */ NEW_AGE,
  /* 11 */ OLDIES,
  /* 12 */ OTHER,
  /* 13 */ POP,
  /* 14 */ RHYTHM_AND_BLUES,
  /* 15 */ RAP,
  /* 16 */ REGGAE,
  /* 17 */ ROCK,
  /* 18 */ TECHNO,
  /* 19 */ INDUSTRIAL,

  /* 20 */ ALTERNATIVE,
  /* 21 */ SKA,
  /* 22 */ DEATH_METAL,
  /* 23 */ PRANKS,
  /* 24 */ SOUNDTRACK,
  /* 25 */ EURO_TECHNO,
  /* 26 */ AMBIENT,
  /* 27 */ TRIP_HOP,
  /* 28 */ VOCAL,
  /* 29 */ JAZZ_N_FUNK,
  /* 30 */ FUSION,
  /* 31 */ TRANCE,
  /* 32 */ CLASSICAL,
  /* 33 */ INSTRUMENTAL,
  /* 34 */ ACID,
  /* 35 */ HOUSE,
  /* 36 */ GAME,
  /* 37 */ SOUND_CLIP,
  /* 38 */ GOSPEL,
  /* 39 */ NOISE,

  /* 40 */ ALTERNATIVE_ROCK,
  /* 41 */ BASS,
  /* 42 */ SOUL,
  /* 43 */ PUNK,
  /* 44 */ SPACE,
  /* 45 */ MEDITATIVE,
  /* 46 */ INSTRUMENTAL_POP,
  /* 47 */ INSTRUMENTAL_ROCK,
  /* 48 */ ETHNIC,
  /* 49 */ GOTHIC,
  /* 50 */ DARKWAVE,
  /* 51 */ TECHNO_INDUSTRIAL,
  /* 52 */ ELECTRONIC,
  /* 53 */ POP_FOLK,
  /* 54 */ EURODANCE,
  /* 55 */ DREAM,
  /* 56 */ SOUTHERN_ROCK,
  /* 57 */ COMEDY,
  /* 58 */ CULT,
  /* 59 */ GANGSTA,

  /* 60 */ TOP_40,
  /* 61 */ CHRISTIAN_RAP,
  /* 62 */ POP_FUNK,
  /* 63 */ JUNGLE_MUSIC,
  /* 64 */ NATIVE_US,
  /* 65 */ CABARET,
  /* 66 */ NEW_WAVE,
  /* 67 */ PSYCHEDELIC,
  /* 68 */ RAVE,
  /* 69 */ SHOWTUNES,
  /* 70 */ TRAILER,
  /* 71 */ LO_FI,
  /* 72 */ TRIBAL,
  /* 73 */ ACID_PUNK,
  /* 74 */ ACID_JAZZ,
  /* 75 */ POLKA,
  /* 76 */ RETRO,
  /* 77 */ MUSICAL,
  /* 78 */ ROCK_N_ROLL,
  /* 79 */ HARD_ROCK,

  /* 255 */ UNSET = 255
}

export class ID3Footer extends DataReader {
  title: string
  artist: string
  album: string
  year: number
  comment: string
  zb = false
  track = -1
  genre: V1_GENRES = V1_GENRES.OTHER

  constructor(b: ArrayBuffer) {
    super(b)
    this.r.seek(3)
    this.title = this.r.readString(30)
    this.artist = this.r.readString(30)
    this.album = this.r.readString(30)
    this.year =
      this.r.readByte() * 1000 +
      this.r.readByte() * 100 +
      this.r.readByte() * 10 +
      this.r.readByte()
    this.r.seek(28)
    this.zb = !this.r.readByte()
    this.r.seek(-29)
    if (this.zb) {
      this.comment = this.r.readString(28)
      this.r.seek(1)
      this.track = this.r.readByte()
    } else {
      this.comment = this.r.readString(30)
    }
    this.genre = this.r.readByte() as V1_GENRES
  }

  toString() {
    return 'ID3v1 FOOTER\n'
    + '\n'.padStart(20, '-')
    + `Title  : ${this.title}\n`
    + `Artist : ${this.artist}\n`
    + `Album  : ${this.album}\n`
    + `Year   : ${this.year}\n`
    + `Track  : ${this.track}\n`
    + (this.genre !== V1_GENRES.UNSET ? `Genre  : ${this.year}\n` : '')
    + '\n'.padStart(20, '-')
  }
}