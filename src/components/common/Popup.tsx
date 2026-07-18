import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react'
import { Animated, PanResponder, View, TouchableOpacity, useWindowDimensions } from 'react-native'

import Modal, { type ModalType } from './Modal'
import { Icon } from '@/components/common/Icon'
import { useKeyboard } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from './Text'
import { useStatusbarHeight } from '@/store/common/hook'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const styles = createStyle({
  centeredView: {
    flex: 1,
    // justifyContent: 'flex-end',
    // alignItems: 'center',
  },
  modalView: {
    elevation: 6,
    flexGrow: 0,
    flexShrink: 1,
  },
  header: {
    flex: 0,
    flexDirection: 'row',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  dragHeader: {
    flexGrow: 0,
    flexShrink: 0,
    paddingTop: 7,
  },
  dragHandleArea: {
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  dragTitle: {
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 2,
    paddingBottom: 10,
  },
  title: {
    paddingLeft: 10,
    paddingRight: 25,
    paddingTop: 10,
    paddingBottom: 10,
    // lineHeight: 20,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    // borderTopRightRadius: 8,
    flexGrow: 0,
    flexShrink: 0,
    height: 30,
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#eee',
  },
})

export interface PopupProps {
  onHide?: () => void
  keyHide?: boolean
  bgHide?: boolean
  closeBtn?: boolean
  swipeToClose?: boolean
  position?: 'top' | 'left' | 'right' | 'bottom'
  title?: string
  children: React.ReactNode
}

export interface PopupType {
  setVisible: (visible: boolean) => void
}

export default forwardRef<PopupType, PopupProps>(({
  onHide = () => {},
  keyHide = true,
  bgHide = true,
  closeBtn = true,
  swipeToClose = false,
  position = 'bottom',
  title = '',
  children,
}: PopupProps, ref) => {
  const theme = useTheme()
  const { keyboardShown, keyboardHeight } = useKeyboard()
  const statusBarHeight = useStatusbarHeight()
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()

  const modalRef = useRef<ModalType>(null)
  const translateY = useRef(new Animated.Value(0)).current

  const resetPosition = useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0,
      speed: 24,
      bounciness: 0,
      useNativeDriver: true,
    }).start()
  }, [translateY])

  const hideWithAnimation = useCallback(() => {
    Animated.timing(translateY, {
      toValue: windowHeight,
      duration: 160,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return
      modalRef.current?.setVisible(false)
    })
  }, [translateY, windowHeight])

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => swipeToClose && position == 'bottom',
    onMoveShouldSetPanResponder: (_, gestureState) => swipeToClose &&
      position == 'bottom' &&
      gestureState.dy > 6 &&
      Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.2,
    onPanResponderGrant: () => {
      translateY.stopAnimation()
    },
    onPanResponderMove: (_, gestureState) => {
      translateY.setValue(Math.max(0, gestureState.dy))
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 72 || gestureState.vy > 0.65) {
        hideWithAnimation()
      } else {
        resetPosition()
      }
    },
    onPanResponderTerminate: resetPosition,
  }), [hideWithAnimation, position, resetPosition, swipeToClose, translateY])

  useImperativeHandle(ref, () => ({
    setVisible(visible: boolean) {
      if (visible) translateY.setValue(0)
      modalRef.current?.setVisible(visible)
    },
  }))

  const closeBtnComponent = useMemo(() => closeBtn
    ? <TouchableOpacity style={styles.closeBtn} onPress={() => modalRef.current?.setVisible(false)}>
        <Icon name="close" style={{ color: theme['c-font-label'] }} size={12} />
      </TouchableOpacity>
    : null, [closeBtn, theme])

  const [centeredViewStyle, modalViewStyle] = useMemo(() => {
    switch (position) {
      case 'top':
        return [
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            justifyContent: 'flex-start',
          },
          {
            width: '100%',
            maxHeight: '78%',
            minHeight: '20%',
            // backgroundColor: 'white',
          },
        ] as const
      case 'left':
        return [
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            flexDirection: 'row',
            justifyContent: 'flex-start',
          },
          {
            minWidth: '45%',
            maxWidth: '78%',
            height: '100%',
            paddingTop: statusBarHeight,
            // backgroundColor: 'white',
          },
        ] as const
      case 'right':
        return [
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            flexDirection: 'row',
            justifyContent: 'flex-end',
          },
          {
            minWidth: '45%',
            maxWidth: '78%',
            height: '100%',
            paddingTop: statusBarHeight,
            // backgroundColor: 'white',
          },
        ] as const
      case 'bottom':
      default:
        return [
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            justifyContent: 'flex-end',
          },
          {
            width: '100%',
            maxHeight: '78%',
            minHeight: '20%',
            // backgroundColor: 'white',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          },
        ] as const
    }
  }, [position, statusBarHeight])

  return (
    <Modal animationType="none" onHide={onHide} keyHide={keyHide} bgHide={bgHide} bgColor="rgba(50,50,50,.2)" ref={modalRef}>
      <View style={{
        ...styles.centeredView,
        ...centeredViewStyle,
        paddingBottom: keyboardShown ? keyboardHeight : position == 'bottom' ? insets.bottom : 0,
      }}>
        <Animated.View
          style={{
            ...styles.modalView,
            ...modalViewStyle,
            backgroundColor: theme['c-content-background'],
            transform: [{ translateY }],
          }}
          renderToHardwareTextureAndroid
          onStartShouldSetResponder={() => true}
        >
          {swipeToClose && position == 'bottom'
            ? <View style={styles.dragHeader} {...panResponder.panHandlers}>
                <View style={styles.dragHandleArea}>
                  <View style={{ ...styles.dragHandle, backgroundColor: theme['c-250'] }} />
                </View>
                <Text size={13} style={styles.dragTitle} numberOfLines={1}>{title}</Text>
              </View>
            : <View style={styles.header}>
                <Text size={13} style={styles.title} numberOfLines={1}>{title}</Text>
                {closeBtnComponent}
              </View>}
          {children}
        </Animated.View>
      </View>
    </Modal>
  )
})
