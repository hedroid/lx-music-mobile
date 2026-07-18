import { forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Animated, FlatList, PanResponder, type GestureResponderEvent, TouchableOpacity, View } from 'react-native'

import Badge from '@/components/common/Badge'
import { IconMaterialCommunityIcons } from '@/components/common/Icon'
import Popup, { type PopupType } from '@/components/common/Popup'
import Text from '@/components/common/Text'
import MusicCover from '@/components/MusicCover'
import { clearCurrentPlaylist, removeCurrentPlaylistMusic, reorderCurrentPlaylist } from '@/core/player/currentPlaylist'
import { getList, setPlayMusicInfo, updatePlayIndex } from '@/core/player/playInfo'
import { playList, stop } from '@/core/player/player'
import { useI18n } from '@/lang'
import playerState from '@/store/player/state'
import { useIsPlay, usePlayInfo, usePlayMusicInfo } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

export interface CurrentPlaylistType {
  show: () => void
}

const getMusicInfo = (item: LX.Player.PlayMusic) => 'progress' in item ? item.metadata.musicInfo : item

const PlayingIndicator = memo(({ playing }: { playing: boolean }) => {
  const t = useI18n()
  const theme = useTheme()
  const bars = useRef([
    new Animated.Value(0.4),
    new Animated.Value(0.7),
    new Animated.Value(0.5),
  ]).current

  useEffect(() => {
    const restingValues = [0.4, 0.7, 0.5]
    bars.forEach((bar, index) => { bar.setValue(restingValues[index]) })
    if (!playing) return

    const animation = Animated.loop(Animated.parallel(bars.map((bar, index) => Animated.sequence([
      Animated.delay(index * 60),
      Animated.timing(bar, {
        toValue: 1,
        duration: 180 + index * 35,
        useNativeDriver: true,
      }),
      Animated.timing(bar, {
        toValue: 0.3 + index * 0.1,
        duration: 220 - index * 25,
        useNativeDriver: true,
      }),
    ]))))
    animation.start()
    return () => { animation.stop() }
  }, [bars, playing])

  return (
    <View
      style={styles.playingIndicator}
      accessibilityLabel={t(playing ? 'player_current_playlist_playing' : 'player_current_playlist_paused')}
    >
      {bars.map((bar, index) => (
        <Animated.View
          key={index}
          style={{
            ...styles.playingBar,
            backgroundColor: theme['c-primary-font'],
            transform: [{ scaleY: bar }],
          }}
        />
      ))}
    </View>
  )
})

const ITEM_HEIGHT = 56

const CurrentPlaylistItem = memo(({ item, active, playing, dragging, onPress, onRemove, onDragStart, onDragMove, onDragEnd }: {
  item: LX.Player.PlayMusic
  active: boolean
  playing: boolean
  dragging: boolean
  onPress: () => void
  onRemove: () => void
  onDragStart: () => void
  onDragMove: (dy: number) => void
  onDragEnd: () => void
}) => {
  const t = useI18n()
  const theme = useTheme()
  const musicInfo = getMusicInfo(item)
  const singer = `${musicInfo.singer}${musicInfo.meta.albumName ? ` · ${musicInfo.meta.albumName}` : ''}`
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
    clearLongPressTimer()
    dragReadyRef.current = false
    touchStartRef.current = {
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
    }
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null
      dragReadyRef.current = true
      onDragStart()
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
    onDragEnd()
  }
  useEffect(() => clearLongPressTimer, [])
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponderCapture: (_, gestureState) => dragReadyRef.current && Math.abs(gestureState.dy) > 2,
    onPanResponderGrant: () => { panActiveRef.current = true },
    onPanResponderMove: (_, gestureState) => { onDragMove(gestureState.dy) },
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: () => {
      dragReadyRef.current = false
      panActiveRef.current = false
      onDragEnd()
    },
    onPanResponderTerminate: () => {
      dragReadyRef.current = false
      panActiveRef.current = false
      onDragEnd()
    },
  }), [onDragEnd, onDragMove])

  return (
    <View
      style={{
        ...styles.item,
        backgroundColor: dragging
          ? theme['c-primary-background-active']
          : active ? theme['c-primary-background-hover'] : 'transparent',
        opacity: dragging ? 0.88 : 1,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.itemContent}
        onPress={onPress}
        onLongPress={() => {}}
        delayLongPress={350}
      >
        <MusicCover musicInfo={musicInfo} style={styles.cover} />
        <View style={styles.info}>
          <Text numberOfLines={1} color={active ? theme['c-primary-font'] : theme['c-font']}>
            {musicInfo.name}
          </Text>
          <View style={styles.meta}>
            <Badge>{musicInfo.source.toUpperCase()}</Badge>
            <Text style={styles.singer} numberOfLines={1} size={11} color={theme['c-font-label']}>
              {singer}
            </Text>
          </View>
        </View>
        <View style={styles.trailing}>
          {active ? <PlayingIndicator playing={playing} /> : null}
          <Text style={styles.duration} numberOfLines={1} size={12} color={theme['c-250']}>
            {musicInfo.interval ?? ''}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={t('player_current_playlist_remove')}
      >
        <IconMaterialCommunityIcons name="close" size={18} color={theme['c-250']} />
      </TouchableOpacity>
    </View>
  )
})

