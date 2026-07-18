import createIconSetFromIcoMoon from '@react-native-vector-icons/icomoon'
import { createIconSet } from '@react-native-vector-icons/common'
import materialDesignGlyphMap from '@react-native-vector-icons/material-design-icons/glyphmaps/MaterialDesignIcons.json'
import icoMoonConfig from '@/resources/fonts/selection.json'
import { scaleSizeW } from '@/utils/pixelRatio'
import { memo, type ComponentProps } from 'react'
import { useTextShadow, useTheme } from '@/store/theme/hook'
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native'

const IcoMoon = createIconSetFromIcoMoon(icoMoonConfig)
const IconMaterialCommunityIcons = createIconSet(materialDesignGlyphMap, {
  postScriptName: 'MaterialDesignIcons',
  fontFileName: 'MaterialDesignIcons.ttf',
})


// https://oblador.github.io/react-native-vector-icons/

type IconType = ReturnType<typeof createIconSetFromIcoMoon>

interface IconProps extends Omit<ComponentProps<IconType>, 'style'> {
  style?: StyleProp<TextStyle>
  rawSize?: number
}

export const Icon = memo(({ size = 15, rawSize, color, style, ...props }: IconProps) => {
  const theme = useTheme()
  const textShadow = useTextShadow()
  const newStyle = textShadow ? StyleSheet.compose({
    textShadowColor: theme['c-primary-dark-300-alpha-800'],
    textShadowOffset: { width: 0.2, height: 0.2 },
    textShadowRadius: 2,
  }, style) : style
  return (
    <IcoMoon
      size={rawSize ?? scaleSizeW(size)}
      color={color ?? theme['c-font']}
      style={newStyle}
      {...props}
    />
  )
})


export {
  IconMaterialCommunityIcons,
}

export type MaterialDesignIconName = ComponentProps<typeof IconMaterialCommunityIcons>['name']
