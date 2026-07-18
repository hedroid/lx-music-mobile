import { memo } from 'react'
import { View } from 'react-native'

import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Slider, { type SliderProps } from './Slider'

interface SliderRowProps extends SliderProps {
  displayValue?: string | number
}

export default memo(({ displayValue, value, ...props }: SliderRowProps) => {
  const theme = useTheme()
  const minimumValue = props.minimumValue ?? 0
  const currentValue = value ?? minimumValue

  return (
    <View style={styles.container}>
      <Text
        style={styles.value}
        color={theme['c-primary-font']}
        numberOfLines={1}
      >
        {displayValue ?? currentValue}
      </Text>
      <Slider value={currentValue} {...props} />
    </View>
  )
})

const styles = createStyle({
  container: {
    width: '100%',
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    width: 48,
    paddingRight: 8,
    textAlign: 'left',
  },
})
