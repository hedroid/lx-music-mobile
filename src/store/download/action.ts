import { saveDownloadList } from '@/utils/data'
import state from './state'

const notify = () => {
  global.app_event.downloadListUpdate()
  void saveDownloadList(state.list)
}

export default {
  init(list: LX.Download.ListItem[]) {
    state.list = list
    state.initialized = true
    global.app_event.downloadListUpdate()
  },
  add(task: LX.Download.ListItem) {
    state.list.unshift(task)
    notify()
  },
  update(id: string, patch: Partial<LX.Download.ListItem>) {
    const task = state.list.find(item => item.id == id)
    if (!task) return
    Object.assign(task, patch, { updatedAt: Date.now() })
    notify()
  },
  remove(id: string) {
    const index = state.list.findIndex(item => item.id == id)
    if (index < 0) return
    state.list.splice(index, 1)
    notify()
  },
}
