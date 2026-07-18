import { memo, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import type { I18n } from '@/lang'
import { useI18n, langList } from '@/lang'
import { setLanguage } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'

const useActive = (id: I18n['locale']) => {
  const activeLangId = useSettingValue('common.langId')
  const isActive = useMemo(() => activeLangId == id, [activeLangId, id])
  return isActive
}

const Item = ({ id, name }: {
  id: I18n['locale']
  name: string
}) => {
  const isActive = useActive(id)
  // const [toggleCheckBox, setToggleCheckBox] = useState(false)
  return (
    <View style={styles.option}>
      <CheckBox check={isActive} label={name} labelNumberOfLines={1} onChange={() => { setLanguage(id) }} need />
    </View>
  )
}

export default memo(() => {
  const t = useI18n()

  return (
    <SubTitle title={t('setting_basic_lang')}>
      <View style={styles.list}>
        {
          langList.map(({ locale, name }) => <Item name={name} id={locale} key={locale} />)
        }
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    flexShrink: 0,
    minHeight: 42,
    justifyContent: 'center',
    marginRight: 18,
    marginBottom: 4,
  },
})
