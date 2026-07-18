export interface InitState {
  list: LX.Download.ListItem[]
  initialized: boolean
}

const state: InitState = {
  list: [],
  initialized: false,
}

export default state
