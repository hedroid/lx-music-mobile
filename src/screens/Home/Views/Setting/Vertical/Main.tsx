import { memo } from 'react'
import { ScrollView, View } from 'react-native'

import Basic from '../settings/Basic'
import Player from '../settings/Player'
import LyricDesktop from '../settings/LyricDesktop'
import Search from '../settings/Search'
import List from '../settings/List'
import Download from '../settings/Download'
import WebDAV from '../settings/WebDAV'
import Backup from '../settings/Backup'
import Other from '../settings/Other'
import Version from '../settings/Version'
import About from '../settings/About'
import { createStyle } from '@/utils/tools'
import { SETTING_SCREENS, type SettingScreenIds } from '../Main'

const styles = createStyle({
  content: {
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 15,
    paddingBottom: 15,
    flex: 0,
  },
})

const ListItem = memo(({
  id,
}: { id: SettingScreenIds }) => {
  switch (id) {
    case 'player': return <Player />
    case 'lyric_desktop': return <LyricDesktop />
    case 'search': return <Search />
    case 'list': return <List />
    case 'download': return <Download />
    case 'webdav': return <WebDAV />
    case 'backup': return <Backup />
    case 'other': return <Other />
    case 'version': return <Version />
    case 'about': return <About />
    case 'basic': return <Basic />
  }
}, () => true)

export default () => {
  return (
    <ScrollView keyboardShouldPersistTaps={'always'}>
      <View style={styles.content}>
        {SETTING_SCREENS.map(id => <ListItem key={id} id={id} />)}
      </View>
    </ScrollView>
  )
}
