import { memo, useMemo, useRef } from 'react'
import { PanResponder, TouchableOpacity, View } from 'react-native'
import { useKeyboard } from '@/utils/hooks'

import Pic from './components/Pic'
import Title from './components/Title'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { createStyle } from '@/utils/tools'
// import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { Icon } from '@/components/common/Icon'
import CurrentPlaylist, { type CurrentPlaylistType } from '@/components/player/CurrentPlaylist'
import { useSafeAreaInsets } from 'react-native-safe-area-context'


export default memo(({ isHome = false }: { isHome?: boolean }) => {
  // const { onLayout, ...layout } = useLayout()
  const { keyboardShown } = useKeyboard()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')
  const playlistRef = useRef<CurrentPlaylistType>(null)
  const swipeUpResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      gestureState.dy < -8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.2,
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy < -42 || gestureState.vy < -0.55) playlistRef.current?.show()
    },
  }), [])

  const playerComponent = useMemo(() => (
    <View
      style={{
        ...styles.container,
        paddingBottom: 5 + insets.bottom,
        backgroundColor: theme['c-content-background'],
      }}
      {...swipeUpResponder.panHandlers}
    >
      <Pic isHome={isHome} />
      <View style={styles.center}>
        <Title isHome={isHome} />
        {/* <View style={{ ...styles.row, justifyContent: 'space-between' }}>
          <PlayTime />
        </View> */}
        <PlayInfo isHome={isHome} />
      </View>
      <View style={styles.right}>
        <ControlBtn />
        <TouchableOpacity style={styles.playlistBtn} onPress={() => { playlistRef.current?.show() }}>
          <Icon name="menu" color={theme['c-button-font']} size={21} />
        </TouchableOpacity>
      </View>
    </View>
  ), [theme, insets.bottom, isHome, swipeUpResponder])

  // console.log('render pb')

  return (
    <>
      {autoHidePlayBar && keyboardShown ? null : playerComponent}
      <CurrentPlaylist ref={playlistRef} />
    </>
  )
})


const styles = createStyle({
  container: {
    width: '100%',
    // height: 100,
    // paddingTop: progressContentPadding,
    // marginTop: -progressContentPadding,
    // backgroundColor: 'rgba(0, 0, 0, .1)',
    // borderTopWidth: BorderWidths.normal2,
    paddingVertical: 5,
    paddingLeft: 5,
    // backgroundColor: AppColors.primary,
    // backgroundColor: 'red',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 10,
  },
  left: {
    // borderRadius: 3,
    flexGrow: 0,
    flexShrink: 0,
  },
  center: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 5,
    height: '100%',
    // justifyContent: 'space-evenly',
    // height: 48,
    // backgroundColor: 'rgba(0, 0, 0, .1)',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
    paddingLeft: 5,
    paddingRight: 5,
  },
  playlistBtn: {
    width: 42,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // row: {
  //   flexDirection: 'row',
  //   flexGrow: 0,
  //   flexShrink: 0,
  // },
})
