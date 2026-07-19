import { updateSetting } from '@/core/common'
import { copyFile, existsFile, extname, privateStorageDirectoryPath, unlink } from '@/utils/fs'
import { registerCustomFont } from '@/utils/nativeModules/utils'

const CUSTOM_FONT_FAMILY = 'LXCustomFont'
const CUSTOM_FONT_BASENAME = 'custom-ui-font'

const getTargetPath = (extension: string) => `${privateStorageDirectoryPath}/${CUSTOM_FONT_BASENAME}.${extension}`

const removeStoredFonts = async() => {
  await Promise.all(['ttf', 'otf'].map(async extension => {
    const path = getTargetPath(extension)
    if (await existsFile(path)) await unlink(path)
  }))
}

export const initCustomFont = async(setting: LX.AppSetting) => {
  const fontFamily = setting['common.fontFamily']
  const path = setting['common.customFontPath']
  if (fontFamily && fontFamily != CUSTOM_FONT_FAMILY) {
    global.lx.customFontFamily = fontFamily
    return true
  }
  if (!path || !await existsFile(path)) {
    global.lx.customFontFamily = null
    return false
  }

  try {
    await registerCustomFont(path)
    global.lx.customFontFamily = CUSTOM_FONT_FAMILY
    return true
  } catch {
    global.lx.customFontFamily = null
    return false
  }
}

export const installCustomFont = async(sourcePath: string, originalName: string) => {
  const extension = extname(originalName).toLowerCase()
  if (extension != 'ttf' && extension != 'otf') throw new Error('Unsupported font format')

  // Validate the selected file before replacing the currently stored font.
  await registerCustomFont(sourcePath)
  await removeStoredFonts()
  const targetPath = getTargetPath(extension)
  await copyFile(sourcePath, targetPath)
  await registerCustomFont(targetPath)
  global.lx.customFontFamily = CUSTOM_FONT_FAMILY
  updateSetting({
    'common.customFontPath': targetPath,
    'common.customFontName': originalName,
    'common.fontFamily': CUSTOM_FONT_FAMILY,
  })
}

export const setSystemFont = async(fontFamily: string) => {
  await removeStoredFonts()
  global.lx.customFontFamily = null
  if (fontFamily) global.lx.customFontFamily = fontFamily
  updateSetting({
    'common.customFontPath': '',
    'common.customFontName': '',
    'common.fontFamily': fontFamily,
  })
}

export const resetCustomFont = async() => setSystemFont('')
