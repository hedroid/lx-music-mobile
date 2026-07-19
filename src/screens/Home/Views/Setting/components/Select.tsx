import DorpDownMenu, { type DorpDownMenuProps } from '@/components/common/DorpDownMenu'
import { IconMaterialCommunityIcons } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { StyleSheet, View } from 'react-native'

export interface SelectOption<T extends string = string> {
  action: T
  label: string
}

interface SelectProps<T extends string> {
  options: Readonly<Array<SelectOption<T>>>
  value: T | null
  label?: string
  onChange: (value: T) => void
}

export default function Select<T extends string>({ options, value, label, onChange }: SelectProps<T>) {
  const theme = useTheme()
  const currentLabel = label ?? options.find(item => item.action == value)?.label ?? ''
  const handleChange: DorpDownMenuProps<typeof options>['onPress'] = ({ action }) => {
    onChange(action)
  }

  return (
    <DorpDownMenu
      menus={options}
      onPress={handleChange}
      activeId={value}
      btnStyle={{ ...styles.button, borderColor: theme['c-border-background'] }}
      height={40}
    >
      <View style={styles.content}>
        <Text style={styles.text} numberOfLines={1}>{currentLabel}</Text>
        <IconMaterialCommunityIcons name="chevron-down" size={22} color={theme['c-font']} />
      </View>
    </DorpDownMenu>
  )
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'stretch',
    marginRight: 25,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    minHeight: 40,
  },
  content: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  text: {
    flex: 1,
    marginRight: 8,
  },
})
