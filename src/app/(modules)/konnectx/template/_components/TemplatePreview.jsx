import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '~/theme/AppTheme';

export default function TemplatePreview({ visible, onClose, template }) {
  const { palette } = useAppTheme();
  if (!template) return null;

  const nt = (template.type || '').toLowerCase();
  const meta = (() => {
    if (typeof template.metadata === 'string') {
      try { return JSON.parse(template.metadata); } catch { return {}; }
    }
    return template.metadata || {};
  })();
  const buttons = (() => {
    if (typeof template.buttons === 'string') {
      try { return JSON.parse(template.buttons); } catch { return []; }
    }
    return Array.isArray(template.buttons) ? template.buttons : [];
  })();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center bg-black/60 px-6">
        <View className="rounded-[28px] overflow-hidden" style={{ backgroundColor: palette.colors.surface }}>
          <View className="flex-row items-center justify-between px-5 py-4 border-b" style={{ borderColor: palette.colors.border }}>
            <Text className={`text-[18px] font-bold ${palette.text}`}>Template Preview</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={palette.textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView className="px-5 py-6" contentContainerStyle={{ paddingBottom: 30 }}>
            <View className="bg-[#efeae2] rounded-2xl overflow-hidden p-4">
              <View className="self-start max-w-[85%] bg-white rounded-xl rounded-tl-none p-3 shadow-sm">
                {/* Media/Location */}
                {nt === 'image' && meta.mediaUrl ? (
                  <View className="mb-2 rounded-lg overflow-hidden bg-zinc-100">
                    <View className="h-40 bg-zinc-200 items-center justify-center">
                      <Ionicons name="image-outline" size={32} color="#999" />
                    </View>
                  </View>
                ) : null}
                {nt === 'video' ? (
                  <View className="mb-2 rounded-lg overflow-hidden bg-zinc-900 h-32 items-center justify-center">
                    <Ionicons name="play-circle" size={36} color="#fff" />
                  </View>
                ) : null}
                {nt === 'document' ? (
                  <View className="mb-2 rounded-lg bg-blue-50 p-3 flex-row items-center gap-3">
                    <Ionicons name="document-outline" size={24} color="#2563eb" />
                    <View>
                      <Text className="text-[12px] font-bold text-zinc-800">document.pdf</Text>
                      <Text className="text-[9px] text-zinc-500">PDF file</Text>
                    </View>
                  </View>
                ) : null}
                {nt === 'location' ? (
                  <View className="mb-2 rounded-lg bg-zinc-100 p-4 items-center">
                    <Ionicons name="location-outline" size={28} color="#0284c7" />
                    <Text className="text-[13px] font-bold text-zinc-800 mt-1">{meta.locationName || 'Location'}</Text>
                    <Text className="text-[10px] text-zinc-500">{meta.address || ''}</Text>
                  </View>
                ) : null}

                {/* Header */}
                {meta.headerText ? (
                  <Text className="text-[14px] font-bold text-zinc-900 mb-1">{meta.headerText}</Text>
                ) : null}

                {/* Carousel */}
                {nt === 'carousel' ? (
                  <View>
                    {template.body ? <Text className="text-[13px] text-zinc-800 mb-2">{template.body}</Text> : null}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                      {(meta.cards || []).map((card, idx) => (
                        <View key={idx} className="w-44 rounded-xl overflow-hidden border border-zinc-200 mr-2">
                          <View className="h-28 bg-zinc-100 items-center justify-center">
                            {card.mediaUrl ? (
                              <Ionicons name="image-outline" size={28} color="#999" />
                            ) : (
                              <Ionicons name="image-outline" size={28} color="#ccc" />
                            )}
                          </View>
                          <View className="p-2">
                            <Text className="text-[11px] text-zinc-700">{card.body || 'No content'}</Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  <>
                    <Text className="text-[13px] leading-5 text-zinc-800">{template.body || <Text className="italic text-zinc-400">No content</Text>}</Text>
                    {template.footer ? (
                      <Text className="text-[11px] text-zinc-400 mt-1 italic">{template.footer}</Text>
                    ) : null}
                  </>
                )}

                {/* Buttons */}
                {buttons.filter(Boolean).length > 0 ? (
                  <View className="mt-2 pt-2 border-t border-zinc-100">
                    {buttons.filter(Boolean).map((btn, idx) => {
                      const b = typeof btn === 'object' ? btn : { type: 'QUICK_REPLY', text: btn };
                      return (
                        <Text key={idx} className="text-[12px] font-semibold text-[#007aff] text-center py-1">
                          {b.text || 'Button'}
                        </Text>
                      );
                    })}
                  </View>
                ) : null}

                <View className="flex-row justify-end items-center mt-1">
                  <Text className="text-[9px] text-zinc-400">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Ionicons name="checkmark-done" size={12} color="#53bdeb" style={{ marginLeft: 2 }} />
                </View>
              </View>
            </View>

            <View className="mt-4 flex-row flex-wrap gap-2">
              <View className="rounded-full px-3 py-1" style={{ backgroundColor: 'rgba(2,132,199,0.1)' }}>
                <Text className="text-[10px] font-bold text-sky-600">{template.category}</Text>
              </View>
              <View className="rounded-full px-3 py-1" style={{ backgroundColor: 'rgba(107,114,128,0.1)' }}>
                <Text className="text-[10px] font-bold text-gray-500">{template.type}</Text>
              </View>
              <View className="rounded-full px-3 py-1" style={{ backgroundColor: 'rgba(107,114,128,0.1)' }}>
                <Text className="text-[10px] font-bold text-gray-500">{template.language}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
