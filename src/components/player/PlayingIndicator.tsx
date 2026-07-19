import { memo, useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'

import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

export default memo(({ playing, size = 18 }: { playing: boolean, size?: number }) => {
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
      style={{ ...styles.playingIndicator, width: size, height: size + 2 }}
      accessibilityLabel={t(playing ? 'player_current_playlist_playing' : 'player_current_playlist_paused')}
    >
      {bars.map((bar, index) => (
        <Animated.View
          key={index}
          style={{
            ...styles.playingBar,
            backgroundColor: theme['c-primary-font'],
            height: size - 2,
            transform: [{ scaleY: bar }],
          }}
        />
      ))}
    </View>
  )
})

const styles = createStyle({
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playingBar: {
    width: 4,
    borderRadius: 2,
  },
})
