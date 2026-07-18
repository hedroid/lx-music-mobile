import RNFS from 'react-native-fs'

import { getLyricInfo, getMusicUrl, getPicPath } from '@/core/music'
import { getPlayQuality } from '@/core/music/utils'
import { updateSetting } from '@/core/common'
import settingState from '@/store/setting/state'
import downloadActions from '@/store/download/action'
import downloadState from '@/store/download/state'
import { downloadFile, existsFile, mkdir, moveFile, readDir, unlink, writeFile } from '@/utils/fs'
import { getDownloadList, saveDownloadList } from '@/utils/data'
import { buildLyrics } from '@/utils/lrcTools'
import { writeLyric, writeMetadata, writePic } from '@/utils/localMediaMetadata'
import { confirmDialog, formatMusicName, toast } from '@/utils/tools'

const runningJobs = new Map<string, number>()
const runningFilePaths = new Map<string, string>()
const directoryTasks = new Map<string, Promise<string>>()
const waitingSlots: Array<{ id: string, resolve: (acquired: boolean) => void }> = []
let activeDownloadCount = 0

const DOWNLOAD_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36',
}

// Some NetEase media URLs reject a browser-like user agent. Keep this
// source-specific behavior isolated so a future account-login implementation
// can reuse the same download pipeline without affecting other sources.
const getDownloadHeaders = (musicInfo: LX.Music.MusicInfoOnline) => musicInfo.source == 'wy'
  ? { 'User-Agent': '' }
  : DOWNLOAD_HEADERS

const getConcurrentCount = () => {
  const value = Number(settingState.setting['download.concurrentCount'])
  return Number.isFinite(value) ? Math.min(50, Math.max(1, Math.round(value))) : 3
}

const drainWaitingSlots = () => {
  while (activeDownloadCount < getConcurrentCount() && waitingSlots.length) {
    const waiter = waitingSlots.shift()!
    const task = downloadState.list.find(item => item.id == waiter.id)
    if (!task || task.status != 'waiting') {
      waiter.resolve(false)
      continue
    }
    activeDownloadCount++
    waiter.resolve(true)
  }
}

const acquireDownloadSlot = async(id: string): Promise<boolean> => {
  if (activeDownloadCount < getConcurrentCount()) {
    activeDownloadCount++
    return true
  }
  return new Promise<boolean>(resolve => {
    waitingSlots.push({ id, resolve })
  })
}

const releaseDownloadSlot = () => {
  activeDownloadCount = Math.max(0, activeDownloadCount - 1)
  drainWaitingSlots()
}

const cancelWaitingSlot = (id: string) => {
  const index = waitingSlots.findIndex(waiter => waiter.id == id)
  if (index < 0) return false
  const [waiter] = waitingSlots.splice(index, 1)
  waiter.resolve(false)
  return true
}

export const refreshDownloadConcurrency = () => {
  drainWaitingSlots()
}

const getDefaultPath = () => `${RNFS.ExternalDirectoryPath}/lx-music`
const getSelectedPath = () => settingState.setting['download.savePath'].trim() || getDefaultPath()
const isManagedPath = (path: string) => path.startsWith('content://')

const getAvailableBasePath = async() => {
  const selectedPath = getSelectedPath()
  if (!isManagedPath(selectedPath)) return selectedPath

  try {
    await readDir(selectedPath)
    return selectedPath
  } catch (error) {
    // Android can revoke persisted document permissions after reinstalling the
    // app or removing the selected directory. A stale URI must not block every
    // subsequent download.
    console.warn('Download directory permission is unavailable, using the default directory', error)
    updateSetting({ 'download.savePath': '' })
    toast(global.i18n.t('download_storage_permission_lost'), 'long', 'top')
    return getDefaultPath()
  }
}

const findManagedFile = async(directory: string, fileName: string) => {
  const files = await readDir(directory)
  return files.find(file => file.name == fileName)?.path ?? null
}

