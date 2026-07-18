import { httpFetch } from '../../request'
import { formatPlayTime, sizeFormate } from '../../index'
// https://github.com/Binaryify/NeteaseCloudMusicApi/blob/master/module/song_detail.js

export default {
  getSinger(singers) {
    let arr = []
    singers?.forEach(singer => {
      arr.push(singer.name)
    })
    return arr.join('、')
  },
  filterList({ songs, privileges = [] }) {
    // console.log(songs, privileges)
    const list = []
    songs.forEach((item, index) => {
      const types = []
      const _types = {}
      let size
      let privilege = privileges[index]
      if (privilege?.id !== item.id) privilege = privileges.find(p => p.id === item.id)

      const highQuality = item.h ?? item.hMusic
      const lowQuality = item.l ?? item.lMusic ?? item.bMusic
      const losslessQuality = item.sq ?? item.sqMusic
      const hiresQuality = item.hr
      const maxBrLevel = privilege?.maxBrLevel
      const maxBitrate = privilege?.maxbr

      if (maxBrLevel == 'hires' || hiresQuality) {
        size = hiresQuality ? sizeFormate(hiresQuality.size) : null
        types.push({ type: 'flac24bit', size })
        _types.flac24bit = {
          size,
        }
      }
      switch (maxBitrate) {
        case 999000:
          size = losslessQuality ? sizeFormate(losslessQuality.size) : null
          types.push({ type: 'flac', size })
          _types.flac = {
            size,
          }
        case 320000:
          size = highQuality ? sizeFormate(highQuality.size) : null
          types.push({ type: '320k', size })
          _types['320k'] = {
            size,
          }
        case 192000:
        case 128000:
          size = lowQuality ? sizeFormate(lowQuality.size) : null
          types.push({ type: '128k', size })
          _types['128k'] = {
            size,
          }
      }

      if (!privilege) {
        if (losslessQuality) {
          size = sizeFormate(losslessQuality.size)
          types.push({ type: 'flac', size })
          _types.flac = { size }
        }
        if (highQuality) {
          size = sizeFormate(highQuality.size)
          types.push({ type: '320k', size })
          _types['320k'] = { size }
        }
        if (lowQuality) {
          size = sizeFormate(lowQuality.size)
          types.push({ type: '128k', size })
          _types['128k'] = { size }
        }
      }

      types.reverse()

      if (item.pc) {
        list.push({
          singer: item.pc.ar ?? '',
          name: item.pc.sn ?? '',
          albumName: item.pc.alb ?? '',
          albumId: item.al?.id,
          source: 'wy',
          interval: formatPlayTime(item.dt / 1000),
          songmid: item.id,
          img: item.al?.picUrl ?? '',
          lrc: null,
          otherSource: null,
          types,
          _types,
          typeUrl: {},
        })
      } else {
        const artists = item.ar ?? item.artists
        const album = item.al ?? item.album
        list.push({
          singer: this.getSinger(artists),
          name: item.name ?? '',
          albumName: album?.name,
          albumId: album?.id,
          source: 'wy',
          interval: formatPlayTime((item.dt ?? item.duration) / 1000),
          songmid: item.id,
          img: album?.picUrl,
          lrc: null,
          otherSource: null,
          types,
          _types,
          typeUrl: {},
        })
      }
    })
    // console.log(list)
    return list
  },
  async getListPart(ids, retryNum = 0) {
    if (retryNum > 2) return Promise.reject(new Error('try max num'))

    const requestObj = httpFetch('https://music.163.com/api/song/detail/', {
      method: 'post',
      headers: {
        'User-Agent': 'NeteaseMusic/9.1.40 (Linux; Android 14)',
        Referer: 'https://music.163.com/',
      },
      form: { ids: `[${ids.join(',')}]` },
    })
    const { body, statusCode } = await requestObj.promise
    if (statusCode != 200 || body.code !== 200 || !Array.isArray(body.songs)) return this.getListPart(ids, ++retryNum)
    return this.filterList(body)
  },
  async getList(ids = []) {
    if (!ids.length) return { source: 'wy', list: [] }

    // The legacy song detail endpoint silently caps each response at 100 songs.
    // Fetching in batches keeps full playlists and charts intact.
    const list = []
    for (let index = 0; index < ids.length; index += 100) {
      list.push(...await this.getListPart(ids.slice(index, index + 100)))
    }
    return { source: 'wy', list }
  },
}
