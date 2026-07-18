import Btn from './Btn'
import { usePlayMusicInfo } from '@/store/player/hook'
import settingState from '@/store/setting/state'
import { shareMusic } from '@/utils/tools'

export default () => {
  const playInfo = usePlayMusicInfo()
  const handleShare = () => {
    const item = playInfo.musicInfo
    if (!item) return
    const musicInfo = 'progress' in item ? item.metadata.musicInfo : item
    shareMusic(settingState.setting['common.shareType'], settingState.setting['download.fileName'], musicInfo)
  }
  return <Btn icon="share" onPress={handleShare} />
}