const getWorkingFilePath = (id: string, fileName: string) => `${RNFS.CachesDirectoryPath}/lx-download-${id}-${fileName}`
const getTempCoverPath = (id: string) => `${RNFS.CachesDirectoryPath}/lx-download-cover-${id}.jpg`

const removeFileAndLyric = async(filePath: string) => {
  if (await existsFile(filePath)) await unlink(filePath)
  const extIndex = filePath.lastIndexOf('.')
  if (extIndex > filePath.lastIndexOf('/')) {
    const lyricPath = `${filePath.slice(0, extIndex)}.lrc`
    if (await existsFile(lyricPath)) await unlink(lyricPath)
  }
}

const cleanupDownloadTaskFiles = async(task: LX.Download.ListItem) => {
  const paths = new Set([
    runningFilePaths.get(task.id),
    getWorkingFilePath(task.id, task.metadata.fileName),
    task.metadata.filePath,
  ])
  for (const path of paths) {
    if (!path) continue
    try {
      await removeFileAndLyric(path)
    } catch (error) {
      // A revoked SAF permission must not prevent the cache file and task
      // record from being cleaned up.
      console.warn('Remove download temporary file failed', path, error)
    }
  }
  const tempCoverPath = getTempCoverPath(task.id)
  try {
    if (await existsFile(tempCoverPath)) await unlink(tempCoverPath)
  } catch (error) {
    console.warn('Remove download temporary cover failed', tempCoverPath, error)
  }
}

const writeDownloadMetadata = async(filePath: string, musicInfo: LX.Music.MusicInfoOnline, taskId: string) => {
  let lyricFilePath: string | null = null
  if (settingState.setting['download.writeMetadata']) {
    try {
      await writeMetadata(filePath, {
        name: musicInfo.name,
        singer: musicInfo.singer,
        albumName: musicInfo.meta.albumName,
      }, true)
    } catch (error) {
      console.warn('Write downloaded music metadata failed', error)
    }
  }

  if (settingState.setting['download.writePicture']) {
    const tempPicPath = getTempCoverPath(taskId)
    try {
      const picUrl = await getPicPath({ musicInfo })
      let picPath = picUrl
      if (/^https?:\/\//.test(picUrl)) {
        const result = downloadFile(picUrl, tempPicPath)
        const response = await result.promise
        if (response.statusCode < 200 || response.statusCode >= 300) throw new Error(`HTTP ${response.statusCode}`)
        picPath = tempPicPath
      } else if (picPath.startsWith('file://')) {
        picPath = picPath.slice(7)
      }
      if (picPath) await writePic(filePath, picPath)
    } catch (error) {
      console.warn('Write downloaded music artwork failed', error)
    } finally {
      if (await existsFile(tempPicPath)) await unlink(tempPicPath)
    }
  }

  if (settingState.setting['download.writeLyric'] || settingState.setting['download.writeEmbedLyric']) {
    try {
      const lyricInfo = await getLyricInfo({ musicInfo })
      const lyric = buildLyrics(
        lyricInfo,
        false,
        true,
        settingState.setting['download.writeRomaLyric'],
      )
      if (lyric) {
        if (settingState.setting['download.writeEmbedLyric']) await writeLyric(filePath, lyric)
        if (settingState.setting['download.writeLyric']) {
          const basePath = filePath.slice(0, filePath.lastIndexOf('.'))
          lyricFilePath = `${basePath}.lrc`
          await writeFile(lyricFilePath, lyric)
        }
      }
    } catch (error) {
      console.warn('Write downloaded music lyric failed', error)
    }
  }
  return lyricFilePath
}

