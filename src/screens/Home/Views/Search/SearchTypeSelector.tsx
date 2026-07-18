import { useEffect, useMemo, useState } from 'react'
import { ScrollView } from 'react-native'

import { createStyle } from '@/utils/tools'
import { type SearchType } from '@/store/search/state'
import { useI18n } from '@/lang'
import TopTabButton from '@/components/common/TopTabButton'
import { getSearchSetting } from '@/utils/data'

const SEARCH_TYPE_LIST = [
  'music',
  'songlist',
] as const

export default () => {
  const t = useI18n()
  const [type, setType] = useState<SearchType>('music')

  useEffect(() => {
    void getSearchSetting().then(info => {
      setType(info.type)
    })
  }, [])

  const list = useMemo(() => {
    return SEARCH_TYPE_LIST.map(type => ({ label: t(`search_type_${type}`), id: type }))
  }, [t])

  const handleTypeChange = (type: SearchType) => {
    setType(type)
    global.app_event.searchTypeChanged(type)
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps={'always'} horizontal={true}>
      {
        list.map(t => (
          <TopTabButton
            key={t.id}
            label={t.label}
            active={type == t.id}
            onPress={() => { handleTypeChange(t.id) }}
            horizontalPadding={8}
          />
        ))
      }
    </ScrollView>
  )
}

const styles = createStyle({
  container: {
    height: '100%',
    flexGrow: 0,
    flexShrink: 1,
    // paddingLeft: 5,
    // paddingRight: 5,
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
})
