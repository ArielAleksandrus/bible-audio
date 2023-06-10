export interface SoundEl {
  key: string,
  asset: string,
  name: string,
  type: string,
  status?: 'playing'|'paused'|'finished',
  extra?: {
    artist: string,
    album: string
  },
  mediaObj?: any
}