import { memo, useEffect, useMemo, useRef, type ComponentRef } from 'react'
import { View, TouchableOpacity, PanResponder, type GestureResponderEvent } from 'react-native'
import { LIST_ITEM_HEIGHT } from '@/config/constant'
// import { BorderWidths } from '@/theme'
import { Icon } from '@/components/common/Icon'
import PlayingIndicator from '@/components/player/PlayingIndicator'
import { createStyle, type RowInfo } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useAssertApiSupport } from '@/store/common/hook'
import { useIsPlay } from '@/store/player/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import Text from '@/components/common/Text'
import Badge from '@/components/common/Badge'
import MusicCover from '@/components/MusicCover'

export const ITEM_HEIGHT = scaleSizeH(LIST_ITEM_HEIGHT)


export default memo(({
  item,
  index,
  activeIndex,
  onPress,
  onShowMenu,
  onLongPress,
  selectedList,
  rowInfo,
  isShowAlbumName,
  isShowCover,
  isShowInterval,
  draggable = false,
  dragging = false,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  item: LX.Music.MusicInfo
  index: number
  activeIndex: number
  onPress: (item: LX.Music.MusicInfo, index: number) => void
  onLongPress: (item: LX.Music.MusicInfo, index: number) => void
  onShowMenu: (item: LX.Music.MusicInfo, index: number, position: { x: number, y: number, w: number, h: number }) => void
  selectedList: LX.Music.MusicInfo[]
  rowInfo: RowInfo
  isShowAlbumName: boolean
  isShowCover: boolean
  isShowInterval: boolean
  draggable?: boolean
  dragging?: boolean
  onDragStart?: (index: number) => void
  onDragMove?: (dy: number) => void
  onDragEnd?: () => void
}) => {
  const theme = useTheme()
  const isPlay = useIsPlay()

  const isSelected = selectedList.includes(item)
  // console.log(item.name, selectedList, selectedList.includes(item))
  const isSupported = useAssertApiSupport(item.source)
  const moreButtonRef = useRef<ComponentRef<typeof TouchableOpacity>>(null)
  const dragReadyRef = useRef(false)
  const panActiveRef = useRef(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartRef = useRef({ x: 0, y: 0 })
  const clearLongPressTimer = () => {
    if (!longPressTimerRef.current) return
    clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }
  const handleTouchStart = (event: GestureResponderEvent) => {
    if (!draggable) return
    clearLongPressTimer()
    dragReadyRef.current = false
    touchStartRef.current = {
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
    }
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null
      dragReadyRef.current = true
      onDragStart?.(index)
    }, 350)
  }
  const handleTouchMove = (event: GestureResponderEvent) => {
    if (dragReadyRef.current || !longPressTimerRef.current) return
    const dx = event.nativeEvent.pageX - touchStartRef.current.x
    const dy = event.nativeEvent.pageY - touchStartRef.current.y
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) clearLongPressTimer()
  }
  const handleTouchEnd = () => {
    clearLongPressTimer()
    if (!dragReadyRef.current || panActiveRef.current) return
    dragReadyRef.current = false
    onDragEnd?.()
  }
  useEffect(() => clearLongPressTimer, [])
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponderCapture: (_, gestureState) => dragReadyRef.current && Math.abs(gestureState.dy) > 2,
    onPanResponderGrant: () => { panActiveRef.current = true },
    onPanResponderMove: (_, gestureState) => { onDragMove?.(gestureState.dy) },
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: () => {
      dragReadyRef.current = false
      panActiveRef.current = false
      onDragEnd?.()
    },
    onPanResponderTerminate: () => {
      dragReadyRef.current = false
      panActiveRef.current = false
      onDragEnd?.()
    },
  }), [onDragEnd, onDragMove])
  const handleShowMenu = () => {
    if (moreButtonRef.current?.measure) {
      moreButtonRef.current.measure((_fx: number, _fy: number, width: number, height: number, px: number, py: number) => {
        // console.log(fx, fy, width, height, px, py)
        onShowMenu(item, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
      })
    }
  }
  const active = activeIndex == index

  const singer = `${item.singer}${isShowAlbumName && item.meta.albumName ? ` · ${item.meta.albumName}` : ''}`

  return (
    <View
      style={{
        ...styles.listItem,
        width: rowInfo.rowWidth,
        height: ITEM_HEIGHT,
        backgroundColor: dragging ? theme['c-primary-background-active'] : isSelected ? theme['c-primary-background-hover'] : 'rgba(0,0,0,0)',
        opacity: dragging ? 0.88 : isSupported ? 1 : 0.5,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity style={styles.listItemLeft} onPress={() => { onPress(item, index) }} onLongPress={() => { onLongPress(item, index) }}>
        {isShowCover
          ? <View style={styles.coverContent}>
              <MusicCover musicInfo={item} style={styles.cover} />
            </View>
          : <Text style={styles.sn} size={13} color={theme['c-300']}>{index + 1}</Text>}
        <View style={styles.itemInfo}>
          {/* <View style={styles.listItemTitle}> */}
          <Text color={active ? theme['c-primary-font'] : theme['c-font']} numberOfLines={1}>{item.name}</Text>
          {/* </View> */}
          <View style={styles.listItemSingle}>
            <Badge>{item.source.toUpperCase()}</Badge>
            <Text style={styles.listItemSingleText} size={11} color={active ? theme['c-primary-alpha-200'] : theme['c-500']} numberOfLines={1}>
              {singer}
            </Text>
          </View>
        </View>
        {
          isShowInterval || active
            ? (
                <View style={styles.trailing}>
                  {active ? <View style={styles.playingIndicatorWrap}><PlayingIndicator playing={isPlay} /></View> : null}
                  {isShowInterval
                    ? (
                        <Text style={styles.duration} size={12} color={active ? theme['c-primary-alpha-400'] : theme['c-250']} numberOfLines={1}>
                          {item.interval}
                        </Text>
                      )
                    : null}
                </View>
              )
            : null
        }
      </TouchableOpacity>
      {/* <View style={styles.listItemRight}> */}
      <TouchableOpacity onPress={handleShowMenu} ref={moreButtonRef} style={styles.moreButton}>
        <Icon name="dots-vertical" style={{ color: theme['c-350'] }} size={12} />
      </TouchableOpacity>
      {/* </View> */}
    </View>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.isShowAlbumName === nextProps.isShowAlbumName &&
    prevProps.isShowCover === nextProps.isShowCover &&
    prevProps.isShowInterval === nextProps.isShowInterval &&
    prevProps.draggable === nextProps.draggable &&
    prevProps.dragging === nextProps.dragging &&
    prevProps.activeIndex != nextProps.index &&
    nextProps.activeIndex != nextProps.index &&
    nextProps.selectedList.includes(nextProps.item) == prevProps.selectedList.includes(nextProps.item)
  )
})


const styles = createStyle({
  listItem: {
    // width: '50%',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    // paddingLeft: 10,
    paddingRight: 2,
    alignItems: 'center',
    // borderBottomWidth: BorderWidths.normal,
  },
  listItemLeft: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sn: {
    width: 38,
    height: ITEM_HEIGHT,
    // fontSize: 12,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: 'rgba(0,0,0,0.2)',
    paddingLeft: 3,
    paddingRight: 3,
  },
  coverContent: {
    width: 54,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: {
    width: 42,
    height: 42,
    borderRadius: 4,
  },
  itemInfo: {
    flexGrow: 1,
    flexShrink: 1,
    // paddingTop: 10,
    // paddingBottom: 10,
    paddingRight: 2,
  },
  // listItemTitle: {
  //   flexGrow: 0,
  //   flexShrink: 1,
  // },
  listItemSingle: {
    paddingTop: 3,
    flexDirection: 'row',
    // alignItems: 'flex-end',
  },
  listItemSingleText: {
    // backgroundColor: 'rgba(0,0,0,0.2)',
    flexGrow: 0,
    flexShrink: 1,
    fontWeight: '300',
    // fontSize: 15,
  },
  trailing: {
    flexShrink: 0,
    paddingLeft: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playingIndicatorWrap: {
    marginRight: 7,
  },
  duration: {
    width: 42,
    textAlign: 'right',
  },
  // listItemBadge: {
  //   // fontSize: 10,
  //   paddingLeft: 5,
  //   paddingTop: 2,
  //   alignSelf: 'flex-start',
  // },
  listItemRight: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    justifyContent: 'center',
  },

  moreButton: {
    height: '80%',
    paddingLeft: 16,
    paddingRight: 16,
    // paddingTop: 10,
    // paddingBottom: 10,
    // backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
  },
})
