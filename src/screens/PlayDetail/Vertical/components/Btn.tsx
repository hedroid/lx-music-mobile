import { TouchableOpacity } from 'react-native'
import { Icon, IconMaterialCommunityIcons, type MaterialDesignIconName } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT } from '@/config/constant'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)
const MATERIAL_ICON_SIZE = 22

export default ({ icon, materialIcon, materialIconSize = MATERIAL_ICON_SIZE, color, onPress }: {
  icon?: string
  materialIcon?: MaterialDesignIconName
  materialIconSize?: number
  color?: string
  onPress: () => void
}) => {
  return (
    <TouchableOpacity onPress={onPress} style={{ ...styles.button, width: HEADER_HEIGHT }}>
      {materialIcon
        ? <IconMaterialCommunityIcons name={materialIcon} color={color} size={scaleSizeW(materialIconSize)} />
        : <Icon name={icon!} color={color} size={18} />}
    </TouchableOpacity>
  )
}

const styles = createStyle({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    flex: 0,
  },
})
