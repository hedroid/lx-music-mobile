import { memo } from 'react'
import { View } from 'react-native'
import { updateSetting } from '@/core/common'
import { syncNowPlayingLyric } from '@/core/player/nowPlayingLyric'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'
import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const enabled = useSettingValue('player.isShowMusicCapsuleLyric')
  const handleChange = (isEnabled: boolean) => {
    updateSetting({ 'player.isShowMusicCapsuleLyric': isEnabled })
    void syncNowPlayingLyric()
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={enabled} onChange={handleChange} label={t('setting_play_show_music_capsule_lyric')} />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
