import { init as initLyricPlayer, toggleTranslation, toggleRoma, play, pause, stop, setLyric, setPlaybackRate } from '@/core/lyric'
import { updateSetting } from '@/core/common'
import {
  hideDesktopLyric,
  onDesktopLyricAction,
  onDesktopLyricPositionChange,
  onLyricLinePlay,
  showDesktopLyric,
  showRemoteLyric,
} from '@/core/desktopLyric'
import playerState from '@/store/player/state'
import { updateNowPlayingLyric } from '@/core/player/nowPlayingLyric'
import { playNext, playPrev, togglePlay } from '@/core/player/player'

export default async(setting: LX.AppSetting) => {
  await initLyricPlayer()
  await Promise.all([
    setPlaybackRate(setting['player.playbackRate']),
    toggleTranslation(setting['player.isShowLyricTranslation']),
    toggleRoma(setting['player.isShowLyricRoma']),
  ])

  if (setting['desktopLyric.enable']) {
    showDesktopLyric().catch(() => {
      updateSetting({ 'desktopLyric.enable': false })
    })
  }
  if (setting['player.isShowBluetoothLyric'] || setting['player.isShowMusicCapsuleLyric']) {
    showRemoteLyric(true).catch(() => {
      updateSetting({ 'player.isShowBluetoothLyric': false })
      updateSetting({ 'player.isShowMusicCapsuleLyric': false })
    })
  }
  onDesktopLyricPositionChange(position => {
    updateSetting({
      'desktopLyric.position.x': position.x,
      'desktopLyric.position.y': position.y,
    })
  })
  onDesktopLyricAction(({ action, value }) => {
    switch (action) {
      case 'close':
        updateSetting({ 'desktopLyric.enable': false })
        void hideDesktopLyric()
        break
      case 'lock':
        updateSetting({ 'desktopLyric.isLock': value == null ? true : value == 'true' })
        break
      case 'previous':
        void playPrev()
        break
      case 'togglePlay':
        togglePlay()
        break
      case 'next':
        void playNext()
        break
      case 'color':
        if (value) updateSetting({ 'desktopLyric.style.lyricPlayedColor': value })
        break
      case 'fontSize': {
        const fontSize = Number(value)
        if (Number.isFinite(fontSize)) updateSetting({ 'desktopLyric.style.fontSize': fontSize })
        break
      }
    }
  })
  onLyricLinePlay(({ text, extendedLyrics }) => {
    if (!text && !playerState.isPlay) {
      void updateNowPlayingLyric()
    } else {
      void updateNowPlayingLyric(text)
    }
  })


  global.app_event.on('play', play)
  global.app_event.on('pause', pause)
  global.app_event.on('stop', stop)
  global.app_event.on('error', pause)
  global.app_event.on('musicToggled', stop)
  global.app_event.on('lyricUpdated', setLyric)
}
