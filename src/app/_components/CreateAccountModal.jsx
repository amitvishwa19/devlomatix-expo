import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useCrm } from '~/providers/CrmProvider';
import * as crmService from '~/services/crm';
import { useCrmTheme } from '~/utils/crm/colors';

const INDUSTRIES = ['Technology', 'E-Commerce', 'Healthcare', 'Finance', 'Education', 'Real Estate', 'Manufacturing', 'Agency', 'Other'];
const SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];
const RATINGS = ['HOT', 'WARM', 'COLD'];

function Field({ label, children }) {
  const { colors } = useCrmTheme();
  return (
    <View className="mb-2.5">
      <Text className="text-[11px] font-bold mb-1" style={{ color: colors.text }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function ChipRow({ options, value, onChange }) {
  const { colors } = useCrmTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
      {options.map((option) => {
        const selected = value === option;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            className="mr-1.5 rounded-xl border px-3 py-1.5 active:opacity-80"
            style={{
              backgroundColor: selected ? colors.primary : colors.cardAlt,
              borderColor: selected ? colors.primary : colors.border,
            }}
          >
            <Text className="text-[11px] font-semibold" style={{ color: selected ? '#ffffff' : colors.text }}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export default function CreateAccountModal({ visible, onClose, onCreated }) {
  const insets = useSafeAreaInsets();
  const { colors } = useCrmTheme();
  const { workspaceId, refreshAll } = useCrm();

  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [size, setSize] = useState('11-50');
  const [rating, setRating] = useState('WARM');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const reset = () => {
    setName('');
    setDomain('');
    setIndustry('Technology');
    setSize('11-50');
    setRating('WARM');
    setPhone('');
    setEmail('');
    setWebsite('');
    setCity('');
    setAnnualRevenue('');
    setError(null);
  };

  const close = () => {
    if (submitting) return;
    onClose?.();
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!name.trim()) {
      setError('Company name is required.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await crmService.createAccount(
        {
          name: name.trim(),
          domain: domain.trim() || undefined,
          industry,
          size,
          rating,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          website: website.trim() || undefined,
          city: city.trim() || undefined,
          annualRevenue: annualRevenue.replace(/,/g, '').trim() || undefined,
        },
        { workspaceId }
      );
      if (!res?.success) throw new Error(res?.error || 'Failed to create company');
      reset();
      onClose?.();
      await refreshAll();
      onCreated?.(res.data);
      Toast.show({ type: 'success', text1: 'Company added', text2: name.trim() });
    } catch (err) {
      setError(err?.message || 'Failed to create company');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    color: colors.text,
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
        <Pressable className="flex-1" onPress={close} />

        <View
          className="max-h-[88%] rounded-t-3xl p-4 border-t"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            paddingBottom: Math.max(insets.bottom + 18, 36),
          }}
        >
          <View className="flex-row items-center justify-between border-b pb-3" style={{ borderColor: colors.border }}>
            <View className="flex-row items-center gap-x-2.5">
              <View className="h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: colors.primary }}>
                <Ionicons name="business" size={16} color="#ffffff" />
              </View>
              <View>
                <Text className="text-sm font-bold" style={{ color: colors.text }}>
                  Add Company
                </Text>
                <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                  B2B organization profile
                </Text>
              </View>
            </View>

            <Pressable
              onPress={close}
              disabled={submitting}
              className="h-8 w-8 items-center justify-center rounded-full border"
              style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
            >
              <Ionicons name="close" size={16} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-2.5 p-1">
            <Field label="Company Name *">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Acme Global Pvt Ltd"
                placeholderTextColor={colors.inputPlaceholder}
                className="rounded-xl border px-3.5 py-3 text-xs min-h-[46px]"
                style={inputStyle}
              />
            </Field>

            <Field label="Domain / Website">
              <TextInput
                value={domain}
                onChangeText={setDomain}
                autoCapitalize="none"
                placeholder="acme.com"
                placeholderTextColor={colors.inputPlaceholder}
                className="rounded-xl border px-3.5 py-3 text-xs min-h-[46px]"
                style={inputStyle}
              />
            </Field>

            <Field label="Industry">
              <ChipRow options={INDUSTRIES} value={industry} onChange={setIndustry} />
            </Field>

            <Field label="Company Size">
              <ChipRow options={SIZES} value={size} onChange={setSize} />
            </Field>

            <Field label="Account Rating">
              <ChipRow options={RATINGS} value={rating} onChange={setRating} />
            </Field>

            <View className="flex-row gap-x-2">
              <View className="flex-1">
                <Field label="Phone">
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder="+91 98765 43210"
                    placeholderTextColor={colors.inputPlaceholder}
                    className="rounded-xl border px-3.5 py-3 text-xs min-h-[46px]"
                    style={inputStyle}
                  />
                </Field>
              </View>
              <View className="flex-1">
                <Field label="City">
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="Mumbai"
                    placeholderTextColor={colors.inputPlaceholder}
                    className="rounded-xl border px-3.5 py-3 text-xs min-h-[46px]"
                    style={inputStyle}
                  />
                </Field>
              </View>
            </View>

            <Field label="Email">
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="hello@acme.com"
                placeholderTextColor={colors.inputPlaceholder}
                className="rounded-xl border px-3.5 py-3 text-xs min-h-[46px]"
                style={inputStyle}
              />
            </Field>

            <Field label="Annual Revenue (₹)">
              <TextInput
                value={annualRevenue}
                onChangeText={setAnnualRevenue}
                keyboardType="numeric"
                placeholder="e.g. 5000000"
                placeholderTextColor={colors.inputPlaceholder}
                className="rounded-xl border px-3.5 py-3 text-xs min-h-[46px]"
                style={inputStyle}
              />
            </Field>

            {error && (
              <View
                className="mb-2.5 rounded-xl p-2.5 border"
                style={{ backgroundColor: colors.dangerSoft, borderColor: colors.dangerBorder }}
              >
                <Text className="text-xs font-bold text-center" style={{ color: colors.danger }}>
                  {error}
                </Text>
              </View>
            )}
          </ScrollView>

          <Pressable
            onPress={handleSubmit}
            disabled={submitting || !name.trim()}
            className="mt-3 flex-row items-center justify-center gap-x-2 rounded-xl py-3 active:opacity-80"
            style={{
              backgroundColor: colors.primary,
              opacity: submitting || !name.trim() ? 0.5 : 1,
            }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="business" size={17} color="#ffffff" />
                <Text className="text-xs font-bold text-white">Save Company</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
