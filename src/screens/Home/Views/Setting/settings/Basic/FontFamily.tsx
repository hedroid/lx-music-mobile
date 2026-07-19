import { memo, useRef } from 'react'
import { StyleSheet, View } from 'react-native'

import ChoosePath, { type ChoosePathType } from '@/components/common/ChoosePath'
import Text from '@/components/common/Text'
import { installCustomFont, resetCustomFont, setSystemFont } from '@/core/font'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { unlink } from '@/utils/fs'
import { toast } from '@/utils/tools'
import Button from '../../components/Button'
import Select from '../../components/Select'
import SubTitle from '../../components/SubTitle'

export default memo(() => {
  const t = useI18n()
  const fontName = useSettingValue('common.customFontName')
  const fontFamily = useSettingValue('common.fontFamily')
  const choosePathRef = useRef<ChoosePathType>(null)
  const systemFonts = [
    { action: '', label: t('setting_basic_font_family_system_default') },
    { action: 'sans-serif', label: t('setting_basic_font_family_sans') },
    { action: 'serif', label: t('setting_basic_font_family_serif') },
    { action: 'monospace', label: t('setting_basic_font_family_monospace') },
    { action: 'cursive', label: t('setting_basic_font_family_cursive') },
    { action: 'sans-serif-condensed', label: t('setting_basic_font_family_condensed') },
  ]
  const isCustomFont = fontFamily == 'LXCustomFont'
  const currentName = isCustomFont
    ? fontName
    : systemFonts.find(item => item.action == fontFamily)?.label ?? t('setting_basic_font_family_system')

  const handleChoose = () => {
    choosePathRef.current?.show({
      title: t('setting_basic_font_family_choose'),
      filter: ['ttf', 'otf'],
    })
  }

  const handleSelected = (path: string) => {
    const originalName = path.split('/').pop() ?? 'custom-font.ttf'
    void installCustomFont(path, originalName).then(() => {
      toast(t('setting_basic_font_family_applied'), 'long')
    }).catch(() => {
      toast(t('setting_basic_font_family_invalid'), 'long')
    }).finally(() => {
      void unlink(path)
    })
  }

  const handleReset = () => {
    void resetCustomFont().then(() => {
      toast(t('setting_basic_font_family_reset_tip'), 'long')
    })
  }

  const handleSystemFont = (font: string) => {
    void setSystemFont(font).then(() => {
      toast(t('setting_basic_font_family_applied'), 'long')
    })
  }

  return (
    <SubTitle title={t('setting_basic_font_family')}>
      <Text style={styles.preview}>{t('setting_basic_font_family_preview')}</Text>
      <Select
        options={systemFonts}
        value={isCustomFont ? null : fontFamily}
        label={currentName}
        onChange={handleSystemFont}
      />
      <View style={styles.buttons}>
        <Button onPress={handleChoose}>{t('setting_basic_font_family_choose')}</Button>
        {fontFamily ? <Button onPress={handleReset}>{t('setting_basic_font_family_reset')}</Button> : null}
      </View>
      <ChoosePath ref={choosePathRef} onConfirm={handleSelected} />
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  preview: {
    marginTop: 4,
    marginBottom: 4,
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
})
