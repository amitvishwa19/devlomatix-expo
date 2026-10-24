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

const TERMS_SECTIONS = [
  {
    id: '1',
    number: '01',
    title: 'Acceptance of Terms',
    summary: 'Agreement to legal terms governing usage of Devlomatix',
    content:
      'By accessing or using Devlomatix platform, applications, APIs, and associated services ("Services"), you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a company or other legal entity, you represent that you have the authority to bind such entity to these terms.',
  },
  {
    id: '2',
    number: '02',
    title: 'User Accounts & Security',
    summary: 'Credentials, multi-factor security, and responsibilities',
    content:
      'To access our Services, you must create and maintain an authorized account. You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to notify Devlomatix immediately of any unauthorized use or security breach.',
  },
  {
    id: '3',
    number: '03',
    title: 'Acceptable Use Policy',
    summary: 'Guidelines on lawful and permitted use of the platform',
    content:
      'You agree to use Devlomatix solely for lawful business purposes. You shall not: (a) reverse engineer, decompile, or disassemble any portion of the software; (b) distribute spam, malware, or malicious payloads; (c) attempt unauthorized access to other tenant systems or networks; (d) use the Services to violate applicable consumer privacy or communication regulations.',
  },
  {
    id: '4',
    number: '04',
    title: 'Data Ownership & Confidentiality',
    summary: 'Customer data remains strictly yours with end-to-end encryption',
    content:
      'You retain all rights, title, and interest in and to your customer data, messages, and contact lists uploaded to Devlomatix. Devlomatix will maintain reasonable and appropriate administrative, physical, and technical safeguards designed to protect the security, confidentiality, and integrity of your data.',
  },
  {
    id: '5',
    number: '05',
    title: 'Subscription & Billing Terms',
    summary: 'Invoicing, recurring charges, and refund policies',
    content:
      'Certain features and modules are provided under subscription plans. Fees are billed in advance on a recurring monthly or annual basis depending on your selected tier. All payment obligations are non-cancelable and fees paid are non-refundable except as expressly provided in an enterprise service order.',
  },
  {
    id: '6',
    number: '06',
    title: 'Platform Availability & SLA',
    summary: 'High availability target and scheduled maintenance windows',
    content:
      'We strive to maintain an uptime availability of 99.9% for core services. Occasional downtime may occur for emergency security patches or scheduled maintenance. Wherever possible, scheduled maintenance will be communicated in advance via service banners and email notifications.',
  },
  {
    id: '7',
    number: '07',
    title: 'Third-Party Integrations',
    summary: 'Google, Meta, WhatsApp, and connected external APIs',
    content:
      'Our Services may integrate with third-party tools (such as WhatsApp Cloud API, Google Services, and payment gateways). Your use of third-party platforms is governed by their respective terms and privacy policies. Devlomatix is not responsible for any downtime or changes implemented by third-party providers.',
  },
  {
    id: '8',
    number: '08',
    title: 'Limitation of Liability',
    summary: 'Standard enterprise limitation and disclaimer of warranties',
    content:
      'To the maximum extent permitted by applicable law, Devlomatix and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, use, or goodwill arising out of or related to your use of the Services.',
  },
  {
    id: '9',
    number: '09',
    title: 'Account Termination & Suspension',
    summary: 'Conditions under which accounts may be paused or closed',
    content:
      'We reserve the right to suspend or terminate your account upon written notice if you materially breach these Terms and fail to cure such breach within 14 days, or immediately in the event of fraudulent, abusive, or illegal conduct.',
  },
  {
    id: '10',
    number: '10',
    title: 'Governing Law & Dispute Resolution',
    summary: 'Jurisdiction and applicable statutory governing legal framework',
    content:
      'These Terms shall be governed by and construed in accordance with the laws of India. Any dispute arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts located in India.',
  },
  {
    id: '11',
    number: '11',
    title: 'Modifications to Terms',
    summary: 'Periodic updates and notification of significant amendments',
    content:
      'Devlomatix may update these Terms periodically to reflect evolving legal, regulatory, or product requirements. We will notify you of material changes by posting an update in the app or via email. Your continued use of the Services signifies your acceptance of the updated Terms.',
  },
  {
    id: '12',
    number: '12',
    title: 'Contact Information',
    summary: 'Direct channel for legal inquiries and compliance requests',
    content:
      'If you have any questions or concerns regarding these Terms of Service, please reach out to our legal and compliance department at support@devlomatix.com or via Devlomatix Solutions support desk.',
  },
];

export default function TermsConditionsScreen() {
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
            Terms & Conditions
          </Text>
          <Text style={{ fontSize: 11, color: mutedColor, marginTop: 1 }}>
            Devlomatix Solutions
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(misc)/privacy-policy')}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 12,
            backgroundColor: accentSoft,
          }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: accentColor }}>
            Privacy
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
              <Feather name="file-text" size={20} color={accentColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: titleColor }}>
                Devlomatix Terms of Service
              </Text>
              <Text style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>
                Effective Date: October 2026
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 13, lineHeight: 20, color: textColor }}>
            These Terms of Service govern your relationship with Devlomatix Solutions and your access
            to our enterprise CRM, messaging suites, and workflow automation platforms.
          </Text>

          {/* Quick tags */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {['Enterprise SLA', 'Data Protection', 'GDPR / DPDP Ready', 'Fair Use'].map((tag, i) => (
              <View
                key={i}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: mutedColor }}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section List */}
        {TERMS_SECTIONS.map((sec) => (
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
          <Feather name="shield" size={24} color={accentColor} style={{ marginBottom: 8 }} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: titleColor, textAlign: 'center' }}>
            Questions About Our Terms?
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
            Our legal and compliance team is available to assist you with any questions.
          </Text>

          <TouchableOpacity
            onPress={() => Linking.openURL('mailto:support@devlomatix.com')}
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
              support@devlomatix.com
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
