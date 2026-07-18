import { memo, useCallback, useState } from 'react'
import SubTitle from '../../components/SubTitle'
import { type SliderProps } from '../../components/Slider'
import SliderRow from '../../components/SliderRow'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { setDesktopLyricAlpha } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'


export default memo(() => {
  const t = useI18n()
  const opacity = useSettingValue('desktopLyric.style.opacity')
  const [sliderSize, setSliderSize] = useState(opacity)
  const [isSliding, setSliding] = useState(false)
  const handleSlidingStart = useCallback<NonNullable<SliderProps['onSlidingStart']>>(() => {
    setSliding(true)
  }, [])
  const handleValueChange = useCallback<NonNullable<SliderProps['onValueChange']>>(value => {
    setSliderSize(value)
  }, [])
  const handleSlidingComplete = useCallback<NonNullable<SliderProps['onSlidingComplete']>>(value => {
    if (opacity == value) {
      setSliding(false)
      return
    }
    void setDesktopLyricAlpha(value).then(() => {
      updateSetting({ 'desktopLyric.style.opacity': value })
    }).finally(() => {
      setSliding(false)
    })
  }, [opacity])

  return (
    <SubTitle title={t('setting_lyric_desktop_text_opacity')}>
      <SliderRow
        displayValue={isSliding ? sliderSize : opacity}
        minimumValue={10}
        maximumValue={100}
        onSlidingComplete={handleSlidingComplete}
        onValueChange={handleValueChange}
        onSlidingStart={handleSlidingStart}
        step={2}
        value={opacity}
      />
    </SubTitle>
  )
})
