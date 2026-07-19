import { memo, useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import Text from '@/components/common/Text'
import { setFontSize } from '@/core/common'
import { useI18n } from '@/lang'
import { useFontSize } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { getTextSize } from '@/utils/pixelRatio'
import SubTitle from '../../components/SubTitle'
import Select from '../../components/Select'

const LIST = [
  { size: 0.8, name: 'setting_basic_font_size_80' },
  { size: 0.9, name: 'setting_basic_font_size_90' },
  { size: 1, name: 'setting_basic_font_size_100' },
  { size: 1.1, name: 'setting_basic_font_size_110' },
  { size: 1.2, name: 'setting_basic_font_size_120' },
] as const

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const fontSize = useFontSize()
  const list = useMemo(() => LIST.map(item => ({ ...item, label: t(item.name) })), [t])
  const options = useMemo(() => list.map(item => ({ action: String(item.size), label: item.label })), [list])

  useEffect(() => {
    if (fontSize > 1.2) setFontSize(1.2)
  }, [fontSize])

  return (
    <SubTitle title={t('setting_basic_font_size')}>
      <View style={styles.preview}>
        <Text
          style={{ fontSize: getTextSize(14) * Math.min(Math.max(fontSize, 0.8), 1.2) }}
          color={theme['c-primary']}
        >
          {t('setting_basic_font_size_preview')}
        </Text>
      </View>
      <Select options={options} value={String(fontSize)} onChange={(value) => { setFontSize(Number(value)) }} />
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  preview: {
    height: 42,
    justifyContent: 'center',
  },
})
