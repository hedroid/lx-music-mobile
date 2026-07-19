import { Navigation } from 'react-native-navigation'
import {
  VERSION_MODAL,
  PACT_MODAL,
  SYNC_MODE_MODAL,
  DOWNLOAD_QUALITY_MODAL,
} from './screenNames'
import themeState from '@/store/theme/state'

let downloadQualityResolver: ((quality: LX.Quality | null) => void) | null = null


export const getStatusBarStyle = (isDark: boolean) => isDark ? 'light' : 'dark'

export const dismissOverlay = async(compId: string) => Navigation.dismissOverlay(compId)

export const pop = async(compId: string) => Navigation.pop(compId)
export const popToRoot = async(compId: string) => Navigation.popToRoot(compId)
export const popTo = async(compId: string) => Navigation.popTo(compId)

export const showPactModal = () => {
  const theme = themeState.theme

  void Navigation.showOverlay({
    component: {
      name: PACT_MODAL,
      options: {
        layout: {
          componentBackgroundColor: 'transparent',
        },
        overlay: {
          interceptTouchOutside: true,
        },
        statusBar: {
          drawBehind: true,
          visible: true,
          style: getStatusBarStyle(theme.isDark),
          backgroundColor: 'transparent',
        },
        navigationBar: {
          // visible: false,
          backgroundColor: theme['c-content-background'],
        },
        // animations: {

        //   showModal: {
        //     enter: {
        //       enabled: true,
        //       alpha: {
        //         from: 0,
        //         to: 1,
        //         duration: 300,
        //       },
        //     },
        //     exit: {
        //       enabled: true,
        //       alpha: {
        //         from: 1,
        //         to: 0,
        //         duration: 300,
        //       },
        //     },
        //   },
        // },
      },
    },
  })
}

export const showVersionModal = () => {
  const theme = themeState.theme

  void Navigation.showOverlay({
    component: {
      name: VERSION_MODAL,
      options: {
        layout: {
          componentBackgroundColor: 'transparent',
        },
        overlay: {
          interceptTouchOutside: true,
        },
        statusBar: {
          drawBehind: true,
          visible: true,
          style: getStatusBarStyle(theme.isDark),
          backgroundColor: 'transparent',
        },
        navigationBar: {
          // visible: false,
          backgroundColor: theme['c-content-background'],
        },
        // animations: {

        //   showModal: {
        //     enter: {
        //       enabled: true,
        //       alpha: {
        //         from: 0,
        //         to: 1,
        //         duration: 300,
        //       },
        //     },
        //     exit: {
        //       enabled: true,
        //       alpha: {
        //         from: 1,
        //         to: 0,
        //         duration: 300,
        //       },
        //     },
        //   },
        // },
      },
    },
  })
}

export const showSyncModeModal = () => {
  const theme = themeState.theme

  void Navigation.showOverlay({
    component: {
      name: SYNC_MODE_MODAL,
      options: {
        layout: {
          componentBackgroundColor: 'transparent',
        },
        overlay: {
          interceptTouchOutside: true,
        },
        statusBar: {
          drawBehind: true,
          visible: true,
          style: getStatusBarStyle(theme.isDark),
          backgroundColor: 'transparent',
        },
        navigationBar: {
          // visible: false,
          backgroundColor: theme['c-content-background'],
        },
        // animations: {

        //   showModal: {
        //     enter: {
        //       enabled: true,
        //       alpha: {
        //         from: 0,
        //         to: 1,
        //         duration: 300,
        //       },
        //     },
        //     exit: {
        //       enabled: true,
        //       alpha: {
        //         from: 1,
        //         to: 0,
        //         duration: 300,
        //       },
        //     },
        //   },
        // },
      },
    },
  })
}

export const showDownloadQualityModal = async(preferred: LX.Quality, qualityList: LX.Quality[]) => new Promise<LX.Quality | null>(resolve => {
  downloadQualityResolver?.(null)
  downloadQualityResolver = resolve
  const theme = themeState.theme

  void Navigation.showOverlay({
    component: {
      name: DOWNLOAD_QUALITY_MODAL,
      passProps: { preferred, qualityList },
      options: {
        layout: { componentBackgroundColor: 'transparent' },
        overlay: { interceptTouchOutside: true },
        statusBar: {
          drawBehind: true,
          visible: true,
          style: getStatusBarStyle(theme.isDark),
          backgroundColor: 'transparent',
        },
        navigationBar: { backgroundColor: theme['c-content-background'] },
      },
    },
  }).catch(() => {
    if (downloadQualityResolver == resolve) downloadQualityResolver = null
    resolve(null)
  })
})

export const resolveDownloadQualityModal = (quality: LX.Quality | null) => {
  const resolve = downloadQualityResolver
  downloadQualityResolver = null
  resolve?.(quality)
}

// export const showToast = (text) => {
//   Navigation.showOverlay({
//     component: {
//       name: TOAST_SCREEN,
//     },
//   })
// }
