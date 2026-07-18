import { memo, useCallback, useState } from 'react'
import SubTitle from '../../components/SubTitle'
import { type SliderProps } from '../../components/Slider'
import SliderRow from '../../components/SliderRow'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { setDesktopLyricMaxLineNum } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'


export default memo(() => {
  const t = useI18n()
  const maxLineNum = useSettingValue('desktopLyric.maxLineNum')
  const [sliderSize, setSliderSize] = useState(maxLineNum)
  const [isSliding, setSliding] = useState(false)
  const handleSlidingStart = useCallback<NonNullable<SliderProps['onSlidingStart']>>(() => {
    setSliding(true)
  }, [])
  const handleValueChange = useCallback<NonNullable<SliderProps['onValueChange']>>(value => {
    setSliderSize(value)
  }, [])
  const handleSlidingComplete = useCallback<NonNullable<SliderProps['onSlidingComplete']>>(value => {
    if (maxLineNum == value) {
      setSliding(false)
      return
    }
    void setDesktopLyricMaxLineNum(value).then(() => {
      updateSetting({ 'desktopLyric.maxLineNum': value })
    }).finally(() => {
      setSliding(false)
    })
  }, [maxLineNum])

  return (
    <SubTitle title={t('setting_lyric_desktop_maxlineNum')}>
      <SliderRow
        displayValue={isSliding ? sliderSize : maxLineNum}
        minimumValue={1}
        maximumValue={8}
        onSlidingComplete={handleSlidingComplete}
        onValueChange={handleValueChange}
        onSlidingStart={handleSlidingStart}
        step={1}
        value={maxLineNum}
      />
    </SubTitle>
  )
})
