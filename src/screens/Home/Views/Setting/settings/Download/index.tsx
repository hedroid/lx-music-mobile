import { memo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import RNFS from 'react-native-fs'

import CheckBox from '@/components/common/CheckBox'
import Text from '@/components/common/Text'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { formatStoragePath, selectManagedFolder } from '@/utils/fs'
import { toast } from '@/utils/tools'
import { refreshDownloadConcurrency } from '@/core/download'
import Button from '../../components/Button'
import Section from '../../components/Section'
import SliderRow from '../../components/SliderRow'
import SubTitle from '../../components/SubTitle'

type FileNameFormat = LX.AppSetting['download.fileName']
type BooleanDownloadSetting = 'download.createArtistFolder' | 'download.createAlbumFolder' | 'download.writeMetadata' | 'download.writePicture' | 'download.writeLyric' | 'download.writeEmbedLyric' | 'download.writeRomaLyric'

const Toggle = ({ settingKey, label, disabled = false }: {
  settingKey: BooleanDownloadSetting
  label: string
  disabled?: boolean
}) => {
  const value = useSettingValue(settingKey)
  return (
    <CheckBox
      check={value}
      disabled={disabled}
      label={label}
      marginBottom={8}
      onChange={(nextValue) => { updateSetting({ [settingKey]: nextValue }) }}
    />
  )
}

const FileNameOption = ({ value, label }: { value: FileNameFormat, label: string }) => {
  const currentValue = useSettingValue('download.fileName')
  return (
    <CheckBox
      check={currentValue == value}
      label={label}
      marginRight={12}
      marginBottom={8}
      need
      onChange={() => { updateSetting({ 'download.fileName': value }) }}
    />
  )
}

export default memo(() => {
  const t = useI18n()
  const writeLyric = useSettingValue('download.writeLyric')
  const writeEmbedLyric = useSettingValue('download.writeEmbedLyric')
  const savePath = useSettingValue('download.savePath')
  const concurrentCountSetting = useSettingValue('download.concurrentCount')
  const [concurrentCount, setConcurrentCount] = useState(concurrentCountSetting)
  const defaultPath = `${RNFS.ExternalDirectoryPath}/lx-music`
  const displayPath = formatStoragePath(savePath || defaultPath, t('setting_download_storage_internal'))
  const handleSelectPath = async() => {
    try {
      const folder = await selectManagedFolder(true)
      if (!folder?.path) return
      updateSetting({ 'download.savePath': folder.path })
      toast(t('setting_download_storage_selected'), 'short', 'top')
    } catch (error: any) {
      toast(t('open_storage_select_managed_folder_failed_tip', { msg: String(error?.message ?? error) }), 'long', 'top')
    }
  }

  return (
    <Section title={t('setting_download')}>
      <SubTitle title={t('setting_download_concurrency')}>
        <SliderRow
          value={concurrentCount}
          minimumValue={1}
          maximumValue={50}
          step={1}
          onValueChange={setConcurrentCount}
          onSlidingComplete={(value) => {
            const nextValue = Math.round(value)
            setConcurrentCount(nextValue)
            updateSetting({ 'download.concurrentCount': nextValue })
            refreshDownloadConcurrency()
          }}
        />
        <Text style={styles.tip} size={13}>{t('setting_download_concurrency_tip')}</Text>
      </SubTitle>

      <SubTitle title={t('setting_download_storage')}>
        <Text style={styles.path} selectable>{displayPath}</Text>
        <Text style={styles.tip} size={13}>{t('setting_download_storage_tip')}</Text>
        <View style={styles.pathActions}>
          <Button onPress={() => { void handleSelectPath() }}>{t('setting_download_storage_select')}</Button>
          {savePath
            ? <Button onPress={() => { updateSetting({ 'download.savePath': '' }) }}>{t('setting_download_storage_reset')}</Button>
            : null}
        </View>
      </SubTitle>

      <SubTitle title={t('setting_download_folder_organization')}>
        <Toggle settingKey="download.createArtistFolder" label={t('setting_download_create_artist_folder')} />
        <Toggle settingKey="download.createAlbumFolder" label={t('setting_download_create_album_folder')} />
        <Text style={styles.tip} size={13}>{t('setting_download_folder_organization_tip')}</Text>
      </SubTitle>

      <SubTitle title={t('setting_download_file_name')}>
        <View style={styles.row}>
          <FileNameOption value="歌名 - 歌手" label={t('setting_download_file_name_song_singer')} />
          <FileNameOption value="歌手 - 歌名" label={t('setting_download_file_name_singer_song')} />
          <FileNameOption value="歌名" label={t('setting_download_file_name_song')} />
        </View>
      </SubTitle>

      <SubTitle title={t('setting_download_file_content')}>
        <Toggle settingKey="download.writeMetadata" label={t('setting_download_write_metadata')} />
        <Toggle settingKey="download.writePicture" label={t('setting_download_write_picture')} />
        <Toggle settingKey="download.writeLyric" label={t('setting_download_write_lyric')} />
        <Toggle settingKey="download.writeEmbedLyric" label={t('setting_download_write_embed_lyric')} />
        <Toggle
          settingKey="download.writeRomaLyric"
          label={t('setting_download_write_roma_lyric')}
          disabled={!writeLyric && !writeEmbedLyric}
        />
      </SubTitle>
    </Section>
  )
})

const styles = StyleSheet.create({
  path: {
    marginBottom: 6,
  },
  tip: {
    opacity: 0.65,
  },
  pathActions: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})
