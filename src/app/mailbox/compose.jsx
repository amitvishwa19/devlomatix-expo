import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import AppScreen from '~/components/AppScreen';
import { getContacts, getDeals, askCopilotChat } from '~/services/crm';
import { getMailboxThreads, sendMailboxEmail } from '~/services/mailbox';
import { useCrmTheme } from '~/utils/crm/colors';

let HapticsModule = null;
try {
    HapticsModule = require('expo-haptics');
} catch (_) { }

export default function MailboxComposeScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, isDark } = useCrmTheme();

    // Route params for prefill (e.g. from thread reply or contact card)
    const [threadId, setThreadId] = useState(params.threadId || null);
    const [contactId, setContactId] = useState(params.contactId || null);
    const [dealId, setDealId] = useState(params.dealId || null);

    // Sender Identity
    const [selectedFromEmail, setSelectedFromEmail] = useState(params.fromEmail || '');
    const [mailboxes, setMailboxes] = useState([]);

    // Form Fields
    const [toInput, setToInput] = useState(params.to || '');
    const [toRecipients, setToRecipients] = useState(params.to ? [params.to] : []);
    const [showCcBcc, setShowCcBcc] = useState(false);
    const [ccInput, setCcInput] = useState('');
    const [bccInput, setBccInput] = useState('');
    const [subject, setSubject] = useState(params.subject || '');
    const [bodyText, setBodyText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [isAiGenerating, setIsAiGenerating] = useState(false);

    // Autocomplete data
    const [contacts, setContacts] = useState([]);
    const [deals, setDeals] = useState([]);
    const [isSearchingContact, setIsSearchingContact] = useState(false);

    // Load CRM contacts, deals, and authorized mailboxes
    useEffect(() => {
        let isMounted = true;
        async function loadData() {
            try {
                const [contactsRes, dealsRes, threadsRes] = await Promise.all([
                    getContacts({ limit: 100 }),
                    getDeals({ limit: 50 }),
                    getMailboxThreads({ limit: 1 }),
                ]);
                if (!isMounted) return;
                if (contactsRes.success && Array.isArray(contactsRes.data)) {
                    setContacts(contactsRes.data.filter((c) => !!c.email));
                }
                if (dealsRes.success && Array.isArray(dealsRes.data)) {
                    setDeals(dealsRes.data);
                }
                if (threadsRes.success && Array.isArray(threadsRes.mailboxes)) {
                    const validBoxes = threadsRes.mailboxes.filter(
                        (m) => m && m.email && m.email !== 'ALL' && m.id !== 'all' && m.type !== 'ALL'
                    );
                    setMailboxes(validBoxes);
                    if (params.fromEmail) {
                        const matched = validBoxes.find(
                            (m) => m.email.toLowerCase() === String(params.fromEmail).trim().toLowerCase()
                        );
                        if (matched) {
                            setSelectedFromEmail(matched.email);
                        } else {
                            setSelectedFromEmail(String(params.fromEmail));
                        }
                    } else if (validBoxes.length > 0) {
                        const defaultBox =
                            validBoxes.find((m) => m.isPrimary || m.type === 'PERSONAL') || validBoxes[0];
                        setSelectedFromEmail(defaultBox.email);
                    }
                }
            } catch (err) {
                console.warn('[COMPOSE_DATA_LOAD_WARN]', err);
            }
        }
        loadData();
        return () => {
            isMounted = false;
        };
    }, []);

    // Filtered contacts matching `toInput`
    const matchingContacts = useMemo(() => {
        if (!toInput.trim() || !isSearchingContact) return [];
        const query = toInput.toLowerCase().trim();
        return contacts
            .filter(
                (c) =>
                    c.email?.toLowerCase().includes(query) ||
                    c.name?.toLowerCase().includes(query)
            )
            .slice(0, 5);
    }, [toInput, contacts, isSearchingContact]);

    // Handle contact selection from autocomplete
    const handleSelectContact = (contact) => {
        if (!contact?.email) return;
        if (!toRecipients.includes(contact.email)) {
            setToRecipients((prev) => [...prev, contact.email]);
        }
        setContactId(contact.id);
        setToInput('');
        setIsSearchingContact(false);
    };

    // Add custom typed email address
    const handleAddEmail = () => {
        const raw = toInput.trim().replace(/,/g, '');
        if (raw && !toRecipients.includes(raw)) {
            setToRecipients((prev) => [...prev, raw]);
            setToInput('');
            setIsSearchingContact(false);
        }
    };

    // Remove recipient pill
    const handleRemoveRecipient = (emailToRemove) => {
        setToRecipients((prev) => prev.filter((e) => e !== emailToRemove));
        if (contactId) {
            const remainingContact = contacts.find((c) =>
                toRecipients.filter((e) => e !== emailToRemove).includes(c.email)
            );
            if (!remainingContact) setContactId(null);
        }
    };

    // Pick attachment from gallery
    const handlePickAttachment = async () => {
        try {
            const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
                base64: true,
            });

            if (!res.canceled && res.assets && res.assets.length > 0) {
                const asset = res.assets[0];
                const newAtt = {
                    filename: asset.fileName || `attachment_${Date.now()}.jpg`,
                    content: asset.base64,
                    uri: asset.uri,
                    size: asset.fileSize ? `${Math.round(asset.fileSize / 1024)} KB` : '',
                };
                setAttachments((prev) => [...prev, newAtt]);
                try {
                    HapticsModule?.selectionAsync?.();
                } catch (_) { }
            }
        } catch (err) {
            Toast.show({
                type: 'error',
                text1: 'Attachment Error',
                text2: err.message,
            });
        }
    };

    // Take photo with camera
    const handleTakePhoto = async () => {
        try {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
                Toast.show({
                    type: 'error',
                    text1: 'Camera Permission',
                    text2: 'Camera access is required to take photo attachments.',
                });
                return;
            }
            const res = await ImagePicker.launchCameraAsync({
                quality: 0.8,
                base64: true,
            });

            if (!res.canceled && res.assets && res.assets.length > 0) {
                const asset = res.assets[0];
                const newAtt = {
                    filename: `photo_${Date.now()}.jpg`,
                    content: asset.base64,
                    uri: asset.uri,
                    size: asset.fileSize ? `${Math.round(asset.fileSize / 1024)} KB` : '',
                };
                setAttachments((prev) => [...prev, newAtt]);
            }
        } catch (err) {
            console.warn(err);
        }
    };

    const handleRemoveAttachment = (idx) => {
        setAttachments((prev) => prev.filter((_, i) => i !== idx));
    };

    // AI Copilot Email Draft
    const handleAiDraftEmail = async () => {
        setIsAiGenerating(true);
        try {
            HapticsModule?.impactAsync?.(HapticsModule.ImpactFeedbackStyle?.Light);
            const recipient = toRecipients[0] || toInput || 'Client';
            const prompt = `Draft a concise, professional business email from a sales representative to ${recipient}.
Subject context: "${subject || 'Business follow-up & collaboration'}".
Write only the email body without placeholders.`;

            const res = await askCopilotChat(prompt);
            let replyContent = '';
            if (res.success && res.data) {
                replyContent = typeof res.data === 'string' ? res.data : (res.data?.reply || res.data?.message || res.data?.content || '');
            }
            if (replyContent) {
                replyContent = replyContent.replace(/^```[\w]*\n/, '').replace(/\n```$/, '').trim();
                setBodyText(replyContent);
                Toast.show({
                    type: 'success',
                    text1: '✨ AI Draft Generated',
                    text2: 'Review and customize as needed.',
                });
            } else {
                setBodyText(`Dear ${recipient},\n\nI hope this email finds you well. I am reaching out regarding our services and how we can best support your upcoming initiatives.\n\nPlease let me know if you are open to a brief call this week.\n\nBest regards,\nDevlomatix Sales Team`);
            }
        } catch (_) {
            setBodyText(`Dear ${toRecipients[0] || 'Client'},\n\nI hope this email finds you well. Following up on our recent discussion to see if you have any questions.\n\nBest regards,\nDevlomatix Sales Team`);
        } finally {
            setIsAiGenerating(false);
        }
    };
    const handleSend = async () => {
        const allRecipients = [...toRecipients];
        if (toInput.trim()) {
            allRecipients.push(toInput.trim().replace(/,/g, ''));
        }

        if (allRecipients.length === 0) {
            Toast.show({
                type: 'error',
                text1: 'Recipient Required',
                text2: 'Please add at least one recipient email in the "To" field.',
            });
            return;
        }

        if (!subject.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Subject Required',
                text2: 'Please enter a subject for this email.',
            });
            return;
        }

        if (!bodyText.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Body Required',
                text2: 'Please enter a message to send.',
            });
            return;
        }

        setIsSending(true);

        try {
            HapticsModule?.impactAsync?.(HapticsModule.ImpactFeedbackStyle.Medium);

            const ccList = ccInput
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
            const bccList = bccInput
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);

            const htmlBody = `<div>${bodyText.replace(/\n/g, '<br/>')}</div>`;

            const res = await sendMailboxEmail({
                threadId: threadId || undefined,
                contactId: contactId || undefined,
                dealId: dealId || undefined,
                fromEmail: selectedFromEmail && selectedFromEmail !== 'ALL' ? selectedFromEmail : undefined,
                to: allRecipients,
                cc: ccList.length > 0 ? ccList : undefined,
                bcc: bccList.length > 0 ? bccList : undefined,
                subject: subject.trim(),
                bodyText: bodyText.trim(),
                bodyHtml: htmlBody,
                attachments: attachments.map((a) => ({
                    filename: a.filename,
                    content: a.content,
                })),
            });

            if (res.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Email Sent',
                    text2: `Message delivered to ${allRecipients[0]}${allRecipients.length > 1 ? ` +${allRecipients.length - 1} more` : ''}`,
                });
                HapticsModule?.notificationAsync?.(HapticsModule.NotificationFeedbackType.Success);
                router.back();
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Send Failed',
                    text2: res.error || 'Could not send email',
                });
            }
        } catch (err) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.message || 'Something went wrong',
            });
        } finally {
            setIsSending(false);
        }
    };

    const selectedContact = contacts.find((c) => c.id === contactId);
    const selectedDeal = deals.find((d) => d.id === dealId);

    return (
        <AppScreen safeArea="none" className="flex-1" style={{ backgroundColor: colors.background }}>
            {/* Top Modal Header Bar */}
            <View
                className="px-4 pb-3 border-b flex-row items-center justify-between"
                style={{
                    paddingTop: Platform.OS === 'ios' ? 16 : 12,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                }}
            >
                <Pressable
                    onPress={() => router.back()}
                    hitSlop={10}
                    className="h-8 w-8 items-center justify-center rounded-xl border active:opacity-70"
                    style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
                >
                    <Ionicons name="close" size={18} color={colors.text} />
                </Pressable>

                <View className="items-center">
                    <Text className="text-[15px] font-bold tracking-tight" style={{ color: colors.text }}>
                        {threadId ? 'Reply Email' : 'New Email'}
                    </Text>
                    <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
                        Outbound Mail
                    </Text>
                </View>

                {/* Send Action Button */}
                <Pressable
                    onPress={handleSend}
                    disabled={isSending}
                    className="h-8 px-3 flex-row items-center gap-1.5 rounded-xl shadow-xs active:opacity-75"
                    style={{
                        backgroundColor: colors.primary,
                        opacity: isSending ? 0.7 : 1,
                    }}
                >
                    {isSending ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <>
                            <Ionicons name="send" size={14} color="#ffffff" />
                            <Text className="text-xs font-bold text-white">Send</Text>
                        </>
                    )}
                </Pressable>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Send As / From Field (Org Mailboxes Selector) */}
                    {mailboxes.length > 0 && (
                        <View
                            className="mb-2.5 rounded-2xl border p-2.5"
                            style={{ backgroundColor: colors.card, borderColor: colors.border }}
                        >
                            <View className="flex-row items-center justify-between mb-1.5">
                                <View className="flex-row items-center gap-1.5">
                                    <Ionicons name="mail-outline" size={13} color={colors.primary} />
                                    <Text className="text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                                        Send As (From)
                                    </Text>
                                </View>
                                <Text className="text-[10px] font-medium" style={{ color: colors.primary }}>
                                    {mailboxes.find((m) => m.email === selectedFromEmail)?.postTitle ||
                                        mailboxes.find((m) => m.email === selectedFromEmail)?.department ||
                                        'Org Mailbox'}
                                </Text>
                            </View>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5">
                                {mailboxes.map((mb) => {
                                    const isSelected = selectedFromEmail === mb.email;
                                    return (
                                        <Pressable
                                            key={mb.email}
                                            onPress={() => setSelectedFromEmail(mb.email)}
                                            className="px-2.5 py-1.5 rounded-xl border flex-row items-center gap-1.5 active:opacity-75 mr-2"
                                            style={{
                                                backgroundColor: isSelected
                                                    ? isDark ? '#1e3a8a' : '#eff6ff'
                                                    : isDark ? '#1e293b' : '#f8fafc',
                                                borderColor: isSelected ? colors.primary : colors.border,
                                            }}
                                        >
                                            <View
                                                className="h-2 w-2 rounded-full"
                                                style={{
                                                    backgroundColor: isSelected ? colors.primary : colors.textMuted,
                                                }}
                                            />
                                            <View>
                                                <Text
                                                    className="text-[11px] font-bold"
                                                    style={{ color: isSelected ? colors.primary : colors.text }}
                                                >
                                                    {mb.postTitle || mb.displayName || mb.label?.split('(')[0]?.trim() || mb.email}
                                                </Text>
                                                <Text
                                                    className="text-[9px]"
                                                    style={{
                                                        color: isSelected
                                                            ? isDark ? '#93c5fd' : '#2563eb'
                                                            : colors.textMuted,
                                                    }}
                                                >
                                                    {mb.email}
                                                </Text>
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}

                    {/* TO Field */}
                    <View
                        className="mb-2.5 rounded-2xl border p-2.5"
                        style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    >
                        <View className="flex-row items-center justify-between mb-1.5">
                            <Text className="text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                                To
                            </Text>
                            <Pressable
                                onPress={() => setShowCcBcc(!showCcBcc)}
                                hitSlop={6}
                            >
                                <Text className="text-[11px] font-semibold" style={{ color: colors.primary }}>
                                    {showCcBcc ? 'Hide Cc/Bcc' : 'Cc/Bcc'}
                                </Text>
                            </Pressable>
                        </View>

                        {/* Recipients Pills */}
                        <View className="flex-row flex-wrap items-center gap-1.5 mb-1.5">
                            {toRecipients.map((email) => (
                                <View
                                    key={email}
                                    className="flex-row items-center gap-1 px-2.5 py-1 rounded-xl border"
                                    style={{
                                        backgroundColor: isDark ? '#1e3a8a' : '#eff6ff',
                                        borderColor: colors.primaryBorder,
                                    }}
                                >
                                    <Text className="text-[11px] font-medium" style={{ color: colors.primary }}>
                                        {email}
                                    </Text>
                                    <Pressable
                                        onPress={() => handleRemoveRecipient(email)}
                                        hitSlop={6}
                                        className="ml-0.5"
                                    >
                                        <Ionicons name="close-circle" size={13} color={colors.primary} />
                                    </Pressable>
                                </View>
                            ))}

                            <TextInput
                                placeholder={toRecipients.length === 0 ? 'Recipient email or search CRM...' : 'Add another...'}
                                placeholderTextColor={colors.inputPlaceholder}
                                value={toInput}
                                onChangeText={(text) => {
                                    setToInput(text);
                                    setIsSearchingContact(true);
                                }}
                                onSubmitEditing={handleAddEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                returnKeyType="done"
                                className="flex-1 min-w-[140px] text-xs py-1"
                                style={{ color: colors.text }}
                            />
                        </View>

                        {/* Contact Autocomplete Suggestions */}
                        {matchingContacts.length > 0 && (
                            <View
                                className="mt-1 rounded-xl border overflow-hidden"
                                style={{ backgroundColor: colors.cardAlt, borderColor: colors.borderLight }}
                            >
                                {matchingContacts.map((c) => (
                                    <Pressable
                                        key={c.id}
                                        onPress={() => handleSelectContact(c)}
                                        className="p-2 border-b flex-row items-center justify-between active:opacity-70"
                                        style={{ borderColor: colors.borderLight }}
                                    >
                                        <View className="flex-1 pr-2">
                                            <Text className="text-xs font-bold" style={{ color: colors.text }}>
                                                {c.name}
                                            </Text>
                                            <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                                                {c.email}
                                            </Text>
                                        </View>
                                        <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* CC & BCC Fields (Collapsible) */}
                    {showCcBcc && (
                        <View
                            className="mb-2.5 rounded-2xl border p-2.5 gap-2"
                            style={{ backgroundColor: colors.card, borderColor: colors.border }}
                        >
                            <View className="flex-row items-center gap-2">
                                <Text className="text-[11px] font-bold w-8" style={{ color: colors.textMuted }}>
                                    Cc:
                                </Text>
                                <TextInput
                                    placeholder="Comma separated emails..."
                                    placeholderTextColor={colors.inputPlaceholder}
                                    value={ccInput}
                                    onChangeText={setCcInput}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    className="flex-1 text-xs py-1"
                                    style={{ color: colors.text }}
                                />
                            </View>
                            <View className="h-px" style={{ backgroundColor: colors.borderLight }} />
                            <View className="flex-row items-center gap-2">
                                <Text className="text-[11px] font-bold w-8" style={{ color: colors.textMuted }}>
                                    Bcc:
                                </Text>
                                <TextInput
                                    placeholder="Comma separated emails..."
                                    placeholderTextColor={colors.inputPlaceholder}
                                    value={bccInput}
                                    onChangeText={setBccInput}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    className="flex-1 text-xs py-1"
                                    style={{ color: colors.text }}
                                />
                            </View>
                        </View>
                    )}

                    {/* Subject Field */}
                    <View
                        className="mb-2.5 rounded-2xl border px-3 py-2"
                        style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    >
                        <Text className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.textMuted }}>
                            Subject
                        </Text>
                        <TextInput
                            placeholder="Email subject line..."
                            placeholderTextColor={colors.inputPlaceholder}
                            value={subject}
                            onChangeText={setSubject}
                            className="text-xs font-semibold py-1"
                            style={{ color: colors.text }}
                        />
                    </View>

                    {/* Link to CRM Deal (Optional Selector) */}
                    <View
                        className="mb-2.5 rounded-2xl border p-2.5"
                        style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    >
                        <View className="flex-row items-center justify-between mb-1.5">
                            <View className="flex-row items-center gap-1.5">
                                <Ionicons name="pricetag-outline" size={13} color={colors.primary} />
                                <Text className="text-[11px] font-bold" style={{ color: colors.text }}>
                                    Link to CRM Deal
                                </Text>
                            </View>
                            {dealId && (
                                <Pressable onPress={() => setDealId(null)} hitSlop={6}>
                                    <Text className="text-[10px] font-semibold text-rose-500">Clear</Text>
                                </Pressable>
                            )}
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5">
                            {deals.map((deal) => {
                                const isSelected = deal.id === dealId;
                                return (
                                    <Pressable
                                        key={deal.id}
                                        onPress={() => setDealId(isSelected ? null : deal.id)}
                                        className="px-2.5 py-1 rounded-xl border active:opacity-75"
                                        style={{
                                            backgroundColor: isSelected
                                                ? colors.primary
                                                : isDark ? '#1e293b' : '#f1f5f9',
                                            borderColor: isSelected ? colors.primary : colors.border,
                                        }}
                                    >
                                        <Text
                                            className="text-[11px] font-medium"
                                            style={{ color: isSelected ? '#ffffff' : colors.text }}
                                        >
                                            {deal.title}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Body Text Input */}
                    <View
                        className="rounded-2xl border p-3 min-h-[220px]"
                        style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    >
                        <TextInput
                            placeholder="Compose your email message..."
                            placeholderTextColor={colors.inputPlaceholder}
                            value={bodyText}
                            onChangeText={setBodyText}
                            multiline
                            textAlignVertical="top"
                            className="text-[13px] leading-relaxed flex-1 min-h-[190px]"
                            style={{ color: colors.text }}
                        />

                        {/* AI & Attachment Action Bar */}
                        <View className="flex-row items-center justify-between pt-2 border-t" style={{ borderColor: colors.borderLight }}>
                            <View className="flex-row items-center gap-2">
                                <Pressable
                                    onPress={handlePickAttachment}
                                    hitSlop={6}
                                    className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-xl border active:opacity-75"
                                    style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
                                >
                                    <Ionicons name="attach" size={14} color={colors.primary} />
                                    <Text className="text-[11px] font-semibold" style={{ color: colors.text }}>
                                        Attach
                                    </Text>
                                </Pressable>

                                <Pressable
                                    onPress={handleTakePhoto}
                                    hitSlop={6}
                                    className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-xl border active:opacity-75"
                                    style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
                                >
                                    <Ionicons name="camera-outline" size={14} color={colors.textSecondary} />
                                    <Text className="text-[11px] font-semibold" style={{ color: colors.text }}>
                                        Camera
                                    </Text>
                                </Pressable>
                            </View>

                            <View className="flex-row items-center gap-1.5">
                                <Pressable
                                    onPress={handleAiDraftEmail}
                                    disabled={isAiGenerating}
                                    hitSlop={6}
                                    className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-xl border active:opacity-75"
                                    style={{
                                        backgroundColor: isDark ? '#311b92' : '#f5f3ff',
                                        borderColor: isDark ? '#7c3aed' : '#c4b5fd',
                                    }}
                                >
                                    {isAiGenerating ? (
                                        <ActivityIndicator size="small" color="#7c3aed" />
                                    ) : (
                                        <Ionicons name="sparkles" size={13} color="#7c3aed" />
                                    )}
                                    <Text className="text-[11px] font-bold text-purple-600 dark:text-purple-300">
                                        {isAiGenerating ? 'Drafting...' : '✨ AI Draft'}
                                    </Text>
                                </Pressable>

                                <Pressable
                                    onPress={() => setBodyText((prev) => `${prev ? prev + '\n\n' : ''}Best regards,\nDevlomatix Sales Team`)}
                                    hitSlop={6}
                                    className="px-2 py-1.5 rounded-xl border active:opacity-75"
                                    style={{ backgroundColor: colors.cardAlt, borderColor: colors.borderLight }}
                                >
                                    <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
                                        + Signoff
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Attachments Preview Chips */}
                        {attachments.length > 0 && (
                            <View className="mt-2.5 pt-2 border-t flex-row flex-wrap gap-1.5" style={{ borderColor: colors.borderLight }}>
                                {attachments.map((att, idx) => (
                                    <View
                                        key={idx}
                                        className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-xl border"
                                        style={{ backgroundColor: isDark ? '#1e293b' : '#f0f9ff', borderColor: colors.primaryBorder }}
                                    >
                                        <Ionicons name="document-attach-outline" size={14} color={colors.primary} />
                                        <Text className="text-[11px] font-medium max-w-[140px]" numberOfLines={1} style={{ color: colors.text }}>
                                            {att.filename}
                                        </Text>
                                        {att.size && (
                                            <Text className="text-[9px]" style={{ color: colors.textMuted }}>
                                                ({att.size})
                                            </Text>
                                        )}
                                        <Pressable onPress={() => handleRemoveAttachment(idx)} hitSlop={6} className="ml-1">
                                            <Ionicons name="close-circle" size={14} color="#ef4444" />
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </AppScreen>
    );
}
