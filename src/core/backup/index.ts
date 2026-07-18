import { getListMusics, overwriteListFull } from '@/core/list'
import { setUserApiList } from '@/core/userApi'
import { updateSetting } from '@/core/common'
import listState from '@/store/list/state'
import settingState from '@/store/setting/state'
import { state as dislikeState } from '@/store/dislikeList/state'
import { getUserApiList, getUserApiScript, replaceUserApiList } from '@/utils/data'
import { filterMusicList, fixNewMusicInfoQuality } from '@/utils'

export interface FullBackupData {
  type: 'lx_full_backup_v2'
  version: 2
  createdAt: number
  setting: Partial<LX.AppSetting>
  playList: Array<LX.List.MyDefaultListInfoFull | LX.List.MyLoveListInfoFull | LX.List.UserListInfoFull>
  userApi: Array<{ info: LX.UserApi.UserApiInfo, script: string }>
  dislikeRules: LX.Dislike.DislikeRules
}

interface LegacyWebDAVBackup {
  type: 'lx_webdav_backup_v1'
  version: 1
  createdAt: number
  setting: Partial<LX.AppSetting>
  playList: FullBackupData['playList']
}

const WEB_DAV_SETTING_KEYS: Array<keyof LX.AppSetting> = [
  'sync.webdav.enable',
  'sync.webdav.url',
  'sync.webdav.username',
  'sync.webdav.password',
  'sync.webdav.path',
]

export const createFullBackup = async(): Promise<FullBackupData> => {
  const setting: Partial<LX.AppSetting> = { ...settingState.setting }
  delete setting['sync.webdav.password']
  const userApiList = await getUserApiList()
  return {
    type: 'lx_full_backup_v2',
    version: 2,
    createdAt: Date.now(),
    setting,
    playList: await getAllLists(),
    userApi: await Promise.all(userApiList.map(async info => ({
      info,
      script: await getUserApiScript(info.id),
    }))),
    dislikeRules: dislikeState.dislikeInfo.rules,
  }
}

export const isFullBackup = (data: unknown): data is FullBackupData | LegacyWebDAVBackup => {
  if (!data || typeof data != 'object') return false
  const backup = data as Partial<FullBackupData | LegacyWebDAVBackup>
  return (backup.type == 'lx_full_backup_v2' || backup.type == 'lx_webdav_backup_v1') && Array.isArray(backup.playList)
}

export const restoreFullBackup = async(data: FullBackupData | LegacyWebDAVBackup) => {
  await importListBackup(data.playList)
  if (data.type == 'lx_full_backup_v2') {
    const userApiList = await replaceUserApiList(data.userApi ?? [])
    setUserApiList(userApiList)
    await global.dislike_event.dislike_data_overwrite(data.dislikeRules ?? '', true)
  }
  const restoredSetting: Partial<LX.AppSetting> = { ...data.setting }
  for (const key of WEB_DAV_SETTING_KEYS) delete restoredSetting[key]
  updateSetting(restoredSetting)
  return data.createdAt
}

export const getAllLists = async() => {
  const lists = []
  lists.push(await getListMusics(listState.defaultList.id).then(musics => ({ ...listState.defaultList, list: musics })))
  lists.push(await getListMusics(listState.loveList.id).then(musics => ({ ...listState.loveList, list: musics })))
  for await (const list of listState.userList) {
    lists.push(await getListMusics(list.id).then(musics => ({ ...list, list: musics })))
  }
  return lists
}

export const importListBackup = async(lists: Array<LX.List.MyDefaultListInfoFull | LX.List.MyLoveListInfoFull | LX.List.UserListInfoFull>) => {
  const allLists = await getAllLists()
  for (const list of lists) {
    try {
      const targetList = allLists.find(item => item.id == list.id)
      if (targetList) {
        targetList.list = filterMusicList(list.list).map(musicInfo => fixNewMusicInfoQuality(musicInfo))
      } else {
        const userList: LX.List.UserListInfoFull = {
          name: list.name,
          id: list.id,
          list: filterMusicList(list.list).map(musicInfo => fixNewMusicInfoQuality(musicInfo)),
          source: (list as LX.List.UserListInfoFull).source,
          sourceListId: (list as LX.List.UserListInfoFull).sourceListId,
          locationUpdateTime: (list as LX.List.UserListInfoFull).locationUpdateTime ?? null,
        }
        allLists.push(userList)
      }
    } catch (error) {
      console.log(error)
    }
  }
  const defaultList = allLists.shift()!.list
  const loveList = allLists.shift()!.list
  await overwriteListFull({ defaultList, loveList, userList: allLists as LX.List.UserListInfoFull[] })
}
