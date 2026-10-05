import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import KonnectxScreen from '~/components/konnectx/KonnectxScreen';
import KonnectxBadge, { KonnectxButton, KonnectxSection } from '~/components/konnectx/KonnectxBadge';
import KonnectxField from '~/components/konnectx/KonnectxField';
import { useKonnectx } from '~/providers/KonnectxProvider';
import * as campaignsService from '~/services/konnectx/campaigns';
import * as contactsService from '~/services/konnectx/contacts';
import * as templatesService from '~/services/konnectx/templates';
import { useAppTheme } from '~/theme/AppTheme';

const MESSAGE_TYPES = [
    { label: 'Approved template', value: 'template' },
    { label: 'Free text', value: 'text' }
];

/**
 * Focused broadcast composer: pick a template, pick recipients, send now or
 * schedule. It creates the same campaign record the Broadcast tab manages, so
 * progress is tracked in one place.
 */
export default function BulkSenderScreen() {
    const { palette } = useAppTheme();
    const { userId, selectedCredential } = useKonnectx();

    const [templates, setTemplates] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const [name, setName] = useState('');
    const [messageType, setMessageType] = useState('template');
    const [templateId, setTemplateId] = useState(null);
    const [message, setMessage] = useState('');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState([]);
    const [scheduledAt, setScheduledAt] = useState('');
    const [picking, setPicking] = useState(false);

    const load = useCallback(async () => {
        if (!userId) return;
        try {
            const credParams = {
                credentialId: selectedCredential?.id || selectedCredential?._id,
                wabaId: selectedCredential?.wabaId
            };

            const [templateData, contactData] = await Promise.all([
                templatesService.getTemplates(userId, credParams),
                contactsService.getContacts(userId, credParams)
            ]);

            setTemplates(Array.isArray(templateData) ? templateData : templateData?.templates ?? []);
            setContacts(Array.isArray(contactData) ? contactData : contactData?.contacts ?? []);
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        } finally {
            setLoading(false);
        }
    }, [selectedCredential, userId]);

    useEffect(() => { load(); }, [load]);

    const approvedTemplates = useMemo(
        () => templates.filter((template) => String(template.status || '').toUpperCase() === 'APPROVED'),
        [templates]
    );

    const visibleContacts = useMemo(() => {
        if (!search.trim()) return contacts;
        const term = search.toLowerCase();
        return contacts.filter(
            (contact) =>
                (contact.name || '').toLowerCase().includes(term) ||
                (contact.phone || '').includes(term)
        );
    }, [contacts, search]);

    const toggleContact = useCallback((phone) => {
        setSelected((prev) => (prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]));
    }, []);

    const selectedTemplate = approvedTemplates.find((template) => template.id === templateId);

    const handleSend = useCallback(async () => {
        if (!name.trim()) {
            Toast.show({ type: 'error', text1: 'Validation', text2: 'Give this broadcast a name' });
            return;
        }
        if (messageType === 'template' && !templateId) {
            Toast.show({ type: 'error', text1: 'Validation', text2: 'Select an approved template' });
            return;
        }
        if (messageType === 'text' && !message.trim()) {
            Toast.show({ type: 'error', text1: 'Validation', text2: 'Enter the message to send' });
            return;
        }
        if (selected.length === 0) {
            Toast.show({ type: 'error', text1: 'Validation', text2: 'Select at least one recipient' });
            return;
        }

        try {
            setSending(true);
            const response = await campaignsService.bulkSend(userId, {
                name: name.trim(),
                status: scheduledAt ? 'SCHEDULED' : 'RUNNING',
                messageType,
                templateId: messageType === 'template' ? templateId : null,
                messageTemplate:
                    messageType === 'template'
                        ? { type: 'TEMPLATE', templateId, variables: {} }
                        : { type: 'TEXT', text: message.trim() },
                ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
                recipients: selected.map((phone) => ({ phone }))
            });

            const result = response?.data || response;
            Toast.show({
                type: 'success',
                text1: scheduledAt ? 'Broadcast scheduled' : 'Broadcast queued',
                text2: `${selected.length} recipient${selected.length === 1 ? '' : 's'}`
            });

            setName('');
            setSelected([]);
            setMessage('');
            setScheduledAt('');
            setTemplateId(null);
            return result;
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Send failed', text2: err?.response?.data?.error || err.message });
        } finally {
            setSending(false);
        }
    }, [message, messageType, name, scheduledAt, selected, templateId, userId]);

    return (
        <KonnectxScreen title="Bulk Sender" subtitle={`${selected.length} selected`}>
            <KonnectxSection title="Broadcast">
                <KonnectxField
                    label="Name"
                    required
                    value={name}
                    onChangeText={setName}
                    placeholder="April sale announcement"
                />

                <View>
                    <Text className={`mb-1 text-[11px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>
                        Message type
                    </Text>
                    <View className="flex-row gap-1.5">
                        {MESSAGE_TYPES.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                onPress={() => setMessageType(option.value)}
                                className="flex-1 items-center rounded-full border py-1"
                                style={{
                                    backgroundColor: messageType === option.value ? 'rgba(2,132,199,0.12)' : palette.colors.surface,
                                    borderColor: messageType === option.value ? '#0284c7' : palette.colors.border
                                }}>
                                <Text
                                    className="text-[11px] font-bold"
                                    style={{ color: messageType === option.value ? '#0284c7' : palette.textColor }}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {messageType === 'template' ? (
                    <View className="gap-1.5">
                        <Text className={`mb-1 text-[11px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>
                            Approved template
                        </Text>
                        {approvedTemplates.length === 0 ? (
                            <Text className={`text-[11px] ${palette.textSoft}`}>
                                No approved templates. Sync templates from the Templates page first.
                            </Text>
                        ) : (
                            approvedTemplates.map((template) => (
                                <TouchableOpacity
                                    key={template.id}
                                    onPress={() => setTemplateId(template.id)}
                                    className="flex-row items-center gap-2 rounded-[12px] border p-2"
                                    style={{ borderColor: templateId === template.id ? '#0284c7' : palette.colors.border }}>
                                    <Ionicons
                                        name={templateId === template.id ? 'radio-button-on' : 'radio-button-off'}
                                        size={14}
                                        color={templateId === template.id ? '#0284c7' : palette.textMutedColor}
                                    />
                                    <View className="flex-1">
                                        <Text className={`text-[12px] font-bold ${palette.text}`}>
                                            {template.name || template.templateName}
                                        </Text>
                                        {template.languageCode ? (
                                            <Text className={`text-[10px] ${palette.textMuted}`}>{template.languageCode}</Text>
                                        ) : null}
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                ) : (
                    <KonnectxField
                        label="Message"
                        required
                        multiline
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Type the broadcast message"
                    />
                )}

                <KonnectxField
                    label="Recipients"
                    value={`${selected.length} selected`}
                    editable={false}
                    right={
                        <TouchableOpacity onPress={() => setPicking(true)}>
                            <Text className="text-[11px] font-bold text-sky-600">Choose</Text>
                        </TouchableOpacity>
                    }
                />

                <KonnectxField
                    label="Schedule (optional)"
                    value={scheduledAt}
                    onChangeText={setScheduledAt}
                    placeholder="Leave blank to send now"
                    hint="ISO date, e.g. 2026-04-01T09:30"
                />
            </KonnectxSection>

            {selectedTemplate ? (
                <View className="mb-3 flex-row items-center gap-1.5 rounded-[14px] border p-2.5" style={{ borderColor: palette.colors.border }}>
                    <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                    <Text className={`flex-1 text-[11px] ${palette.textSoft}`} numberOfLines={2}>
                        Using {selectedTemplate.name || selectedTemplate.templateName}
                    </Text>
                    <KonnectxBadge label="Approved" tone="success" />
                </View>
            ) : null}

            <KonnectxButton
                label={scheduledAt ? 'Schedule broadcast' : `Send to ${selected.length}`}
                icon="paper-plane"
                loading={sending}
                disabled={loading}
                onPress={handleSend}
            />

            <Modal visible={picking} animationType="slide" onRequestClose={() => setPicking(false)}>
                <View className="flex-1" style={{ backgroundColor: palette.colors.page }}>
                    <View className="flex-row items-center gap-2 border-b px-3 py-2" style={{ borderColor: palette.colors.border }}>
                        <TouchableOpacity onPress={() => setPicking(false)} hitSlop={10}>
                            <Ionicons name="close" size={20} color={palette.textMutedColor} />
                        </TouchableOpacity>
                        <Text className={`flex-1 text-[15px] font-bold ${palette.text}`}>
                            Recipients ({selected.length})
                        </Text>
                    </View>

                    <View className="px-3 pt-2">
                        <KonnectxField icon="search" placeholder="Search name or phone" value={search} onChangeText={setSearch} />
                    </View>

                    <ScrollView className="flex-1 px-3 py-2" contentContainerStyle={{ paddingBottom: 32 }}>
                        {visibleContacts.length === 0 ? (
                            <Text className={`py-6 text-center text-[12px] ${palette.textSoft}`}>No contacts found</Text>
                        ) : (
                            visibleContacts.map((contact) => {
                                const isSelected = selected.includes(contact.phone);
                                return (
                                    <TouchableOpacity
                                        key={contact.id || contact.phone}
                                        onPress={() => toggleContact(contact.phone)}
                                        className="mb-1.5 flex-row items-center gap-2 rounded-[12px] border p-2"
                                        style={{ borderColor: isSelected ? '#0284c7' : palette.colors.border }}>
                                        <Ionicons
                                            name={isSelected ? 'checkbox' : 'square-outline'}
                                            size={16}
                                            color={isSelected ? '#0284c7' : palette.textMutedColor}
                                        />
                                        <View className="flex-1">
                                            <Text className={`text-[12px] font-semibold ${palette.text}`} numberOfLines={1}>
                                                {contact.name || 'Unnamed'}
                                            </Text>
                                            <Text className={`text-[10px] ${palette.textMuted}`}>{contact.phone}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </ScrollView>

                    <View className="border-t px-3 py-2" style={{ borderColor: palette.colors.border }}>
                        <KonnectxButton label={`Done — ${selected.length} selected`} icon="checkmark" onPress={() => setPicking(false)} />
                    </View>
                </View>
            </Modal>
        </KonnectxScreen>
    );
}