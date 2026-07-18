import { memo, useRef } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'

import { IconMaterialCommunityIcons, type MaterialDesignIconName } from '@/components/common/Icon'
import Popup, { type PopupType } from '@/components/common/Popup'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle, openUrl } from '@/utils/tools'
import Section from '../components/Section'
import { setSpText } from '@/utils/pixelRatio'

const REPOSITORY_URL = 'https://github.com/hedroid/lx-music-mobile'
const UPSTREAM_URL = 'https://github.com/lyswhut/lx-music-mobile'

const InfoRow = ({ icon, title, description, onPress }: {
  icon: MaterialDesignIconName
  title: string
  description: string
  onPress: () => void
}) => {
  const theme = useTheme()

  return (
    <TouchableOpacity
      style={{ ...styles.infoRow, borderBottomColor: theme['c-border-background'] }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={{ ...styles.iconBox, backgroundColor: theme['c-primary-background-hover'] }}>
        <IconMaterialCommunityIcons name={icon} size={21} color={theme['c-primary-font']} />
      </View>
      <View style={styles.infoText}>
        <Text size={14}>{title}</Text>
        <Text style={styles.description} size={12} color={theme['c-font-label']}>
          {description}
        </Text>
      </View>
      <IconMaterialCommunityIcons name="chevron-right" size={22} color={theme['c-250']} />
    </TouchableOpacity>
  )
}

const PolicyPart = ({ title, children }: { title: string, children: string }) => {
  const theme = useTheme()
  return (
    <View style={styles.policyPart}>
      <Text style={styles.policyTitle} size={15}>{title}</Text>
      <Text style={styles.policyText} size={13} color={theme['c-font-label']}>{children}</Text>
    </View>
  )
}

const PolicyPopup = ({ popupRef, title, children }: {
  popupRef: React.RefObject<PopupType | null>
  title: string
  children: React.ReactNode
}) => (
  <Popup ref={popupRef} title={title} position="bottom" closeBtn={false} swipeToClose>
    <ScrollView
      style={styles.popupScroll}
      contentContainerStyle={styles.popupContent}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  </Popup>
)

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const privacyRef = useRef<PopupType>(null)
  const licenseRef = useRef<PopupType>(null)

  return (
    <Section title={t('setting_about')}>
      <View style={styles.content}>
        <View style={{ ...styles.disclaimer, backgroundColor: theme['c-primary-background-hover'] }}>
          <Text style={styles.disclaimerTitle} size={14}>{t('setting_about_disclaimer_title')}</Text>
          <Text style={styles.modifiedNotice} size={12} color={theme['c-font-label']}>
            {t('setting_about_modified_notice')}
          </Text>
          <Text style={styles.disclaimerText} size={12} color={theme['c-font-label']}>
            {t('setting_about_disclaimer')}
          </Text>
        </View>

        <InfoRow
          icon="github"
          title={t('setting_about_repository')}
          description={REPOSITORY_URL}
          onPress={() => { void openUrl(REPOSITORY_URL) }}
        />
        <InfoRow
          icon="source-fork"
          title={t('setting_about_upstream')}
          description={t('setting_about_upstream_desc')}
          onPress={() => { void openUrl(UPSTREAM_URL) }}
        />

        <View style={styles.policyList}>
          <InfoRow
            icon="shield-account-outline"
            title={t('setting_about_privacy')}
            description={t('setting_about_privacy_desc')}
            onPress={() => { privacyRef.current?.setVisible(true) }}
          />
          <InfoRow
            icon="license"
            title={t('setting_about_license')}
            description={t('setting_about_license_desc')}
            onPress={() => { licenseRef.current?.setVisible(true) }}
          />
        </View>
      </View>

      <PolicyPopup popupRef={privacyRef} title={t('setting_about_privacy')}>
        <Text style={styles.policyIntro} size={13}>{t('setting_about_privacy_intro')}</Text>
        <PolicyPart title={t('setting_about_privacy_local_title')}>
          {t('setting_about_privacy_local')}
        </PolicyPart>
        <PolicyPart title={t('setting_about_privacy_network_title')}>
          {t('setting_about_privacy_network')}
        </PolicyPart>
        <PolicyPart title={t('setting_about_privacy_permission_title')}>
          {t('setting_about_privacy_permission')}
        </PolicyPart>
        <PolicyPart title={t('setting_about_privacy_webdav_title')}>
          {t('setting_about_privacy_webdav')}
        </PolicyPart>
        <PolicyPart title={t('setting_about_privacy_control_title')}>
          {t('setting_about_privacy_control')}
        </PolicyPart>
      </PolicyPopup>

      <PolicyPopup popupRef={licenseRef} title={t('setting_about_license')}>
        <Text style={styles.policyIntro} size={13}>{t('setting_about_license_intro')}</Text>
        <PolicyPart title={t('setting_about_license_apache_title')}>
          {t('setting_about_license_apache')}
        </PolicyPart>
        <PolicyPart title={t('setting_about_license_upstream_title')}>
          {t('setting_about_license_upstream')}
        </PolicyPart>
        <PolicyPart title={t('setting_about_license_third_party_title')}>
          {t('setting_about_license_third_party')}
        </PolicyPart>
        <PolicyPart title={t('setting_about_license_warranty_title')}>
          {t('setting_about_license_warranty')}
        </PolicyPart>
        <TouchableOpacity style={styles.policyLink} onPress={() => { void openUrl(`${REPOSITORY_URL}/blob/master/LICENSE`) }}>
          <IconMaterialCommunityIcons name="open-in-new" size={17} color={theme['c-primary-font']} />
          <Text style={styles.policyLinkText} size={13} color={theme['c-primary-font']}>
            {t('setting_about_license_view_repository')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.policyLink} onPress={() => { void openUrl(`${UPSTREAM_URL}/blob/master/LICENSE`) }}>
          <IconMaterialCommunityIcons name="open-in-new" size={17} color={theme['c-primary-font']} />
          <Text style={styles.policyLinkText} size={13} color={theme['c-primary-font']}>
            {t('setting_about_license_view_upstream')}
          </Text>
        </TouchableOpacity>
      </PolicyPopup>
    </Section>
  )
})

const styles = createStyle({
  content: {
    marginHorizontal: 10,
  },
  infoRow: {
    minHeight: 66,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    paddingHorizontal: 11,
  },
  description: {
    marginTop: 3,
    lineHeight: setSpText(17),
  },
  modifiedNotice: {
    marginBottom: 8,
    lineHeight: setSpText(18),
  },
  disclaimer: {
    marginBottom: 12,
    marginHorizontal: 8,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 8,
  },
  disclaimerTitle: {
    marginBottom: 5,
  },
  disclaimerText: {
    lineHeight: setSpText(18),
  },
  policyList: {
    marginTop: 12,
  },
  popupScroll: {
    flexShrink: 1,
  },
  popupContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  policyIntro: {
    marginBottom: 18,
    lineHeight: setSpText(20),
  },
  policyPart: {
    marginBottom: 18,
  },
  policyTitle: {
    marginBottom: 6,
  },
  policyText: {
    lineHeight: setSpText(20),
  },
  policyLink: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
  },
  policyLinkText: {
    marginLeft: 8,
  },
})
