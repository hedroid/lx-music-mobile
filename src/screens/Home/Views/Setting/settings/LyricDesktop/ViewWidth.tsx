import { memo, useCallback, useState } from 'react'
import SubTitle from '../../components/SubTitle'
import { type SliderProps } from '../../components/Slider'
import SliderRow from '../../components/SliderRow'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { setDesktopLyricWidth } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'


export default memo(() => {
  const t = useI18n()
  const width = useSettingValue('desktopLyric.width')
  const [sliderSize, setSliderSize] = useState(width)
  const [isSliding, setSliding] = useState(false)
  const handleSlidingStart = useCallback<NonNullable<SliderProps['onSlidingStart']>>(() => {
    setSliding(true)
  }, [])
  const handleValueChange = useCallback<NonNullable<SliderProps['onValueChange']>>(value => {
    setSliderSize(value)
  }, [])
  const handleSlidingComplete = useCallback<NonNullable<SliderProps['onSlidingComplete']>>(value => {
    if (width == value) {
      setSliding(false)
      return
    }
    void setDesktopLyricWidth(value).then(() => {
      updateSetting({ 'desktopLyric.width': value })
    }).finally(() => {
      setSliding(false)
    })
  }, [width])

  return (
    <SubTitle title={t('setting_lyric_desktop_view_width')}>
      <SliderRow
        displayValue={isSliding ? sliderSize : width}
        minimumValue={10}
        maximumValue={100}
        onSlidingComplete={handleSlidingComplete}
        onValueChange={handleValueChange}
        onSlidingStart={handleSlidingStart}
        step={1}
        value={width}
      />
    </SubTitle>
  )
})
