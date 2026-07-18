let activeListId: string | null = null
let isCleared = false
const removedMusicIds = new Set<string>()
let orderedMusicIds: string[] = []

export const resetCurrentPlaylist = (listId: string) => {
  activeListId = listId
  isCleared = false
  removedMusicIds.clear()
  orderedMusicIds = []
}

export const filterCurrentPlaylist = <T extends { id: string }>(listId: string | null, list: T[]): T[] => {
  if (!listId || activeListId != listId) return list
  if (isCleared) return []
  const filteredList = removedMusicIds.size
    ? list.filter(item => !removedMusicIds.has(item.id))
    : list
  if (!orderedMusicIds.length) return filteredList

  const musicMap = new Map<string, T[]>()
  for (const item of filteredList) {
    const items = musicMap.get(item.id)
    if (items) items.push(item)
    else musicMap.set(item.id, [item])
  }
  const orderedList: T[] = []
  for (const id of orderedMusicIds) {
    const items = musicMap.get(id)
    const item = items?.shift()
    if (!item) continue
    orderedList.push(item)
    if (!items?.length) musicMap.delete(id)
  }
  for (const items of musicMap.values()) {
    orderedList.push(...items)
  }
  return orderedList
}

export const removeCurrentPlaylistMusic = (listId: string, musicId: string) => {
  if (activeListId != listId) resetCurrentPlaylist(listId)
  removedMusicIds.add(musicId)
  orderedMusicIds = orderedMusicIds.filter(id => id != musicId)
}

export const reorderCurrentPlaylist = (listId: string, musicIds: string[]) => {
  if (activeListId != listId) {
    activeListId = listId
    isCleared = false
    removedMusicIds.clear()
  }
  orderedMusicIds = [...musicIds]
}

export const clearCurrentPlaylist = (listId: string) => {
  if (activeListId != listId) resetCurrentPlaylist(listId)
  isCleared = true
  removedMusicIds.clear()
  orderedMusicIds = []
}
