import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import {
  BackHandler,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useAppTheme } from '~/theme/AppTheme';
import { isLoggedIn } from '~/utils/authStorage';

const PRIVACY_SECTIONS = [
  {
    id: '1',
    number: '01',
    title: 'Information We Collect',
    summary: 'Personal identification, account metadata, and usage telemetry',
    content:
      'We collect personal and business information that you provide when creating an account, including name, email address, phone number, company profile, and billing information. Additionally, we automatically collect technical data such as IP address, device type, operating system, and interaction telemetry to monitor and improve system stability.',
  },
  {
    id: '2',
    number: '02',
    title: 'How We Use Your Data',
    summary: 'Delivering CRM workflows, communication pipelines, and security',
    content:
      'We process customer information solely to: (a) provide and enhance Devlomatix platform features and integrations; (b) authenticate user sessions and prevent unauthorized access; (c) facilitate transactional communication, campaign dispatch, and team collaboration; and (d) comply with statutory legal and regulatory obligations.',
  },
  {
    id: '3',
    number: '03',
    title: 'Data Sharing & Third-Party Services',
    summary: 'Strict zero-sale policy; shared only with vetted infrastructure',
    content:
      'Devlomatix does not sell, lease, or monetize customer data. We only share information with trusted third-party service providers (such as cloud hosting, payment gateways, and official messaging API partners like Meta WhatsApp Cloud API) strictly necessary to deliver Services under strict confidentiality agreements.',
  },
  {
    id: '4',
    number: '04',
    title: 'Data Protection & Encryption',
    summary: 'Industry-standard encryption at rest and in transit',
    content:
      'We utilize enterprise-grade security protocols, including 256-bit AES encryption at rest and TLS/SSL encryption for all data in transit. Role-based access control (RBAC), multi-factor verification, and periodic vulnerability audits protect tenant data against unauthorized exposure.',
  },
  {
    id: '5',
    number: '05',
    title: 'Data Retention & Purging',
    summary: 'Configurable retention lifespans and permanent deletion',
    content:
      'Customer data is retained for the duration of your active subscription and as required by tax and legal record-keeping statutes. Workspace administrators can request or configure automated data purging schedules. Upon account termination, all tenant records are permanently expunged according to our retention timeline.',
  },
  {
    id: '6',
    number: '06',
    title: 'Your Privacy Rights',
    summary: 'Access, rectifications, portability, and consent withdrawal',
    content:
      'You hold full sovereignty over your personal data. You have the right to inspect, update, or rectify your information at any time, export your organization records in standard machine-readable formats, or request complete account erasure by contacting our compliance desk.',
  },
  {
    id: '7',
    number: '07',
    title: 'Compliance with Indian DPDP Act & Global Standards',
    summary: 'Adherence to Digital Personal Data Protection Act 2023 & GDPR principles',
    content:
      'Devlomatix operates in full compliance with the Digital Personal Data Protection (DPDP) Act, 2023, the Information Technology Act, 2000, and incorporates international privacy principles (including GDPR-grade data portability and privacy-by-design architecture).',
  },
  {
    id: '8',
    number: '08',
    title: 'Children’s Privacy',
    summary: 'Business platform exclusively for individuals 18 years and older',
    content:
      'Devlomatix platform is designed exclusively for enterprise and business management purposes. We do not knowingly solicit or collect personal information from individuals under the age of 18. If discovered, such data is promptly deleted.',
  },
  {
    id: '9',
    number: '09',
    title: 'Changes to This Privacy Policy',
    summary: 'Advance notice of material updates to data practices',
    content:
      'We may update this policy periodically to align with product changes or new statutory guidance. We will notify you of material changes by sending an in-app banner or email notification before changes take effect.',
  },
  {
    id: '10',
    number: '10',
    title: 'Contact Our Data Protection Officer (DPO)',
    summary: 'Direct grievance redressal and privacy support channel',
    content:
      'If you have inquiries, complaints, or data subject requests regarding this Privacy Policy, please contact our Data Protection Officer at privacy@devlomatix.com or support@devlomatix.com.',
  },
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { palette, themeMode } = useAppTheme();
  const isDark = themeMode === 'dark';

  const bgColor = isDark ? '#020617' : '#f8fafc';
  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const headerBg = isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const textColor = isDark ? '#cbd5e1' : '#334155';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const accentColor = '#2563eb';
  const accentSoft = isDark ? 'rgba(37,99,235,0.18)' : 'rgba(37,99,235,0.08)';

  const handleBack = useCallback(async () => {
    if (router.canGoBack()) {
      router.back();
      return true;
    }
    const logged = await isLoggedIn().catch(() => false);
    if (logged) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
    return true;
  }, [router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [handleBack]);

  return (
    <AppScreen edges={['top', 'left', 'right']}>

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: cardBorder,
          backgroundColor: headerBg,
        }}>
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
          }}>
          <Ionicons name="arrow-back" size={20} color={titleColor} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: titleColor }}>
            Privacy Policy
          </Text>
          <Text style={{ fontSize: 11, color: mutedColor, marginTop: 1 }}>
            Devlomatix Solutions
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(misc)/terms-conditions')}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 12,
            backgroundColor: accentSoft,
          }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: accentColor }}>
            Terms
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {/* Hero Card */}
        <View
          style={{
            backgroundColor: cardBg,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: cardBorder,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: accentSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Feather name="shield" size={20} color={accentColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: titleColor }}>
                Privacy & Data Governance
              </Text>
              <Text style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>
                Effective Date: October 2026
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 13, lineHeight: 20, color: textColor }}>
            At Devlomatix Solutions, we are committed to safeguarding your privacy and ensuring your
            organizational data remains secure, compliant, and under your complete control.
          </Text>

          {/* Highlights */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {['DPDP 2023 Compliant', 'Zero Data Selling', '256-Bit TLS/SSL', 'GDPR Ready'].map((badge, i) => (
              <View
                key={i}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: mutedColor }}>
                  {badge}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section List */}
        {PRIVACY_SECTIONS.map((sec) => (
          <View
            key={sec.id}
            style={{
              backgroundColor: cardBg,
              borderRadius: 14,
              padding: 14,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: cardBorder,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <View
                style={{
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  borderRadius: 6,
                  backgroundColor: accentSoft,
                }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: accentColor }}>
                  {sec.number}
                </Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: titleColor, flex: 1 }}>
                {sec.title}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 11,
                fontWeight: '500',
                color: mutedColor,
                marginBottom: 8,
              }}>
              {sec.summary}
            </Text>

            <Text style={{ fontSize: 12.5, lineHeight: 19, color: textColor }}>
              {sec.content}
            </Text>
          </View>
        ))}

        {/* Bottom Support Callout */}
        <View
          style={{
            backgroundColor: cardBg,
            borderRadius: 16,
            padding: 16,
            marginTop: 6,
            borderWidth: 1,
            borderColor: cardBorder,
            alignItems: 'center',
          }}>
          <Feather name="lock" size={24} color={accentColor} style={{ marginBottom: 8 }} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: titleColor, textAlign: 'center' }}>
            Data Privacy & DPO Inquiries
          </Text>
          <Text
            style={{
              fontSize: 12,
              lineHeight: 18,
              color: mutedColor,
              textAlign: 'center',
              marginTop: 4,
              marginBottom: 12,
            }}>
            For data subject requests, export archives, or privacy questions, reach our team directly.
          </Text>

          <TouchableOpacity
            onPress={() => Linking.openURL('mailto:privacy@devlomatix.com')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: accentColor,
            }}>
            <Feather name="mail" size={14} color="#ffffff" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#ffffff' }}>
              privacy@devlomatix.com
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
