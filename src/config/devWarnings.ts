import { LogBox } from 'react-native'

if (process.env.NODE_ENV === 'development') {
  // Native ViewManager reflection fallback warnings are emitted before the JS
  // filters are registered and otherwise leave a persistent banner over the UI.
  LogBox.ignoreAllLogs(true)
}
