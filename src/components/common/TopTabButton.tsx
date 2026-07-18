import { type StyleProp, TouchableOpacity, View, type ViewStyle } from 'react-native'

import { useTheme } from '@/store/theme/hook'
import { BorderWidths } from '@/theme'
import { createStyle } from '@/utils/tools'
import { setSpText } from '@/utils/pixelRatio'

import Text from './Text'

const TOP_TAB_HEIGHT = 42

interface TopTabButtonProps {
  label: string
  active: boolean
  onPress: () => void
  style?: StyleProp<ViewStyle>
  horizontalPadding?: number
  indicatorMinWidth?: number
}

/**
 * A top navigation tab whose indicator is laid out separately from its label.
 * This keeps the indicator clear of the text at every supported font scale.
 */
export default ({
  label,
  active,
  onPress,
  style,
  horizontalPadding = 10,
  indicatorMinWidth,
}: TopTabButtonProps) => {
  const theme = useTheme()

  return (
    <TouchableOpacity
      style={[styles.button, { paddingHorizontal: horizontalPadding }, style]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <View style={[styles.content, indicatorMinWidth == null ? null : { minWidth: indicatorMinWidth }]}>
        <Text
          style={styles.label}
          color={active ? theme['c-primary-font-active'] : theme['c-font']}
          numberOfLines={1}
        >
          {label}
        </Text>
        <View
          style={{
            ...styles.indicator,
            backgroundColor: active ? theme['c-primary-background-active'] : 'transparent',
          }}
        />
      </View>
    </TouchableOpacity>
  )
}

const styles = createStyle({
  button: {
    height: TOP_TAB_HEIGHT,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  label: {
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: true,
    lineHeight: setSpText(22),
    paddingHorizontal: 2,
  },
  indicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BorderWidths.normal2,
    borderRadius: BorderWidths.normal2,
  },
})
