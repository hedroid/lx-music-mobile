import { showRemoteLyric } from '@/core/desktopLyric'
import { updateNowPlayingTitles } from '@/plugins/player/utils'
import { setLastLyric } from '@/core/player/playInfo'
import playerState from '@/store/player/state'
import settingState from '@/store/setting/state'

export const isNowPlayingLyricEnabled = () => {
  const setting = settingState.setting
  return setting['player.isShowBluetoothLyric'] || setting['player.isShowMusicCapsuleLyric']
}

export const updateNowPlayingLyric = async(lyric?: string) => {
  if (lyric != null && !isNowPlayingLyricEnabled()) return

  setLastLyric(lyric)
  if (lyric == null) {
    return updateNowPlayingTitles({
      title: playerState.musicInfo.name,
      artist: playerState.musicInfo.singer ?? '',
      album: playerState.musicInfo.album ?? '',
    })
  }

  return updateNowPlayingTitles({
    title: lyric,
    artist: `${playerState.musicInfo.name}${playerState.musicInfo.singer ? ` - ${playerState.musicInfo.singer}` : ''}`,
    album: playerState.musicInfo.album ?? '',
  })
}

export const syncNowPlayingLyric = async() => {
  const enabled = isNowPlayingLyricEnabled()
  await showRemoteLyric(enabled)
  if (!enabled) await updateNowPlayingLyric()
}
