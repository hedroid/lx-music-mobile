import { TouchableOpacity } from 'react-native'
import { Icon, IconMaterialCommunityIcons, type MaterialDesignIconName } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeW } from '@/utils/pixelRatio'

export const BTN_WIDTH = scaleSizeW(32)
export const BTN_ICON_SIZE = 22

export default ({ icon, materialIcon, materialIconSize = BTN_ICON_SIZE, color, onPress }: {
  icon?: string
  materialIcon?: MaterialDesignIconName
  materialIconSize?: number
  color?: string
  onPress: () => void
}) => {
  const theme = useTheme()
  return (
    <TouchableOpacity style={{ ...styles.cotrolBtn, width: BTN_WIDTH, height: BTN_WIDTH }} activeOpacity={0.5} onPress={onPress}>
      {materialIcon
        ? <IconMaterialCommunityIcons name={materialIcon} color={color ?? theme['c-font-label']} size={scaleSizeW(materialIconSize)} />
        : <Icon name={icon!} color={color ?? theme['c-font-label']} size={BTN_ICON_SIZE} />}
    </TouchableOpacity>
  )
}

const styles = createStyle({
  cotrolBtn: {
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',

    // backgroundColor: '#ccc',
    shadowOpacity: 1,
    textShadowRadius: 1,
  },
})
