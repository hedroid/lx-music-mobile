import { memo, useCallback, useState } from 'react'
import SubTitle from '../../components/SubTitle'
import { type SliderProps } from '../../components/Slider'
import SliderRow from '../../components/SliderRow'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { setDesktopLyricTextSize } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'


export default memo(() => {
  const t = useI18n()
  const fontSize = useSettingValue('desktopLyric.style.fontSize')
  const [sliderSize, setSliderSize] = useState(fontSize)
  const [isSliding, setSliding] = useState(false)
  const handleSlidingStart = useCallback<NonNullable<SliderProps['onSlidingStart']>>(() => {
    setSliding(true)
  }, [])
  const handleValueChange = useCallback<NonNullable<SliderProps['onValueChange']>>(value => {
    setSliderSize(value)
  }, [])
  const handleSlidingComplete = useCallback<NonNullable<SliderProps['onSlidingComplete']>>(value => {
    if (fontSize == value) {
      setSliding(false)
      return
    }
    void setDesktopLyricTextSize(value).then(() => {
      updateSetting({ 'desktopLyric.style.fontSize': value })
    }).finally(() => {
      setSliding(false)
    })
  }, [fontSize])

  return (
    <SubTitle title={t('setting_lyric_desktop_text_size')}>
      <SliderRow
        displayValue={isSliding ? sliderSize : fontSize}
        minimumValue={100}
        maximumValue={500}
        onSlidingComplete={handleSlidingComplete}
        onValueChange={handleValueChange}
        onSlidingStart={handleSlidingStart}
        step={2}
        value={fontSize}
      />
    </SubTitle>
  )
})
