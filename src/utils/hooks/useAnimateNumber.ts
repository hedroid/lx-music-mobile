import { useEffect, useMemo, useRef } from 'react'
import { Animated } from 'react-native'


export const DEFAULT_DURATION = 800

export const useAnimateNumber = (val: number, duration = DEFAULT_DURATION, useNativeDriver = true) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const anim = useMemo(() => new Animated.Value(0), [val])
  const currentNumber = useRef(val)
  const nextNumber = useMemo(() => val, [val])

  const animNumber = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [currentNumber.current, nextNumber],
  })

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration,
      useNativeDriver,
    }).start()
    requestAnimationFrame(() => {
      currentNumber.current = nextNumber
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextNumber])

  return [animNumber, true] as const
}

export const useAnimateOnecNumber = (val: number, toVal: number, duration = DEFAULT_DURATION, useNativeDriver = true) => {
  const anim = useMemo(() => new Animated.Value(0), [])
  const animNumber = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [val, toVal],
  })

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration,
      useNativeDriver,
    }).start()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [animNumber, true] as const
}