const sanitizeFileName = (name: string) => name
  .replace(/[\\/:*?"<>|]/g, '_')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 160)

const getFirstArtist = (singer: string) => singer
  .split(/\s*(?:,|，|;|；|&|＆|、|\||\bfeat\.?|\bft\.?|\band\b)\s*/i, 1)[0]
  .trim()

const getFolderNames = (musicInfo: LX.Music.MusicInfoOnline) => {
  const names: string[] = []
  if (settingState.setting['download.createArtistFolder']) {
    const artist = sanitizeFileName(getFirstArtist(musicInfo.singer))
    if (artist) names.push(artist)
  }
  if (settingState.setting['download.createAlbumFolder']) {
    const album = sanitizeFileName(musicInfo.meta.albumName ?? '')
    if (album) names.push(album)
  }
  return names
}

const createDownloadDirectory = async(basePath: string, folderNames: string[]) => {
  let directory = basePath
  if (!isManagedPath(directory)) await mkdir(directory)
  for (const folderName of folderNames) {
    const existing = (await readDir(directory)).find(file => file.isDirectory && file.name == folderName)
    if (existing) {
      directory = existing.path
    } else {
      const created = await mkdir(`${directory}/${folderName}`)
      directory = created.path
    }
  }
  return directory
}

const getDownloadDirectory = async(musicInfo: LX.Music.MusicInfoOnline) => {
  const basePath = await getAvailableBasePath()
  const folderNames = getFolderNames(musicInfo)
  if (!folderNames.length) return Promise.resolve(basePath)

  const key = `${basePath}\n${folderNames.join('\n')}`
  const runningTask = directoryTasks.get(key)
  if (runningTask) return runningTask

  const task = createDownloadDirectory(basePath, folderNames)
  directoryTasks.set(key, task)
  void task.then(
    () => { directoryTasks.delete(key) },
    () => { directoryTasks.delete(key) },
  )
  return task
}

const getExt = (quality: LX.Quality): LX.Download.FileExt => {
  switch (quality) {
    case 'flac24bit':
    case 'flac': return 'flac'
    case 'ape': return 'ape'
    case 'wav': return 'wav'
    default: return 'mp3'
  }
}

const getQuality = (musicInfo: LX.Music.MusicInfoOnline) => {
  const preferred = settingState.setting['player.playQuality']
  if (musicInfo.meta._qualitys[preferred]) return preferred
  return getPlayQuality(preferred, musicInfo)
}

const normalizeMusicIdentity = (value: string | number | undefined | null) => String(value ?? '')
  .trim()
  .toLocaleLowerCase()

const getDownloadMusicIdentity = (task: LX.Download.ListItem) => {
  const musicInfo = task.metadata.musicInfo
  return [
    normalizeMusicIdentity(musicInfo.name),
    normalizeMusicIdentity(musicInfo.singer),
    normalizeMusicIdentity(musicInfo.interval),
    task.metadata.quality,
  ].join('\n')
}

const removeFailedDuplicates = async(completedTask: LX.Download.ListItem) => {
  const identity = getDownloadMusicIdentity(completedTask)
  const duplicateIds = downloadState.list
    .filter(task => task.id != completedTask.id && task.status == 'error' && getDownloadMusicIdentity(task) == identity)
    .map(task => task.id)
  for (const id of duplicateIds) {
    const task = downloadState.list.find(item => item.id == id)
    if (task) await cleanupDownloadTaskFiles(task)
    downloadActions.remove(id)
  }
}

export const initDownload = async() => {
  if (downloadState.initialized) return
  let list = await getDownloadList()
  for (const task of list) {
    if (task.status == 'run' || task.status == 'waiting') {
      task.status = 'error'
      task.statusText = global.i18n.t('download_interrupted')
      task.error = task.statusText
    }
  }
  const completedIdentities = new Set<string>()
  for (const task of list) {
    if (task.status == 'completed' && await existsFile(task.metadata.filePath)) {
      completedIdentities.add(getDownloadMusicIdentity(task))
    }
  }
  const duplicateFailedTasks = list.filter(task => task.status == 'error' && completedIdentities.has(getDownloadMusicIdentity(task)))
  for (const task of duplicateFailedTasks) await cleanupDownloadTaskFiles(task)
  list = list.filter(task => !duplicateFailedTasks.includes(task))
  downloadActions.init(list)
  await saveDownloadList(list)
}

export const getDownloadPath = () => getSelectedPath()

export const getDownloadPlayerList = () => downloadState.list.filter(task => task.status == 'completed')

type DuplicateAction = 'ask' | 'skip' | 'overwrite'

const getDownloadId = (musicInfo: LX.Music.MusicInfoOnline) => `${musicInfo.id}_${getQuality(musicInfo)}`

const isDownloaded = async(musicInfo: LX.Music.MusicInfoOnline) => {
  const existed = downloadState.list.find(item => item.id == getDownloadId(musicInfo))
  return existed?.status == 'completed' && await existsFile(existed.metadata.filePath)
}

const confirmDuplicateDownload = async(count: number) => confirmDialog({
  title: global.i18n.t('download_duplicate_title'),
  message: global.i18n.t('download_duplicate_message', { count }),
  cancelButtonText: global.i18n.t('download_duplicate_skip'),
  confirmButtonText: global.i18n.t('download_duplicate_redownload'),
  bgClose: false,
})

export const startDownloads = async(list: LX.Music.MusicInfoOnline[]) => {
  if (!list.length) return
  await initDownload()

  const duplicatedIds = new Set<string>()
  for (const musicInfo of list) {
    if (await isDownloaded(musicInfo)) duplicatedIds.add(getDownloadId(musicInfo))
  }

  const duplicateAction: DuplicateAction = duplicatedIds.size && await confirmDuplicateDownload(duplicatedIds.size)
    ? 'overwrite'
    : 'skip'
  for (const musicInfo of list) {
    const action = duplicatedIds.has(getDownloadId(musicInfo)) ? duplicateAction : 'skip'
    void startDownload(musicInfo, action)
  }
}

export const startDownload = async(musicInfo: LX.Music.MusicInfoOnline, duplicateAction: DuplicateAction = 'ask') => {
  await initDownload()
  const quality = getQuality(musicInfo)
  const id = getDownloadId(musicInfo)
  const existed = downloadState.list.find(item => item.id == id)
  if (existed?.status == 'completed' && await existsFile(existed.metadata.filePath)) {
    if (duplicateAction == 'skip') return
    if (duplicateAction == 'ask' && !await confirmDuplicateDownload(1)) return
  }
  if (existed?.status == 'run' || existed?.status == 'waiting') {
    toast(global.i18n.t('download_task_exists'), 'short', 'top')
    return
  }
  if (existed) downloadActions.remove(id)

  const ext = getExt(quality)
  const fileName = `${sanitizeFileName(formatMusicName(settingState.setting['download.fileName'], musicInfo.name, musicInfo.singer))}.${ext}`
  const downloadDirectory = await getDownloadDirectory(musicInfo)
  const managedPath = isManagedPath(downloadDirectory)
  const filePath = `${downloadDirectory}/${fileName}`
  const workingFilePath = managedPath ? getWorkingFilePath(id, fileName) : filePath
  const now = Date.now()
  const task: LX.Download.ListItem = {
    id,
    createdAt: now,
    updatedAt: now,
    isComplate: false,
    status: 'waiting',
    statusText: global.i18n.t('download_waiting'),
    downloaded: 0,
    total: 0,
    progress: 0,
    speed: '',
    metadata: {
      musicInfo,
      url: null,
      quality,
      ext,
      fileName,
      filePath,
    },
  }
  downloadActions.add(task)
  toast(global.i18n.t('download_added'), 'short', 'top')

  const acquired = await acquireDownloadSlot(id)
  if (!acquired) return
  downloadActions.update(id, { statusText: global.i18n.t('download_getting_url') })

  try {
    if (managedPath) {
      const existingFile = await findManagedFile(downloadDirectory, fileName)
      if (existingFile) await unlink(existingFile)
    } else {
      await mkdir(downloadDirectory)
      if (await existsFile(filePath)) await unlink(filePath)
    }
    if (workingFilePath != filePath && await existsFile(workingFilePath)) await unlink(workingFilePath)
    // Download links are often short-lived. Always resolve a fresh URL instead
    // of reusing the playback cache, especially when retrying a failed task.
    const url = await getMusicUrl({ musicInfo, quality, isRefresh: true })
    downloadActions.update(id, {
      status: 'run',
      statusText: global.i18n.t('download_downloading'),
      metadata: { ...task.metadata, url },
    })

    let lastTime = Date.now()
    let lastBytes = 0
    const result = downloadFile(url, workingFilePath, {
      headers: getDownloadHeaders(musicInfo),
      progressInterval: 800,
      progress: ({ contentLength, bytesWritten }) => {
        const currentTime = Date.now()
        const seconds = Math.max((currentTime - lastTime) / 1000, 0.1)
        const bytesPerSecond = (bytesWritten - lastBytes) / seconds
        lastTime = currentTime
        lastBytes = bytesWritten
        downloadActions.update(id, {
          downloaded: bytesWritten,
          total: contentLength,
          progress: contentLength > 0 ? bytesWritten / contentLength : 0,
          speed: formatSpeed(bytesPerSecond),
        })
      },
    })
    runningJobs.set(id, result.jobId)
    runningFilePaths.set(id, workingFilePath)
    const response = await result.promise
    runningJobs.delete(id)
    if (response.statusCode < 200 || response.statusCode >= 300) throw new Error(`HTTP ${response.statusCode}`)
    const lyricFilePath = await writeDownloadMetadata(workingFilePath, musicInfo, id)
    let completedFilePath = filePath
    if (managedPath) {
      await moveFile(workingFilePath, filePath)
      completedFilePath = await findManagedFile(downloadDirectory, fileName) ?? filePath
      if (lyricFilePath) {
        const lyricName = `${fileName.slice(0, fileName.lastIndexOf('.'))}.lrc`
        const existingLyric = await findManagedFile(downloadDirectory, lyricName)
        if (existingLyric) await unlink(existingLyric)
        await moveFile(lyricFilePath, `${downloadDirectory}/${lyricName}`)
      }
    }
    runningFilePaths.delete(id)
    downloadActions.update(id, {
      isComplate: true,
      status: 'completed',
      statusText: global.i18n.t('download_completed'),
      progress: 1,
      speed: '',
      error: undefined,
      metadata: { ...task.metadata, url, filePath: completedFilePath },
    })
    const completedTask = downloadState.list.find(item => item.id == id)
    if (completedTask) await removeFailedDuplicates(completedTask)
    toast(global.i18n.t('download_completed_name', { name: musicInfo.name }), 'short', 'top')
  } catch (error: any) {
    runningJobs.delete(id)
    runningFilePaths.delete(id)
    await cleanupDownloadTaskFiles(task)
    const message = error?.message ?? String(error)
    downloadActions.update(id, {
      status: 'error',
      statusText: global.i18n.t('download_failed'),
      error: message,
      speed: '',
    })
    toast(`${global.i18n.t('download_failed')}: ${message}`, 'long', 'top')
  } finally {
    releaseDownloadSlot()
  }
}

export const cancelDownload = async(id: string) => {
  cancelWaitingSlot(id)
  const jobId = runningJobs.get(id)
  if (jobId != null) RNFS.stopDownload(jobId)
  runningJobs.delete(id)
  const task = downloadState.list.find(item => item.id == id)
  if (task) await cleanupDownloadTaskFiles(task)
  runningFilePaths.delete(id)
  downloadActions.remove(id)
}

export const retryDownload = async(id: string) => {
  const task = downloadState.list.find(item => item.id == id)
  if (!task) return
  const musicInfo = task.metadata.musicInfo
  downloadActions.remove(id)
  await startDownload(musicInfo)
}

export const removeDownload = async(id: string, removeFile = true) => {
  const task = downloadState.list.find(item => item.id == id)
  if (!task) return
  if (removeFile) await cleanupDownloadTaskFiles(task)
  downloadActions.remove(id)
}

const formatSpeed = (bytesPerSecond: number) => {
  if (bytesPerSecond >= 1024 * 1024) return `${(bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s`
  return `${Math.max(bytesPerSecond / 1024, 0).toFixed(0)} KB/s`
}
