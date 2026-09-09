import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';
import * as templatesService from '~/services/konnectx/templates';
import TemplatePreview from './TemplatePreview';

const CATEGORIES = ['UTILITY', 'MARKETING', 'AUTHENTICATION'];
const LANGUAGES = [
  { label: 'English (US)', value: 'en_US' },
  { label: 'English (UK)', value: 'en_GB' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'Hindi', value: 'hi' },
];
const TYPES = [
  { label: 'Text', value: 'text' },
  { label: 'Image', value: 'image' },
  { label: 'Video', value: 'video' },
  { label: 'Audio', value: 'audio' },
  { label: 'Document', value: 'document' },
  { label: 'Location', value: 'location' },
  { label: 'Buttons', value: 'interactive-button' },
  { label: 'List', value: 'interactive-group' },
  { label: 'Carousel', value: 'carousel' },
];
const BUTTON_TYPES = [
  { label: 'Quick Reply', value: 'QUICK_REPLY' },
  { label: 'Visit Website', value: 'URL' },
  { label: 'Call Phone', value: 'PHONE_NUMBER' },
  { label: 'Flow', value: 'FLOW' },
];

const initialForm = {
  name: '',
  templateName: '',
  category: 'UTILITY',
  language: 'en_US',
  type: 'text',
  body: '',
  footer: '',
  buttons: [],
  metadata: {
    mediaUrl: '',
    latitude: '',
    longitude: '',
    locationName: '',
    address: '',
    headerText: '',
    listButton: 'Select Option',
    listSections: [{ title: 'Options', rows: [{ title: '', description: '' }] }],
    cards: [{ body: '', mediaUrl: '' }],
  },
};

