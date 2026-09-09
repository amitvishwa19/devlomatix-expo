import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';

const CATEGORIES = ['Crystals', 'Tumbled Stones', 'Bracelets', 'Jewelry', 'Home', 'Sets'];

export default function ProductFormModal({ visible, onClose, onSave, product, saving }) {
  const { palette } = useAppTheme();
  const isEdit = !!product;
  const [form, setForm] = useState({
    title: '', description: '', price: '', compareAt: '',
    category: 'Crystals', sku: '', inventoryCount: '', imageUrl: '', status: 'ACTIVE'
  });

  useEffect(() => {
    if (product) {
      setForm({
        title: product.title || '',
        description: product.description || '',
        price: String(product.price || ''),
        compareAt: product.compareAt ? String(product.compareAt) : '',
        category: product.category || 'Crystals',
        sku: product.sku || '',
        inventoryCount: String(product.inventoryCount ?? ''),
        imageUrl: product.imageUrl || '',
        status: product.status || 'ACTIVE'
      });
    } else {
      setForm({
        title: '', description: '', price: '', compareAt: '',
        category: 'Crystals', sku: '', inventoryCount: '', imageUrl: '', status: 'ACTIVE'
      });
    }
  }, [product, visible]);

  const handleSave = () => {
    if (!form.title.trim()) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Product title is required' });
      return;
    }
    if (!form.price || isNaN(parseFloat(form.price))) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Valid price is required' });
      return;
    }
    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      compareAt: form.compareAt ? parseFloat(form.compareAt) : null,
      category: form.category,
      sku: form.sku.trim() || undefined,
      inventoryCount: form.inventoryCount ? parseInt(form.inventoryCount, 10) : 0,
      imageUrl: form.imageUrl.trim() || undefined,
      status: form.status
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1" style={{ backgroundColor: palette.colors.page }}>
        <View className="flex-row items-center justify-between px-5 py-4" style={{ backgroundColor: palette.colors.surface }}>
          <Text className={`text-[20px] font-bold ${palette.text}`}>
            {isEdit ? 'Edit Product' : 'New Product'}
          </Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Text className="text-[16px] font-bold text-purple-600">Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Title *</Text>
          <TextInput className="mb-4 rounded-xl border px-4 py-3 text-[15px]"
            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
            placeholder="Product name" placeholderTextColor={palette.textMutedColor}
            value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />

          <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Description</Text>
          <TextInput className="mb-4 rounded-xl border px-4 py-3 text-[15px]"
            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
            placeholder="Product description" placeholderTextColor={palette.textMutedColor}
            value={form.description} onChangeText={(v) => setForm({ ...form, description: v })}
            multiline numberOfLines={4} textAlignVertical="top" />

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Price *</Text>
              <TextInput className="rounded-xl border px-4 py-3 text-[15px]"
                style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
                placeholder="0.00" placeholderTextColor={palette.textMutedColor}
                value={form.price} onChangeText={(v) => setForm({ ...form, price: v })}
                keyboardType="decimal-pad" />
            </View>
            <View className="flex-1">
              <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Compare At</Text>
              <TextInput className="rounded-xl border px-4 py-3 text-[15px]"
                style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
                placeholder="0.00" placeholderTextColor={palette.textMutedColor}
                value={form.compareAt} onChangeText={(v) => setForm({ ...form, compareAt: v })}
                keyboardType="decimal-pad" />
            </View>
          </View>

          <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Category</Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat} onPress={() => setForm({ ...form, category: cat })}
                className={`rounded-xl px-4 py-2 ${form.category === cat ? 'bg-purple-600' : 'border'}`}
                style={form.category !== cat ? { borderColor: palette.colors.border } : {}}>
                <Text className={`text-[12px] font-semibold ${form.category === cat ? 'text-white' : palette.text}`}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>SKU</Text>
              <TextInput className="rounded-xl border px-4 py-3 text-[15px]"
                style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
                placeholder="SKU-001" placeholderTextColor={palette.textMutedColor}
                value={form.sku} onChangeText={(v) => setForm({ ...form, sku: v })} />
            </View>
            <View className="flex-1">
              <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Inventory</Text>
              <TextInput className="rounded-xl border px-4 py-3 text-[15px]"
                style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
                placeholder="0" placeholderTextColor={palette.textMutedColor}
                value={form.inventoryCount} onChangeText={(v) => setForm({ ...form, inventoryCount: v })}
                keyboardType="number-pad" />
            </View>
          </View>

          <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Image URL</Text>
          <TextInput className="mb-4 rounded-xl border px-4 py-3 text-[15px]"
            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
            placeholder="https://..." placeholderTextColor={palette.textMutedColor}
            value={form.imageUrl} onChangeText={(v) => setForm({ ...form, imageUrl: v })} />

          <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Status</Text>
          <View className="mb-6 flex-row gap-2">
            {['ACTIVE', 'DRAFT', 'ARCHIVED'].map((s) => (
              <TouchableOpacity key={s} onPress={() => setForm({ ...form, status: s })}
                className={`flex-1 items-center rounded-xl py-3 ${form.status === s ? 'bg-purple-600' : 'border'}`}
                style={form.status !== s ? { borderColor: palette.colors.border } : {}}>
                <Text className={`text-[13px] font-bold ${form.status === s ? 'text-white' : palette.text}`}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={handleSave} disabled={saving}
            className="mb-8 items-center rounded-xl bg-purple-600 py-4 shadow-lg">
            <Text className="text-[16px] font-bold text-white">
              {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
