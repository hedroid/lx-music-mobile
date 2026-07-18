import { updateSetting } from '@/core/common'
import { setDesktopLyricColor } from '@/core/desktopLyric'
import { useI18n } from '@/lang'
import { memo, useMemo } from 'react'
import { StyleSheet, View, TouchableOpacity } from 'react-native'

import { IconMaterialCommunityIcons } from '@/components/common/Icon'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import SubTitle from '../../components/SubTitle'

const themes = [
  ['#08e664', 'rgba(0,0,0,0.6)'],
  ['#fffa12', 'rgba(0,0,0,0.6)'],
  ['#019ce4', 'rgba(0,0,0,0.6)'],
  ['#ff1222', 'rgba(0,0,0,0.6)'],
  ['#ef6976', 'rgba(0,0,0,0.6)'],
  ['#c851d4', 'rgba(0,0,0,0.6)'],
  ['#ffa600', 'rgba(0,0,0,0.6)'],
  ['#000000', '#ffffff'],
  ['#ffffff', 'rgba(0,0,0,0.6)'],
] as const
type Theme = typeof themes[number]

const parseColor = (color: string): [number, number, number] | null => {
  const hex = color.match(/^#([\da-f]{6})$/i)?.[1]
  if (hex) return [Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.slice(2, 4), 16), Number.parseInt(hex.slice(4, 6), 16)]
  const rgb = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null
}

const getActiveIndex = (currentColor: string) => {
  const current = parseColor(currentColor)
  if (!current) return -1
  let activeIndex = -1
  let minDistance = Number.POSITIVE_INFINITY
  themes.forEach((theme, index) => {
    const target = parseColor(theme[0])
    if (!target) return
    const distance = target.reduce((sum, value, channel) => sum + Math.pow(value - current[channel], 2), 0)
    if (distance < minDistance) {
      minDistance = distance
      activeIndex = index
    }
  })
  return activeIndex
}

const ThemeItem = ({ color, active, change }: {
  color: Theme
  active: boolean
  change: (color: Theme) => void
}) => {
  const theme = useTheme()
  return (
    <TouchableOpacity
      style={styles.item}
      activeOpacity={0.5}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      onPress={() => { change(color) }}
    >
      <View style={{ ...styles.colorContent, borderColor: active ? theme['c-primary-font'] : theme['c-border-background'] }}>
        <View style={{ ...styles.image, backgroundColor: color[0] }}></View>
        {active
          ? (
              <View style={{ ...styles.selectedBadge, backgroundColor: theme['c-primary-font'] }}>
                <IconMaterialCommunityIcons name="check" size={11} color={theme['c-content-background']} />
              </View>
            )
          : null}
      </View>
    </TouchableOpacity>
  )
}

export default memo(() => {
  const t = useI18n()
  const currentColor = useSettingValue('desktopLyric.style.lyricPlayedColor')
  const activeIndex = useMemo(() => getActiveIndex(currentColor), [currentColor])

  const setThemeDesktopLyric = (color: Theme) => {
    // const shadowColor = 'rgba(0,0,0,0.6)'
    void setDesktopLyricColor(null, color[0], color[1]).then(() => {
      updateSetting({ 'desktopLyric.style.lyricPlayedColor': color[0], 'desktopLyric.style.lyricShadowColor': color[1] })
    })
  }

  return (
    <SubTitle title={t('setting_lyric_desktop_theme')}>
      <View style={styles.list}>
        {
          themes.map((c, i) => <ThemeItem key={i.toString()} color={c} active={i == activeIndex} change={setThemeDesktopLyric} />)
        }
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    marginRight: 12,
    marginTop: 5,
    alignItems: 'center',
    width: 36,
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  colorContent: {
    width: 34,
    height: 34,
    borderRadius: 7,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    width: 24,
    height: 24,
    borderRadius: 4,
    elevation: 1,
  },
  selectedBadge: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