export default function TemplateBuilder({ visible, onClose, onSave, editingTemplate, userId, selectedCredential }) {
  const { palette } = useAppTheme();
  const isEditing = !!editingTemplate;
  const [form, setForm] = useState(isEditing ? { ...initialForm, ...editingTemplate, metadata: { ...initialForm.metadata, ...(editingTemplate.metadata || {}) } } : { ...initialForm, metadata: { ...initialForm.metadata } });
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const updateMetadata = (key, val) => setForm(prev => ({ ...prev, metadata: { ...prev.metadata, [key]: val } }));

  const handleNameChange = (val) => {
    const updates = { name: val };
    if (!isEditing) updates.templateName = val.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleTypeChange = (val) => {
    const newMeta = { ...form.metadata };
    if (val === 'interactive-group' && (!newMeta.listSections || newMeta.listSections.length === 0)) {
      newMeta.listSections = [{ title: 'Options', rows: [{ title: '', description: '' }] }];
      newMeta.listButton = 'Select Option';
    }
    if (val === 'carousel' && (!newMeta.cards || newMeta.cards.length === 0)) {
      newMeta.cards = [{ body: '', mediaUrl: '' }];
    }
    setForm(prev => ({ ...prev, type: val, metadata: newMeta }));
  };

  const handleSave = async (shouldSubmit = false) => {
    if (!form.name.trim()) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Name is required' });
      return;
    }
    if (form.type !== 'carousel' && !form.body.trim()) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Body is required' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        templateName: form.templateName?.trim() || form.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        category: form.category,
        language: form.language,
        type: form.type,
        body: form.type === 'carousel' ? '' : form.body.trim(),
        footer: form.footer?.trim() || undefined,
        platform: 'WHATSAPP_CLOUD',
        status: shouldSubmit ? 'PENDING_APPROVAL' : 'DRAFT',
        buttons: form.buttons.filter(b => {
          if (typeof b === 'string') return b.trim();
          return b.text?.trim();
        }).length > 0 ? form.buttons.filter(b => {
          if (typeof b === 'string') return b.trim();
          return b.text?.trim();
        }) : undefined,
        metadata: {},
      };

      const m = form.metadata;
      if (['image', 'video', 'audio', 'document'].includes(form.type) && m.mediaUrl?.trim()) {
        payload.metadata.mediaUrl = m.mediaUrl.trim();
      }
      if (form.type === 'location') {
        Object.assign(payload.metadata, {
          latitude: m.latitude?.trim(), longitude: m.longitude?.trim(),
          locationName: m.locationName?.trim(), address: m.address?.trim(),
        });
      }
      if (['text', 'interactive-button', 'interactive-group', 'carousel'].includes(form.type) && m.headerText?.trim()) {
        payload.metadata.headerText = m.headerText.trim();
      }
      if (form.type === 'interactive-group') {
        payload.metadata.listButton = m.listButton?.trim() || 'Select Option';
        payload.metadata.listSections = (m.listSections || []).filter(s => s.title.trim()).map(s => ({
          title: s.title.trim(),
          rows: s.rows.filter(r => r.title.trim()).map(r => ({
            title: r.title.trim(), description: r.description.trim() || undefined,
          })),
        }));
      }
      if (form.type === 'carousel') {
        payload.metadata.cards = (m.cards || []).filter(c => c.body.trim() || c.mediaUrl.trim());
      }

      if (isEditing && editingTemplate?.id) {
        await templatesService.updateTemplate(editingTemplate.id, { ...payload, id: editingTemplate.id });
      } else {
        await templatesService.saveTemplate(userId, payload);
      }

      Toast.show({ type: 'success', text1: isEditing ? 'Updated' : 'Created' });
      onSave?.();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    } finally {
      setSaving(false);
    }
  };

  const addButton = () => {
    if ((form.buttons || []).length < 3) {
      update('buttons', [...(form.buttons || []), { type: 'QUICK_REPLY', text: '' }]);
    }
  };

  const updateButton = (idx, field, val) => {
    const btns = [...(form.buttons || [])];
    btns[idx] = { ...(typeof btns[idx] === 'object' ? btns[idx] : { type: 'QUICK_REPLY', text: btns[idx] || '' }), [field]: val };
    update('buttons', btns);
  };

  const removeButton = (idx) => {
    const btns = (form.buttons || []).filter((_, i) => i !== idx);
    update('buttons', btns);
  };

  const addSection = () => {
    const sections = [...(form.metadata.listSections || [])];
    sections.push({ title: '', rows: [{ title: '', description: '' }] });
    updateMetadata('listSections', sections);
  };

  const updateSection = (sIdx, val) => {
    const sections = [...(form.metadata.listSections || [])];
    sections[sIdx] = { ...sections[sIdx], title: val };
    updateMetadata('listSections', sections);
  };

  const removeSection = (sIdx) => {
    const sections = (form.metadata.listSections || []).filter((_, i) => i !== sIdx);
    updateMetadata('listSections', sections);
  };

  const addRow = (sIdx) => {
    const sections = [...(form.metadata.listSections || [])];
    sections[sIdx] = { ...sections[sIdx], rows: [...sections[sIdx].rows, { title: '', description: '' }] };
    updateMetadata('listSections', sections);
  };

  const updateRow = (sIdx, rIdx, field, val) => {
    const sections = [...(form.metadata.listSections || [])];
    sections[sIdx] = { ...sections[sIdx], rows: sections[sIdx].rows.map((r, i) => i === rIdx ? { ...r, [field]: val } : r) };
    updateMetadata('listSections', sections);
  };

  const removeRow = (sIdx, rIdx) => {
    const sections = [...(form.metadata.listSections || [])];
    sections[sIdx] = { ...sections[sIdx], rows: sections[sIdx].rows.filter((_, i) => i !== rIdx) };
    updateMetadata('listSections', sections);
  };

  const addCard = () => {
    const cards = [...(form.metadata.cards || [])];
    cards.push({ body: '', mediaUrl: '' });
    updateMetadata('cards', cards);
  };

  const updateCard = (cIdx, field, val) => {
    const cards = [...(form.metadata.cards || [])];
    cards[cIdx] = { ...cards[cIdx], [field]: val };
    updateMetadata('cards', cards);
  };

  const removeCard = (cIdx) => {
    const cards = (form.metadata.cards || []).filter((_, i) => i !== cIdx);
    updateMetadata('cards', cards);
  };

  const nt = (form.type || 'text').toLowerCase();

  const inputStyle = {
    backgroundColor: palette.colors.surface,
    borderColor: palette.colors.border,
    color: palette.textColor,
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
          <View className="flex-row items-center justify-between px-5 py-4" style={{ backgroundColor: palette.colors.surface }}>
            <Text className={`text-[20px] font-bold ${palette.text}`}>{isEditing ? 'Edit Template' : 'Create Template'}</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity onPress={() => setShowPreview(true)} className="p-2">
                <Text className="text-[14px] font-bold text-sky-600">Preview</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} className="p-2">
                <Text className={`text-[14px] ${palette.textSoft}`}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 50 }}>
            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Display Name *</Text>
            <TextInput className="mb-4 rounded-xl border px-4 py-3 text-[15px]" style={inputStyle}
              placeholder="e.g. Welcome Message" placeholderTextColor={palette.textMutedColor}
              value={form.name} onChangeText={handleNameChange} />

            {!isEditing ? (
              <>
                <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>API Name (Meta)</Text>
                <TextInput className="mb-4 rounded-xl border px-4 py-3 text-[15px]" style={inputStyle}
                  placeholder="welcome_message" placeholderTextColor={palette.textMutedColor}
                  value={form.templateName} onChangeText={(v) => update('templateName', v.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} />
              </>
            ) : null}

            <View className="mb-4 flex-row gap-2">
              <View className="flex-1">
                <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Category</Text>
                <View className="flex-row gap-1">
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity key={cat} onPress={() => update('category', cat)}
                      className={`flex-1 items-center rounded-xl py-3 ${form.category === cat ? 'bg-sky-600' : 'border'}`}
                      style={form.category !== cat ? { borderColor: palette.colors.border } : {}}>
                      <Text className={`text-[10px] font-bold ${form.category === cat ? 'text-white' : palette.text}`}>
                        {cat.charAt(0) + cat.slice(1).toLowerCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View className="flex-1">
                <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Language</Text>
                <View className="flex-row flex-wrap gap-1">
                  {LANGUAGES.slice(0, 3).map(l => (
                    <TouchableOpacity key={l.value} onPress={() => update('language', l.value)}
                      className={`px-3 py-2 rounded-xl border ${form.language === l.value ? 'bg-sky-600 border-sky-600' : ''}`}
                      style={form.language !== l.value ? { borderColor: palette.colors.border } : {}}>
                      <Text className={`text-[10px] font-bold ${form.language === l.value ? 'text-white' : palette.text}`}>{l.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Message Type</Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {TYPES.map(t => (
                <TouchableOpacity key={t.value} onPress={() => handleTypeChange(t.value)}
                  className={`px-3 py-2 rounded-xl border ${nt === t.value ? 'bg-sky-600 border-sky-600' : ''}`}
                  style={nt !== t.value ? { borderColor: palette.colors.border } : {}}>
                  <Text className={`text-[11px] font-bold ${nt === t.value ? 'text-white' : palette.text}`}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Media URL */}
            {['image', 'video', 'audio', 'document'].includes(nt) ? (
              <View className="mb-4">
                <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>{nt.charAt(0).toUpperCase() + nt.slice(1)} URL *</Text>
                <TextInput className="rounded-xl border px-4 py-3 text-[15px]" style={inputStyle}
                  placeholder="https://..." placeholderTextColor={palette.textMutedColor}
                  value={form.metadata.mediaUrl} onChangeText={(v) => updateMetadata('mediaUrl', v)} />
              </View>
            ) : null}

            {/* Location fields */}
            {nt === 'location' ? (
              <View className="mb-4 gap-3 rounded-xl border p-4" style={{ borderColor: palette.colors.border }}>
                <Text className={`text-[13px] font-bold ${palette.text}`}>Location Info</Text>
                <Text className={`text-[11px] font-semibold ${palette.text}`}>Latitude *</Text>
                <TextInput className="rounded-xl border px-3 py-2 text-[14px]" style={inputStyle}
                  placeholder="28.6139" value={form.metadata.latitude} onChangeText={(v) => updateMetadata('latitude', v)} />
                <Text className={`text-[11px] font-semibold ${palette.text}`}>Longitude *</Text>
                <TextInput className="rounded-xl border px-3 py-2 text-[14px]" style={inputStyle}
                  placeholder="77.2090" value={form.metadata.longitude} onChangeText={(v) => updateMetadata('longitude', v)} />
                <Text className={`text-[11px] font-semibold ${palette.text}`}>Location Name *</Text>
                <TextInput className="rounded-xl border px-3 py-2 text-[14px]" style={inputStyle}
                  placeholder="e.g. Headquarters" value={form.metadata.locationName} onChangeText={(v) => updateMetadata('locationName', v)} />
                <Text className={`text-[11px] font-semibold ${palette.text}`}>Address *</Text>
                <TextInput className="rounded-xl border px-3 py-2 text-[14px]" style={inputStyle}
                  placeholder="Full address" value={form.metadata.address} onChangeText={(v) => updateMetadata('address', v)} />
              </View>
            ) : null}

            {/* Header Text */}
            {['text', 'interactive-button', 'interactive-group', 'carousel'].includes(nt) ? (
              <View className="mb-4">
                <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Header Text (Optional)</Text>
                <TextInput className="rounded-xl border px-4 py-3 text-[15px] font-bold" style={inputStyle}
                  placeholder="Add a bold title..." placeholderTextColor={palette.textMutedColor}
                  value={form.metadata.headerText} onChangeText={(v) => updateMetadata('headerText', v)} />
              </View>
            ) : null}

            {/* Interactive Buttons */}
            {nt === 'interactive-button' ? (
              <View className="mb-4 rounded-xl border p-4" style={{ borderColor: palette.colors.border }}>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className={`text-[13px] font-bold ${palette.text}`}>Quick Reply Buttons (Max 3)</Text>
                  {(form.buttons || []).length < 3 ? (
                    <TouchableOpacity onPress={addButton} className="rounded-lg bg-sky-600/10 px-2 py-1">
                      <Text className="text-[10px] font-bold text-sky-600">+ Add</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                {(form.buttons || []).length === 0 ? (
                  <TouchableOpacity onPress={addButton}>
                    <Text className={`text-[12px] italic ${palette.textMuted}`}>No buttons. Tap to add one.</Text>
                  </TouchableOpacity>
                ) : null}
                {form.buttons?.map((btn, idx) => {
                  const b = typeof btn === 'object' ? btn : { type: 'QUICK_REPLY', text: btn || '' };
                  return (
                    <View key={idx} className="mb-2 rounded-lg border p-3" style={{ borderColor: palette.colors.border }}>
                      <View className="flex-row items-center gap-2 mb-2">
                        <View className="flex-1 flex-row gap-1">
                          {BUTTON_TYPES.map(bt => (
                            <TouchableOpacity key={bt.value} onPress={() => updateButton(idx, 'type', bt.value)}
                              className={`px-2 py-1 rounded-lg ${(b.type || 'QUICK_REPLY') === bt.value ? 'bg-sky-600' : ''}`} style={(b.type || 'QUICK_REPLY') !== bt.value ? { backgroundColor: palette.colors.page } : {}}>
                              <Text className={`text-[9px] font-bold ${(b.type || 'QUICK_REPLY') === bt.value ? 'text-white' : palette.text}`}>{bt.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <TouchableOpacity onPress={() => removeButton(idx)}>
                          <Text style={{ color: '#dc2626', fontSize: 16 }}>×</Text>
                        </TouchableOpacity>
                      </View>
                      <TextInput className="rounded-lg border px-3 py-2 text-[13px]" style={inputStyle}
                        placeholder="Button text (max 20)" maxLength={20}
                        value={b.text || ''} onChangeText={(v) => updateButton(idx, 'text', v)} />
                      {b.type === 'URL' ? (
                        <TextInput className="mt-1 rounded-lg border px-3 py-2 text-[13px]" style={inputStyle}
                          placeholder="https://..." value={b.url || ''} onChangeText={(v) => updateButton(idx, 'url', v)} />
                      ) : null}
                      {b.type === 'PHONE_NUMBER' ? (
                        <TextInput className="mt-1 rounded-lg border px-3 py-2 text-[13px]" style={inputStyle}
                          placeholder="+1234567890" value={b.phone_number || ''} onChangeText={(v) => updateButton(idx, 'phone_number', v)} />
                      ) : null}
                      {b.type === 'FLOW' ? (
                        <>
                          <TextInput className="mt-1 rounded-lg border px-3 py-2 text-[13px]" style={inputStyle}
                            placeholder="Flow ID" value={b.flow_id || ''} onChangeText={(v) => updateButton(idx, 'flow_id', v)} />
                          <TextInput className="mt-1 rounded-lg border px-3 py-2 text-[13px]" style={inputStyle}
                            placeholder="Flow CTA (e.g. Book Now)" value={b.flow_cta || ''} onChangeText={(v) => updateButton(idx, 'flow_cta', v)} />
                        </>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}

            {/* Interactive Group / List */}
            {nt === 'interactive-group' ? (
              <View className="mb-4 rounded-xl border p-4" style={{ borderColor: palette.colors.border }}>
                <Text className={`text-[13px] font-bold mb-2 ${palette.text}`}>List Menu Config</Text>
                <Text className={`mb-1 text-[11px] font-semibold ${palette.text}`}>Menu Button Text *</Text>
                <TextInput className="mb-3 rounded-xl border px-3 py-2 text-[14px]" style={inputStyle}
                  placeholder="e.g. Select Option" value={form.metadata.listButton} onChangeText={(v) => updateMetadata('listButton', v)} />
                <View className="flex-row items-center justify-between mb-2">
                  <Text className={`text-[11px] font-bold ${palette.text}`}>Sections</Text>
                  <TouchableOpacity onPress={addSection} className="rounded-lg bg-sky-600/10 px-2 py-1">
                    <Text className="text-[10px] font-bold text-sky-600">+ Add</Text>
                  </TouchableOpacity>
                </View>
                {(form.metadata.listSections || []).map((s, sIdx) => (
                  <View key={sIdx} className="mb-3 rounded-lg border p-3" style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.page }}>
                    <View className="flex-row items-center gap-2 mb-2">
                      <TextInput className="flex-1 rounded-lg border px-2 py-1.5 text-[12px] font-bold" style={inputStyle}
                        placeholder="Section Title" value={s.title} onChangeText={(v) => updateSection(sIdx, v)} />
                      <TouchableOpacity onPress={() => removeSection(sIdx)}>
                        <Text style={{ color: '#dc2626', fontSize: 16 }}>×</Text>
                      </TouchableOpacity>
                    </View>
                    <View className="pl-3 border-l-2 border-sky-600/30 gap-1">
                      {(s.rows || []).map((r, rIdx) => (
                        <View key={rIdx} className="flex-row gap-1 items-start">
                          <View className="flex-1 gap-1">
                            <TextInput className="rounded-lg border px-2 py-1 text-[11px]" style={inputStyle}
                              placeholder="Row Title *" value={r.title} onChangeText={(v) => updateRow(sIdx, rIdx, 'title', v)} />
                            <TextInput className="rounded-lg border px-2 py-1 text-[10px]" style={inputStyle}
                              placeholder="Description (Optional)" value={r.description} onChangeText={(v) => updateRow(sIdx, rIdx, 'description', v)} />
                          </View>
                          <TouchableOpacity onPress={() => removeRow(sIdx, rIdx)}>
                            <Text style={{ color: '#dc2626', fontSize: 16 }}>×</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity onPress={() => addRow(sIdx)}>
                        <Text className="text-[10px] font-bold text-sky-600">+ Add Row</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Carousel */}
            {nt === 'carousel' ? (
              <View className="mb-4 rounded-xl border p-4" style={{ borderColor: palette.colors.border }}>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className={`text-[13px] font-bold ${palette.text}`}>Carousel Cards</Text>
                  <TouchableOpacity onPress={addCard} className="rounded-lg bg-sky-600/10 px-2 py-1">
                    <Text className="text-[10px] font-bold text-sky-600">+ Add</Text>
                  </TouchableOpacity>
                </View>
                {form.metadata.cards?.map((c, cIdx) => (
                  <View key={cIdx} className="mb-3 rounded-lg border p-3 gap-2" style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.page }}>
                    <View className="flex-row justify-between items-center">
                      <Text className={`text-[11px] font-bold ${palette.text}`}>Card {cIdx + 1}</Text>
                      <TouchableOpacity onPress={() => removeCard(cIdx)}>
                        <Text style={{ color: '#dc2626', fontSize: 16 }}>×</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput className="rounded-xl border px-2 py-1.5 text-[12px]" style={inputStyle}
                      placeholder="Image URL (https://...)" value={c.mediaUrl} onChangeText={(v) => updateCard(cIdx, 'mediaUrl', v)} />
                    <TextInput className="rounded-xl border px-2 py-1.5 text-[12px]" style={inputStyle}
                      placeholder="Card body text..." value={c.body} onChangeText={(v) => updateCard(cIdx, 'body', v)} multiline numberOfLines={2} />
                  </View>
                ))}
              </View>
            ) : null}

            {/* Body */}
            {nt !== 'carousel' ? (
              <View className="mb-4">
                <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Body * <Text className={`text-[10px] ${palette.textMuted}`}>(Use {'{{1}}'} for variables)</Text></Text>
                <TextInput className="rounded-xl border px-4 py-3 text-[15px]" style={inputStyle}
                  placeholder="Hello {{1}}, welcome!" value={form.body} onChangeText={(v) => update('body', v)}
                  multiline numberOfLines={4} textAlignVertical="top" />
              </View>
            ) : null}

            {/* Footer */}
            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Footer (Optional)</Text>
            <TextInput className="mb-6 rounded-xl border px-4 py-3 text-[15px]" style={inputStyle}
              placeholder="Reply STOP to unsubscribe" value={form.footer} onChangeText={(v) => update('footer', v)} />

            {/* Buttons Section for non-interactive-button types */}
            {nt !== 'interactive-button' && nt !== 'interactive-group' && nt !== 'carousel' ? (
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className={`text-[13px] font-semibold ${palette.text}`}>Buttons (Max 3)</Text>
                  {(form.buttons || []).length < 3 ? (
                    <TouchableOpacity onPress={addButton}>
                      <Text className="text-[12px] font-bold text-sky-600">+ Add Button</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                {form.buttons?.map((btn, idx) => {
                  const b = typeof btn === 'object' ? btn : { type: 'QUICK_REPLY', text: btn || '' };
                  return (
                    <View key={idx} className="mb-2 rounded-lg border p-3" style={{ borderColor: palette.colors.border }}>
                      <View className="flex-row items-center gap-2 mb-1">
                        <TextInput className="flex-1 rounded-lg border px-2 py-1 text-[12px]" style={inputStyle}
                          placeholder="Button text" value={b.text || ''} onChangeText={(v) => updateButton(idx, 'text', v)} />
                        <TouchableOpacity onPress={() => removeButton(idx)}>
                          <Text style={{ color: '#dc2626', fontSize: 16 }}>×</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {/* Action Buttons */}
            <View className="flex-row gap-3 mb-8">
              <TouchableOpacity onPress={() => handleSave(false)} disabled={saving}
                className="flex-1 items-center rounded-xl border py-4" style={{ borderColor: palette.colors.border }}>
                <Text className={`text-[15px] font-bold ${palette.text}`}>{saving ? 'Saving...' : 'Save as Draft'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleSave(true)} disabled={saving}
                className="flex-1 items-center rounded-xl bg-sky-600 py-4">
                <Text className="text-[15px] font-bold text-white">{saving ? 'Submitting...' : 'Submit for Approval'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <TemplatePreview visible={showPreview} onClose={() => setShowPreview(false)} template={form} />
    </>
  );
}
