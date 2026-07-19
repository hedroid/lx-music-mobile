import { memo, useMemo } from 'react'

import SubTitle from '../../components/SubTitle'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { TRY_QUALITYS_LIST } from '@/core/music/utils'
import Select from '../../components/Select'

export default memo(() => {
  const t = useI18n()
  const playQualityList = useMemo(() => {
    return [...TRY_QUALITYS_LIST, '128k'].reverse() as LX.Quality[]
  }, [])
  const playQuality = useSettingValue('player.playQuality')
  const options = useMemo(() => playQualityList.map(quality => {
    let label: string
    switch (quality) {
      case '128k': label = t('quality_option_128k'); break
      case '192k': label = t('quality_option_192k'); break
      case '320k': label = t('quality_option_320k'); break
      case 'flac24bit': label = t('quality_option_flac24bit'); break
      default: label = t('quality_option_flac'); break
    }
    return { action: quality, label }
  }), [playQualityList, t])
  const displayPlayQuality = playQuality == 'ape' || playQuality == 'wav' ? 'flac' : playQuality

  return (
    <SubTitle title={t('setting_play_play_quality')}>
      <Select
        options={options}
        value={displayPlayQuality}
        onChange={(quality) => { updateSetting({ 'player.playQuality': quality }) }}
      />
    </SubTitle>
  )
})

// export default memo(() => {
//   const t = useI18n()
//   const isPlayHighQuality = useSettingValue('player.isPlayHighQuality')
//   const setPlayHighQuality = (isPlayHighQuality: boolean) => {
//     updateSetting({ 'player.isPlayHighQuality': isPlayHighQuality })
//   }

//   return (
//     <View style={styles.content}>
//       <CheckBoxItem check={isPlayHighQuality} onChange={setPlayHighQuality} label={t('setting_play_quality')} />
//     </View>
//   )
// })


// const styles = createStyle({
//   content: {
//     marginTop: 5,
//   },
// })
