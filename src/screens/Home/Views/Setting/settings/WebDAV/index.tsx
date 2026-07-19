import { memo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import CheckBoxItem from '../../components/CheckBoxItem'
import { backupToWebDAV, restoreFromWebDAV, testWebDAV } from '@/core/webdav'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { toast } from '@/utils/tools'
import Button from '../../components/Button'
import InputItem, { type InputItemProps } from '../../components/InputItem'
import Section from '../../components/Section'

type Action = 'test' | 'backup' | 'restore' | null
const DEFAULT_WEBDAV_URL = 'https://dav.jianguoyun.com/dav/'

export default memo(() => {
  const t = useI18n()
  const restoreConfirmRef = useRef<ConfirmAlertType>(null)
  const [action, setAction] = useState<Action>(null)
  const enabled = useSettingValue('sync.webdav.enable')
  const url = useSettingValue('sync.webdav.url')
  const username = useSettingValue('sync.webdav.username')
  const password = useSettingValue('sync.webdav.password')
  const path = useSettingValue('sync.webdav.path')
  const backupFileName = path.split('/').pop()
  // Empty input should show the default too, not only null or undefined.
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const displayedBackupFileName = backupFileName || 'backup.json'
  const update = (key: keyof LX.AppSetting): InputItemProps['onChanged'] => (value, callback) => {
    const normalized = value.trim()
    callback(normalized)
    updateSetting({ [key]: normalized })
  }
  const updateFileName: InputItemProps['onChanged'] = (value, callback) => {
    const normalized = value.trim().split('/').pop()?.replace(/[\\:*?"<>|]/g, '_')
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const fileName = normalized || 'backup.json'
    callback(fileName)
    updateSetting({ 'sync.webdav.path': fileName })
  }
  const run = async(type: Exclude<Action, null>) => {
    if (action) return
    setAction(type)
    try {
      if (type == 'test') await testWebDAV()
      else if (type == 'backup') await backupToWebDAV()
      else await restoreFromWebDAV()
      toast(t(`setting_webdav_${type}_success`), 'short', 'top')
    } catch (error: any) {
      toast(`${t(`setting_webdav_${type}_failed`)}: ${String(error?.message ?? error)}`, 'long', 'top')
    } finally {
      setAction(null)
    }
  }
  const handleRestorePress = () => {
    if (action) return
    restoreConfirmRef.current?.setVisible(true)
  }
  const handleRestoreConfirm = () => {
    restoreConfirmRef.current?.setVisible(false)
    void run('restore')
  }

  return (
    <Section title={t('setting_webdav')}>
      <CheckBoxItem
        check={enabled}
        label={t('setting_webdav_enable')}
        onChange={(value) => {
          updateSetting(value && !url
            ? { 'sync.webdav.enable': true, 'sync.webdav.url': DEFAULT_WEBDAV_URL }
            : { 'sync.webdav.enable': value })
        }}
      />
      {enabled
        ? (
            <View style={styles.configuration}>
              <InputItem value={url} label={t('setting_webdav_url')} onChanged={update('sync.webdav.url')} autoCapitalize="none" autoCorrect={false} />
              <InputItem value={username} label={t('setting_webdav_username')} onChanged={update('sync.webdav.username')} autoCapitalize="none" autoCorrect={false} />
              <InputItem value={password} label={t('setting_webdav_password')} onChanged={update('sync.webdav.password')} secureTextEntry autoCapitalize="none" autoCorrect={false} />
              <InputItem value={displayedBackupFileName} label={t('setting_webdav_path')} onChanged={updateFileName} autoCapitalize="none" autoCorrect={false} />
              <View style={styles.buttons}>
                <Button disabled={action != null} onPress={() => { void run('backup') }}>{t('setting_webdav_backup')}</Button>
                <Button disabled={action != null} onPress={handleRestorePress}>{t('setting_webdav_restore')}</Button>
                <Button disabled={action != null} onPress={() => { void run('test') }}>{t('setting_webdav_test')}</Button>
              </View>
              <ConfirmAlert
                ref={restoreConfirmRef}
                bgHide={false}
                title={t('setting_webdav_restore')}
                text={t('setting_webdav_restore_confirm')}
                cancelText={t('dialog_cancel')}
                confirmText={t('dialog_confirm')}
                onConfirm={handleRestoreConfirm}
              />
            </View>
          )
        : null}
    </Section>
  )
})

const styles = StyleSheet.create({
  configuration: {
    marginTop: 16,
    marginBottom: 18,
  },
  buttons: {
    paddingLeft: 25,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})
