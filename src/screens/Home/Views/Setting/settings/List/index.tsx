import { memo } from 'react'

import Section from '../../components/Section'
import AddMusicLocationType from './AddMusicLocationType'
import IsClickPlayList from './IsClickPlayList'
import IsShowAlbumName from './IsShowAlbumName'
import IsShowCover from './IsShowCover'
import IsShowInterval from './IsShowInterval'

import { useI18n } from '@/lang'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_list')}>
      <IsClickPlayList />
      <IsShowAlbumName />
      <IsShowCover />
      <IsShowInterval />
      <AddMusicLocationType />
    </Section>
  )
})
