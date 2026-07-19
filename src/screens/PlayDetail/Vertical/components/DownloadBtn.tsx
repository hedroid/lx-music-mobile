import Btn from './Btn'
import { startDownload } from '@/core/download'
import { usePlayMusicInfo } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'

export default () => {
  const theme = useTheme()
  const playInfo = usePlayMusicInfo()
  const item = playInfo.musicInfo
  const musicInfo = item && !('progress' in item) && item.source != 'local' ? item : null
  return <Btn materialIcon="download" color={musicInfo ? undefined : theme['c-250']} onPress={() => { if (musicInfo) void startDownload(musicInfo) }} />
}
