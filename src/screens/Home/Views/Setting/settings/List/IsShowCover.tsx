import { memo } from 'react'
import { View } from 'react-native'

import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'
import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const showCover = useSettingValue('list.isShowCover')

  return (
    <View style={styles.content}>
      <CheckBoxItem
        check={showCover}
        onChange={(value) => {
          requestAnimationFrame(() => {
            updateSetting({ 'list.isShowCover': value })
          })
        }}
        label={t('setting_list_show_cover')}
      />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
