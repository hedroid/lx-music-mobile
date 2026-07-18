import { memo } from 'react'
import { TouchableOpacity, View } from 'react-native'

import Button from '@/components/common/Button'
import Checkbox from '@/components/common/CheckBox/Checkbox'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { pop } from '@/navigation'
import { useTheme } from '@/store/theme/hook'
import commonState from '@/store/common/state'
import { handlePlay } from './listAction'
import songlistState from '@/store/songlist/state'
import { useI18n } from '@/lang'
import { useListInfo } from './state'
import { scaleSizeH, setSpText } from '@/utils/pixelRatio'

export interface SelectionState {
  active: boolean
  count: number
  isAll: boolean
}

interface Props {
  selection: SelectionState
  onSelectAll: (isAll: boolean) => void
  onDownloadSelected: () => void
  onCancelSelection: () => void
}

export default memo(({ selection, onSelectAll, onDownloadSelected, onCancelSelection }: Props) => {
  const theme = useTheme()
  const t = useI18n()
  const info = useListInfo()
  const selectionLabelStyle = {
    ...styles.selectionLabel,
  }

  const back = () => {
    void pop(commonState.componentIds.songlistDetail!)
  }

  const handlePlayAll = () => {
    if (!songlistState.listDetailInfo.info.name) return
    void handlePlay(info.id, info.source, songlistState.listDetailInfo.list)
  }

  return (
    <View style={styles.container}>
      <View pointerEvents={selection.active ? 'none' : 'auto'} style={{ ...styles.actionContent, display: selection.active ? 'none' : 'flex' }}>
        <Button onPress={handlePlayAll} style={{ ...styles.controlBtn, ...styles.playAllButton }}>
          <Text style={{ ...styles.controlBtnText, color: theme['c-button-font'] }}>{t('play_all')}</Text>
        </Button>
        <Button onPress={back} style={{ ...styles.controlBtn, ...styles.backButton }}>
          <Text style={{ ...styles.controlBtnText, color: theme['c-button-font'] }}>{t('back')}</Text>
        </Button>
      </View>
      <View pointerEvents={selection.active ? 'auto' : 'none'} style={{ ...styles.actionContent, display: selection.active ? 'flex' : 'none' }}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('download_selected', { count: selection.count })}
          disabled={!selection.count}
          onPress={onDownloadSelected}
          style={styles.downloadButton}
        >
          <Text size={13} color={selection.count ? theme['c-primary'] : theme['c-400']}>{t('download_action')}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('list_select_cancel')} onPress={onCancelSelection} style={styles.cancelButton}>
          <Text size={13}>{t('list_select_cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { onSelectAll(!selection.isAll) }} style={styles.selectionButton}>
          <Text size={13} style={selectionLabelStyle}>{t(selection.isAll ? 'list_select_unall' : 'list_select_all')}</Text>
          <Checkbox
            status={selection.isAll ? 'checked' : selection.count ? 'indeterminate' : 'unchecked'}
            onPress={() => { onSelectAll(!selection.isAll) }}
            tintColors={{ true: theme['c-primary'], false: theme['c-500'] }}
            size={0.9}
          />
        </TouchableOpacity>
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    width: '100%',
    height: scaleSizeH(34),
    flexGrow: 0,
    flexShrink: 0,
  },
  actionContent: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
  },
  controlBtn: {
    flex: 1,
    justifyContent: 'center',
  },
  playAllButton: {
    alignItems: 'flex-start',
    paddingLeft: 16,
  },
  backButton: {
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  controlBtnText: {
    fontSize: setSpText(13),
    textAlign: 'center',
  },
  selectionButton: {
    flex: 1,
    paddingRight: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  selectionLabel: {
    includeFontPadding: true,
    textAlignVertical: 'center',
  },
  downloadButton: {
    flex: 1,
    paddingLeft: 16,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
