import { useCallback, useEffect, useMemo, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import CheckBox from './Checkbox'

import { createStyle, tipDialog } from '@/utils/tools'
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/pixelRatio'
import { useTheme } from '@/store/theme/hook'
import Text from '../Text'
import { Icon } from '../Icon'

export interface CheckBoxProps {
  check: boolean
  label?: string
  children?: React.ReactNode
  onChange: (check: boolean) => void
  disabled?: boolean
  need?: boolean
  size?: number
  marginRight?: number
  marginBottom?: number
  labelNumberOfLines?: number

  helpTitle?: string
  helpDesc?: string
}

export default ({ check, label, children, onChange, helpTitle, helpDesc, disabled = false, need = false, marginRight = 0, marginBottom = 0, size = 1, labelNumberOfLines }: CheckBoxProps) => {
  const theme = useTheme()
  const [isDisabled, setDisabled] = useState(false)
  const tintColors = {
    true: theme['c-primary'],
    false: theme['c-600'],
  }
  const disabledTintColors = {
    true: theme['c-primary-alpha-600'],
    false: theme['c-400'],
  }

  useEffect(() => {
    if (need) {
      if (check) {
        if (!isDisabled) setDisabled(true)
      } else {
        if (isDisabled) setDisabled(false)
      }
    } else {
      isDisabled && setDisabled(false)
    }
  }, [check, need, isDisabled])

  const handleLabelPress = useCallback(() => {
    if (isDisabled) return
    onChange?.(!check)
  }, [isDisabled, onChange, check])

  const helpComponent = useMemo(() => {
    const handleShowHelp = () => {
      void tipDialog({
        title: helpTitle ?? '',
        message: helpDesc,
        btnText: global.i18n.t('understand'),
      })
    }
    return (helpTitle ?? helpDesc) ? (
      <TouchableOpacity style={styles.helpBtn} onPress={handleShowHelp}>
        <Icon size={15 * size} name="help" />
      </TouchableOpacity>
    ) : null
  }, [helpTitle, helpDesc, size])


  const fontSizeScale = Math.min(Math.max(global.lx.fontSize, 0.8), 1.2)
  const controlHeight = Math.max(32 * size * fontSizeScale, setSpText(24 * size))
  const preventLabelWrap = labelNumberOfLines === 1
  const contentStyle = { ...styles.content, flexShrink: preventLabelWrap ? 0 : 1, minHeight: controlHeight, marginBottom: scaleSizeH(marginBottom) }
  const labelStyle = { ...styles.label, flexShrink: preventLabelWrap ? 0 : 1, minHeight: controlHeight, marginRight: scaleSizeW(marginRight) }
  const nameStyle = {
    ...styles.name,
    lineHeight: setSpText(26 * size),
  }

  return (
    disabled
      ? (
          <View style={contentStyle}>
            <CheckBox status={check ? 'checked' : 'unchecked'} disabled={true} tintColors={disabledTintColors} size={size} />
            <View style={labelStyle}>{label ? <Text style={nameStyle} numberOfLines={labelNumberOfLines} color={theme['c-500']} size={15 * size}>{label}</Text> : children}</View>
            {helpComponent}
          </View>
        )
      : (
          <View style={contentStyle}>
            <CheckBox status={check ? 'checked' : 'unchecked'} disabled={isDisabled} onPress={handleLabelPress} tintColors={tintColors} size={size} />
            <TouchableOpacity style={labelStyle} activeOpacity={0.3} onPress={handleLabelPress}>
              {label ? <Text style={nameStyle} numberOfLines={labelNumberOfLines} size={15 * size}>{label}</Text> : children}
            </TouchableOpacity>
            {helpComponent}
          </View>
        )
  )
}

const styles = createStyle({
  content: {
    flexGrow: 0,
    flexShrink: 1,
    marginRight: 15,
    alignItems: 'center',
    flexDirection: 'row',
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  checkbox: {
    flex: 0,
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  label: {
    flexGrow: 0,
    flexShrink: 1,
    justifyContent: 'center',
    // marginRight: 15,
    // alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.2)',
    paddingRight: 3,
  },
  name: {
    includeFontPadding: true,
    textAlignVertical: 'center',
  },
  helpBtn: {
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
})
