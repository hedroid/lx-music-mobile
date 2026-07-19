import { memo } from 'react'

import SubTitle from '../../components/SubTitle'
import { useI18n, langList } from '@/lang'
import { setLanguage } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import Select from '../../components/Select'

export default memo(() => {
  const t = useI18n()
  const activeLangId = useSettingValue('common.langId')
  const options = langList.map(({ locale, name }) => ({ action: locale, label: name }))

  return (
    <SubTitle title={t('setting_basic_lang')}>
      <Select options={options} value={activeLangId} onChange={setLanguage} />
    </SubTitle>
  )
})
