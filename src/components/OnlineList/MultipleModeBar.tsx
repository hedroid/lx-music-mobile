import { useState, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { Animated, View, TouchableOpacity } from 'react-native'

import Text from '@/components/common/Text'
import Button from '@/components/common/Button'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { BorderWidths } from '@/theme'
import { scaleSizeH } from '@/utils/pixelRatio'
import { useStatusbarHeight } from '@/store/common/hook'

export type SelectMode = 'single' | 'range'

export const MULTI_SELECT_BAR_HEIGHT = scaleSizeH(40)

export interface MultipleModeBarProps {
  onSwitchMode: (mode: SelectMode) => void
  onSelectAll: (isAll: boolean) => void
  onDownloadSelected: () => void
  onExitSelectMode: () => void
}
export interface MultipleModeBarType {
  show: () => void
  setIsSelectAll: (isAll: boolean) => void
  setSwitchMode: (mode: SelectMode) => void
  setSelectedCount: (count: number) => void
  exitSelectMode: () => void
}

export default forwardRef<MultipleModeBarType, MultipleModeBarProps>(({ onSelectAll, onSwitchMode, onDownloadSelected, onExitSelectMode }, ref) => {
  // const isGetDetailFailedRef = useRef(false)
  const [visible, setVisible] = useState(false)
  const [animatePlayed, setAnimatPlayed] = useState(true)
  const animFade = useRef(new Animated.Value(0)).current
  const animTranslateY = useRef(new Animated.Value(0)).current
  const [selectMode, setSelectMode] = useState<SelectMode>('single')
  const [isSelectAll, setIsSelectAll] = useState(false)
  const [selectedCount, setSelectedCount] = useState(0)
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()

  useImperativeHandle(ref, () => ({
    show() {
      handleShow()
    },
    setIsSelectAll(isAll) {
      setIsSelectAll(isAll)
    },
    setSwitchMode(mode: SelectMode) {
      setSelectMode(mode)
    },
    setSelectedCount(count: number) {
      setSelectedCount(count)
    },
    exitSelectMode() {
      handleHide()
    },
  }))

  const handleShow = useCallback(() => {
    // console.log('show List')
    setVisible(true)
    setAnimatPlayed(false)
    requestAnimationFrame(() => {
      animTranslateY.setValue(20)

      Animated.parallel([
        Animated.timing(animFade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setAnimatPlayed(true)
      })
    })
  }, [animFade, animTranslateY])

  const handleHide = useCallback(() => {
    setAnimatPlayed(false)
    Animated.parallel([
      Animated.timing(animFade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animTranslateY, {
        toValue: 20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(finished => {
      if (!finished) return
      setVisible(false)
      setAnimatPlayed(true)
    })
  }, [animFade, animTranslateY])


  const animaStyle = useMemo(() => ({
    ...styles.container,
    height: MULTI_SELECT_BAR_HEIGHT + statusBarHeight,
    paddingTop: statusBarHeight,
    backgroundColor: theme['c-content-background'],
    borderBottomColor: theme['c-border-background'],
    opacity: animFade, // Bind opacity to animated value
    transform: [
      { translateY: animTranslateY },
    ],
  }), [animFade, animTranslateY, statusBarHeight, theme])

  const handleSelectAll = useCallback(() => {
    const selectAll = !isSelectAll
    setIsSelectAll(selectAll)
    onSelectAll(selectAll)
  }, [isSelectAll, onSelectAll])

  const component = useMemo(() => {
    return (
      <Animated.View style={animaStyle}>
        <View style={styles.switchBtn}>
          <Button onPress={() => { onSwitchMode(selectMode == 'range' ? 'single' : 'range') }} style={{ ...styles.btn, backgroundColor: selectMode == 'range' ? theme['c-button-background'] : 'rgba(0,0,0,0)' }}>
            <Text color={selectMode == 'range' ? theme['c-button-font'] : theme['c-font']}>{global.i18n.t('list_select_range')}</Text>
          </Button>
        </View>
        <TouchableOpacity onPress={handleSelectAll} style={styles.btn}>
          <Text color={theme['c-font']}>{global.i18n.t(isSelectAll ? 'list_select_unall' : 'list_select_all')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDownloadSelected} disabled={!selectedCount} style={styles.btn}>
          <Text color={selectedCount ? theme['c-primary'] : theme['c-400']}>{global.i18n.t('download_selected', { count: selectedCount })}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onExitSelectMode} style={styles.btn}>
          <Text color={theme['c-font']}>{global.i18n.t('list_select_cancel')}</Text>
        </TouchableOpacity>
      </Animated.View>
    )
  }, [animaStyle, selectMode, theme, handleSelectAll, isSelectAll, onDownloadSelected, onExitSelectMode, onSwitchMode, selectedCount])

  return !visible && animatePlayed ? null : component
})

const styles = createStyle({
  container: {
    flexGrow: 0,
    flexShrink: 0,
    width: '100%',
    // height: 40,
    flexDirection: 'row',
    borderBottomWidth: BorderWidths.normal,
  },
  switchBtn: {
    flexDirection: 'row',
    flex: 1,
  },
  btn: {
    paddingLeft: 12,
    paddingRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
