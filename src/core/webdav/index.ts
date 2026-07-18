import settingState from '@/store/setting/state'
import { createFullBackup, isFullBackup, restoreFullBackup } from '@/core/backup'

interface WebDAVConfig {
  url: string
  username: string
  password: string
  path: string
}

const getBackupFileName = (value: string) => {
  const fileName = value.trim().split('/').pop()?.replace(/[\\:*?"<>|]/g, '_')
  // Empty input should fall back too, not only null or undefined.
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  return fileName || 'backup.json'
}

const getConfig = (): WebDAVConfig => ({
  url: settingState.setting['sync.webdav.url'].trim().replace(/\/+$/, ''),
  username: settingState.setting['sync.webdav.username'],
  password: settingState.setting['sync.webdav.password'],
  path: `lx-music/${getBackupFileName(settingState.setting['sync.webdav.path'])}`,
})

const validateConfig = (config: WebDAVConfig) => {
  if (!/^https?:\/\//i.test(config.url)) throw new Error(global.i18n.t('setting_webdav_invalid_url'))
}

const getHeaders = (config: WebDAVConfig, headers?: Record<string, string>) => ({
  Authorization: `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`,
  ...headers,
})

const buildUrl = (config: WebDAVConfig, path: string | null = config.path) => {
  if (!path) return config.url
  return `${config.url}/${path.split('/').map(encodeURIComponent).join('/')}`
}

const request = async(config: WebDAVConfig, method: string, path?: string | null, body?: string) => {
  const response = await fetch(buildUrl(config, path), {
    method,
    headers: getHeaders(config, {
      ...(method == 'PROPFIND' ? { Depth: '0' } : {}),
      ...(body == null ? {} : { 'Content-Type': 'application/json; charset=utf-8' }),
    }),
    body,
  })
  if (!response.ok && !(method == 'MKCOL' && response.status == 405)) {
    throw new Error(`WebDAV HTTP ${response.status}`)
  }
  return response
}

const ensureDirectories = async(config: WebDAVConfig) => {
  const parts = config.path.split('/').slice(0, -1)
  let current = ''
  for (const part of parts) {
    current = current ? `${current}/${part}` : part
    await request(config, 'MKCOL', current)
  }
}

export const testWebDAV = async() => {
  const config = getConfig()
  validateConfig(config)
  await ensureDirectories(config)
  await request(config, 'PROPFIND', config.path.split('/').slice(0, -1).join('/') || null)
}

export const backupToWebDAV = async() => {
  const config = getConfig()
  validateConfig(config)
  await ensureDirectories(config)
  const data = await createFullBackup()
  await request(config, 'PUT', undefined, JSON.stringify(data))
}

export const restoreFromWebDAV = async() => {
  const config = getConfig()
  validateConfig(config)
  const response = await request(config, 'GET')
  const data: unknown = await response.json()
  if (!isFullBackup(data)) throw new Error(global.i18n.t('setting_webdav_invalid_backup'))
  return restoreFullBackup(data)
}
