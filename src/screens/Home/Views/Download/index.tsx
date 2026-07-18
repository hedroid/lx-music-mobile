import { useMemo, useRef, useState } from 'react'
import { FlatList, Pressable, View } from 'react-native'

import Button from '@/components/common/Button'
import CheckBox from '@/components/common/CheckBox'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Image from '@/components/common/Image'
import Text from '@/components/common/Text'
import TopTabButton from '@/components/common/TopTabButton'
import { Icon, IconMaterialCommunityIcons } from '@/components/common/Icon'
import { LIST_IDS } from '@/config/constant'
import { cancelDownload, getDownloadPath, removeDownload, retryDownload } from '@/core/download'
import { playList } from '@/core/player/player'
import { useI18n } from '@/lang'
import { useDownloadList } from '@/store/download/hook'
import { useTheme } from '@/store/theme/hook'
import { BorderWidths } from '@/theme'
import { formatStoragePath } from '@/utils/fs'
import { confirmDialog, createStyle } from '@/utils/tools'

type Tab = 'running' | 'completed'

const formatBytes = (value: number) => {
  if (!value) return '0 MB'
  if (value >= 1024 * 1024 * 1024) return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

const TaskItem = ({ item, completedIndex, onRequestCompletedDelete }: {
  item: LX.Download.ListItem
  completedIndex: number
  onRequestCompletedDelete: (item: LX.Download.ListItem) => void
}) => {
  const t = useI18n()
  const theme = useTheme()
  const musicInfo = item.metadata.musicInfo
  const handlePress = () => {
    if (item.status == 'completed') void playList(LIST_IDS.DOWNLOAD, completedIndex)
  }
  const handleDelete = async() => {
    if (item.status == 'completed') {
      onRequestCompletedDelete(item)
      return
    }
    const confirm = await confirmDialog({
      message: t('download_remove_confirm'),
      cancelButtonText: t('list_import_part_button_cancel'),
      confirmButtonText: t('confirm_button_text'),
    })
    if (!confirm) return
    if (item.status == 'run' || item.status == 'waiting') {
      void cancelDownload(item.id)
    } else {
      void removeDownload(item.id)
    }
  }
  const progressText = item.total > 0
    ? `${formatBytes(item.downloaded)} / ${formatBytes(item.total)}`
    : item.statusText

  return (
    <Pressable style={styles.item} onPress={handlePress} disabled={item.status != 'completed'}>
      <Image url={musicInfo.meta.picUrl} style={styles.cover} />
      <View style={styles.info}>
        <Text numberOfLines={1}>{musicInfo.name}</Text>
        <Text size={11} color={theme['c-500']} numberOfLines={1}>{musicInfo.singer} · {item.metadata.quality}</Text>
        {item.status == 'completed'
          ? <Text size={11} color={theme['c-400']} numberOfLines={1}>{item.metadata.fileName}</Text>
          : <>
              <View style={{ ...styles.progressTrack, backgroundColor: theme['c-primary-light-900-alpha-200'] }}>
                <View style={{ ...styles.progressValue, width: `${Math.max(0, Math.min(item.progress, 1)) * 100}%`, backgroundColor: theme['c-primary'] }} />
              </View>
              <Text size={10} color={item.status == 'error' ? theme['c-primary-font'] : theme['c-400']} numberOfLines={1}>
                {item.status == 'error' ? item.error ?? item.statusText : `${progressText}${item.speed ? ` · ${item.speed}` : ''}`}
              </Text>
            </>}
      </View>
      <View style={styles.actions}>
        {item.status == 'error'
          ? <Button
              style={styles.action}
              onPress={() => { void retryDownload(item.id) }}
              accessibilityRole="button"
              accessibilityLabel={t('download_retry')}
            >
              <Icon name="available_updates" size={18} color={theme['c-primary-font']} />
            </Button>
          : null}
        <Button
          style={styles.action}
          onPress={() => { void handleDelete() }}
          accessibilityRole="button"
          accessibilityLabel={t('download_delete')}
        >
          <IconMaterialCommunityIcons name="close" size={18} color={theme['c-350']} />
        </Button>
      </View>
    </Pressable>
  )
}

export default () => {
  const t = useI18n()
  const theme = useTheme()
  const tasks = useDownloadList()
  const [tab, setTab] = useState<Tab>('running')
  const deleteAlertRef = useRef<ConfirmAlertType>(null)
  const [deleteTask, setDeleteTask] = useState<LX.Download.ListItem | null>(null)
  const [removeLocalFile, setRemoveLocalFile] = useState(true)
  const completedTasks = useMemo(() => tasks.filter(item => item.status == 'completed'), [tasks])
  const list = useMemo(() => tab == 'completed' ? completedTasks : tasks.filter(item => item.status != 'completed'), [completedTasks, tab, tasks])
  const displayPath = formatStoragePath(getDownloadPath(), t('setting_download_storage_internal'))
  const handleRequestCompletedDelete = (task: LX.Download.ListItem) => {
    setDeleteTask(task)
    setRemoveLocalFile(true)
    deleteAlertRef.current?.setVisible(true)
  }
  const handleConfirmCompletedDelete = () => {
    if (!deleteTask) return
    deleteAlertRef.current?.setVisible(false)
    void removeDownload(deleteTask.id, removeLocalFile)
  }

  return (
    <View style={styles.container}>
      <View style={{ ...styles.tabs, borderBottomColor: theme['c-border-background'] }}>
        <TopTabButton
          style={styles.tab}
          label={t('download_in_progress')}
          active={tab == 'running'}
          onPress={() => { setTab('running') }}
          indicatorMinWidth={56}
        />
        <TopTabButton
          style={styles.tab}
          label={t('download_completed_list')}
          active={tab == 'completed'}
          onPress={() => { setTab('completed') }}
          indicatorMinWidth={56}
        />
      </View>
      <Text style={styles.path} size={10} color={theme['c-500']} numberOfLines={1}>{t('download_storage_path')}: {displayPath}</Text>
      <FlatList
        data={list}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <TaskItem
          item={item}
          completedIndex={completedTasks.findIndex(task => task.id == item.id)}
          onRequestCompletedDelete={handleRequestCompletedDelete}
        />}
        ListEmptyComponent={<Text style={styles.empty} color={theme['c-500']}>{t(tab == 'completed' ? 'download_empty_completed' : 'download_empty_running')}</Text>}
      />
      <ConfirmAlert
        ref={deleteAlertRef}
        text={t('download_remove_confirm')}
        cancelText={t('list_import_part_button_cancel')}
        confirmText={t('confirm_button_text')}
        onHide={() => { setDeleteTask(null) }}
        onConfirm={handleConfirmCompletedDelete}
      >
        <View style={styles.deleteAlertContent}>
          <Text>{t('download_remove_confirm')}</Text>
          <CheckBox
            check={removeLocalFile}
            label={t('download_remove_local_file')}
            onChange={setRemoveLocalFile}
          />
        </View>
      </ConfirmAlert>
    </View>
  )
}

const styles = createStyle({
  container: { flex: 1 },
  tabs: { height: 42, flexDirection: 'row', borderBottomWidth: BorderWidths.normal },
  tab: { flex: 1 },
  path: { paddingHorizontal: 12, paddingVertical: 6 },
  item: { minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingLeft: 10 },
  cover: { width: 46, height: 46, borderRadius: 4 },
  info: { flex: 1, paddingHorizontal: 10, gap: 2 },
  progressTrack: { height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 3 },
  progressValue: { height: '100%' },
  actions: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'stretch' },
  action: { width: 46, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', paddingTop: 60 },
  deleteAlertContent: { gap: 16 },
})
