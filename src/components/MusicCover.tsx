import { memo, useEffect, useState, type ComponentProps } from 'react'

import Image from '@/components/common/Image'
import { getPicPath } from '@/core/music'

interface Props {
  musicInfo: LX.Music.MusicInfo
  style: ComponentProps<typeof Image>['style']
}

const MAX_CACHED_COVERS = 1000
const coverUrlCache = new Map<string, string>()
const coverRequestCache = new Map<string, Promise<string>>()

const getCoverKey = (musicInfo: LX.Music.MusicInfo) => `${musicInfo.source}:${musicInfo.id}`

const cacheCoverUrl = (key: string, url: string) => {
  coverUrlCache.delete(key)
  coverUrlCache.set(key, url)
  if (coverUrlCache.size <= MAX_CACHED_COVERS) return
  const oldestKey = coverUrlCache.keys().next().value
  if (oldestKey) coverUrlCache.delete(oldestKey)
}

const resolveCoverUrl = async(musicInfo: LX.Music.MusicInfo, key: string) => {
  const cachedUrl = coverUrlCache.get(key)
  if (cachedUrl) return Promise.resolve(cachedUrl)

  const pendingRequest = coverRequestCache.get(key)
  if (pendingRequest) return pendingRequest

  const request = getPicPath({ musicInfo }).then((url) => {
    if (url) cacheCoverUrl(key, url)
    return url
  }).finally(() => {
    coverRequestCache.delete(key)
  })
  coverRequestCache.set(key, request)
  return request
}

const MusicCover = ({ musicInfo, style }: Props) => {
  const coverKey = getCoverKey(musicInfo)
  const [url, setUrl] = useState(() => musicInfo.meta.picUrl ?? coverUrlCache.get(coverKey))

  useEffect(() => {
    let active = true
    const sourceUrl = musicInfo.meta.picUrl

    if (sourceUrl) {
      cacheCoverUrl(coverKey, sourceUrl)
      setUrl(sourceUrl)
      return () => { active = false }
    }

    const cachedUrl = coverUrlCache.get(coverKey)
    if (cachedUrl) {
      musicInfo.meta.picUrl = cachedUrl
      setUrl(cachedUrl)
      return () => { active = false }
    }

    setUrl(undefined)
    void resolveCoverUrl(musicInfo, coverKey).then((picUrl) => {
      if (picUrl) {
        musicInfo.meta.picUrl = picUrl
        if (active) setUrl(picUrl)
      }
    }).catch(() => {})

    return () => {
      active = false
    }
  }, [coverKey, musicInfo, musicInfo.meta.picUrl])

  return <Image url={url} style={style} />
}

export default memo(MusicCover)