export default memo(forwardRef<CurrentPlaylistType>((_, ref) => {
  const t = useI18n()
  const theme = useTheme()
  const popupRef = useRef<PopupType>(null)
  const playInfo = usePlayInfo()
  const playMusicInfo = usePlayMusicInfo()
  const isPlay = useIsPlay()
  const [list, setList] = useState<LX.Player.PlayMusic[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dragStartIndexRef = useRef(-1)
  const dragCurrentIndexRef = useRef(-1)

  const refresh = () => {
    setList([...getList(playerState.playInfo.playerListId)])
  }

  useImperativeHandle(ref, () => ({
    show() {
      refresh()
      popupRef.current?.setVisible(true)
    },
  }))

  useEffect(() => {
    const handleListUpdate = () => { refresh() }
    global.app_event.on('myListMusicUpdate', handleListUpdate)
    global.app_event.on('downloadListUpdate', handleListUpdate)
    return () => {
      global.app_event.off('myListMusicUpdate', handleListUpdate)
      global.app_event.off('downloadListUpdate', handleListUpdate)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [playInfo.playerListId])

  const handlePlay = (index: number) => {
    if (!playInfo.playerListId) return
    void playList(playInfo.playerListId, index, false)
  }

  const handleClear = () => {
    const listId = playerState.playInfo.playerListId
    if (!listId || !list.length) return
    clearCurrentPlaylist(listId)
    setList([])
    void stop()
    setPlayMusicInfo(null, null)
  }

  const handleRemove = (index: number) => {
    const listId = playerState.playInfo.playerListId
    const item = list[index]
    if (!listId || !item) return

    const musicInfo = getMusicInfo(item)
    const isCurrent = musicInfo.id == playerState.playMusicInfo.musicInfo?.id
    if (isCurrent && list.length > 1) {
      const nextIndex = index == list.length - 1 ? 0 : index + 1
      void playList(listId, nextIndex, false)
    }

    removeCurrentPlaylistMusic(listId, item.id)
    const nextList = [...getList(listId)]
    setList(nextList)

    if (isCurrent) {
      if (!nextList.length) {
        void stop()
        setPlayMusicInfo(null, null)
      } else {
        updatePlayIndex()
      }
    } else {
      updatePlayIndex()
    }
  }

  const handleDragStart = (index: number) => {
    const item = list[index]
    if (!item) return
    dragStartIndexRef.current = index
    dragCurrentIndexRef.current = index
    setDraggingId(item.id)
  }

  const handleDragMove = (dy: number) => {
    if (dragStartIndexRef.current < 0) return
    const targetIndex = Math.max(0, Math.min(
      list.length - 1,
      dragStartIndexRef.current + Math.round(dy / ITEM_HEIGHT),
    ))
    if (targetIndex == dragCurrentIndexRef.current) return

    setList(currentList => {
      const nextList = [...currentList]
      const [item] = nextList.splice(dragCurrentIndexRef.current, 1)
      if (!item) return currentList
      nextList.splice(targetIndex, 0, item)
      return nextList
    })
    dragCurrentIndexRef.current = targetIndex
  }

  const handleDragEnd = () => {
    const listId = playerState.playInfo.playerListId
    if (dragStartIndexRef.current < 0) return
    dragStartIndexRef.current = -1
    dragCurrentIndexRef.current = -1
    setDraggingId(null)
    if (!listId) return
    setList(currentList => {
      reorderCurrentPlaylist(listId, currentList.map(item => item.id))
      updatePlayIndex()
      return currentList
    })
  }

  return (
    <Popup
      ref={popupRef}
      title={t('player_current_playlist')}
      position="bottom"
      closeBtn={false}
      swipeToClose
    >
        <View style={{ ...styles.summary, borderBottomColor: theme['c-border-background'] }}>
          <Text size={12} color={theme['c-font-label']}>
            {t('player_current_playlist_count', { count: list.length })}
          </Text>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            disabled={!list.length}
            accessibilityRole="button"
            accessibilityLabel={t('player_current_playlist_clear')}
          >
            <IconMaterialCommunityIcons
              name="delete-outline"
              size={19}
              color={list.length ? theme['c-primary-font'] : theme['c-250']}
            />
          </TouchableOpacity>
        </View>
        <FlatList
          data={list}
          keyExtractor={item => `${getMusicInfo(item).source}_${item.id}`}
          scrollEnabled={draggingId == null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text color={theme['c-font-label']}>{t('player_current_playlist_empty')}</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const musicInfo = getMusicInfo(item)
            return (
              <CurrentPlaylistItem
                item={item}
                active={musicInfo.id == playMusicInfo.musicInfo?.id}
                playing={isPlay && musicInfo.id == playMusicInfo.musicInfo?.id}
                dragging={draggingId == item.id}
                onPress={() => { handlePlay(index) }}
                onRemove={() => { handleRemove(index) }}
                onDragStart={() => { handleDragStart(index) }}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
              />
            )
          }}
        />
    </Popup>
  )
}))

const styles = createStyle({
  summary: {
    height: 40,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  clearButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    height: ITEM_HEIGHT,
    paddingLeft: 12,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemContent: {
    height: ITEM_HEIGHT,
    flex: 1,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cover: {
    width: 42,
    height: 42,
    borderRadius: 4,
  },
  info: {
    flex: 1,
    paddingHorizontal: 10,
  },
  meta: {
    paddingTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  singer: {
    flexShrink: 1,
  },
  trailing: {
    flexShrink: 0,
    paddingLeft: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playingIndicator: {
    width: 18,
    height: 20,
    marginRight: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playingBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  duration: {
    width: 42,
    textAlign: 'right',
  },
  removeButton: {
    width: 40,
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
