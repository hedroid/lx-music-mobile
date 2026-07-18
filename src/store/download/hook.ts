import { useEffect, useState } from 'react'
import state from './state'

export const useDownloadList = () => {
  const [list, setList] = useState([...state.list])

  useEffect(() => {
    const update = () => { setList([...state.list]) }
    global.app_event.on('downloadListUpdate', update)
    return () => { global.app_event.off('downloadListUpdate', update) }
  }, [])

  return list
}
