import { useEffect, useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Navigation } from 'react-native-navigation'

import Button from '@/components/common/Button'
import CheckBox from '@/components/common/CheckBox'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { resolveDownloadQualityModal } from '../utils'
import ModalContent from './ModalContent'

interface Props {
  componentId: string
  preferred: LX.Quality
  qualityList: LX.Quality[]
}

export default ({ componentId, preferred, qualityList }: Props) => {
  const t = useI18n()
  const theme = useTheme()
  const [quality, setQuality] = useState(preferred)
  const list = useMemo(() => Array.from(new Set([preferred, ...qualityList])), [preferred, qualityList])
  const getQualityLabel = (item: LX.Quality) => {
    switch (item) {
      case '128k': return t('quality_option_128k')
      case '192k': return t('quality_option_192k')
      case '320k': return t('quality_option_320k')
      case 'flac24bit': return t('quality_option_flac24bit')
      default: return t('quality_option_flac')
    }
  }
  useEffect(() => {
    const subscription = Navigation.events().registerComponentDidDisappearListener(({ componentId: hiddenId }) => {
      if (hiddenId == componentId) resolveDownloadQualityModal(null)
    })
    return () => { subscription.remove() }
  }, [componentId])
  const close = (value: LX.Quality | null) => {
    resolveDownloadQualityModal(value)
    void Navigation.dismissOverlay(componentId)
  }

  return (
    <ModalContent>
      <View style={styles.content}>
        <Text style={styles.title}>{t('download_quality_select')}</Text>
        <ScrollView style={styles.list} keyboardShouldPersistTaps="always">
          {list.map(item => (
            <CheckBox
              key={item}
              check={quality == item}
              label={item == preferred ? t('download_quality_playback_default', { quality: getQualityLabel(item) }) : getQualityLabel(item)}
              marginBottom={6}
              need
              onChange={() => { setQuality(item) }}
            />
          ))}
        </ScrollView>
      </View>
      <View style={styles.actions}>
        <Button style={{ ...styles.button, backgroundColor: theme['c-button-background'] }} onPress={() => { close(null) }}>
          <Text color={theme['c-button-font']}>{t('dialog_cancel')}</Text>
        </Button>
        <Button style={{ ...styles.button, backgroundColor: theme['c-button-background'] }} onPress={() => { close(quality) }}>
          <Text color={theme['c-button-font']}>{t('dialog_confirm')}</Text>
        </Button>
      </View>
    </ModalContent>
  )
}

const styles = createStyle({
  content: {
    minWidth: 270,
    maxHeight: 430,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  title: {
    marginBottom: 12,
  },
  list: {
    flexGrow: 0,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginLeft: 10,
    borderRadius: 4,
  },
})
