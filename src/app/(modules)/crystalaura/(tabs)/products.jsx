import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';

import { useCrystalAura } from '~/providers/CrystalAuraProvider';
import CrystalAuraEmptyState from '~/components/crystalaura/CrystalAuraEmptyState';
import ProductListItem from '~/components/crystalaura/ProductListItem';
import ProductFormModal from '~/components/crystalaura/ProductFormModal';
import { SkeletonCard } from '~/components/crystalaura/CrystalAuraLoadingSkeleton';
import * as productsService from '~/services/crystalaura/products';

const CATEGORIES = ['All', 'Crystals', 'Tumbled Stones', 'Bracelets', 'Jewelry', 'Home', 'Sets'];

export default function CrystalAuraProductsScreen() {
  const { palette } = useAppTheme();
  const { userId } = useCrystalAura();

  const [products, setProducts] = useState([]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await productsService.getProducts(userId, {
        category: filterCategory
      });
      setProducts(search
        ? data.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
        : data
      );
    } catch {} finally {
      setLoading(false);
    }
  }, [userId, filterCategory, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const openEdit = (product) => {
    setEditProduct(product);
    setShowForm(true);
  };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editProduct) {
        await productsService.updateProduct(userId, editProduct.id, data);
        Toast.show({ type: 'success', text1: 'Product updated' });
      } else {
        await productsService.createProduct(userId, data);
        Toast.show({ type: 'success', text1: 'Product created' });
      }
      setShowForm(false);
      setEditProduct(null);
      fetchData();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (product) => {
    Alert.alert('Delete Product', `Remove "${product.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await productsService.deleteProduct(userId, product.id);
          Toast.show({ type: 'success', text1: 'Product deleted' });
          fetchData();
        } catch (err) {
          Toast.show({ type: 'error', text1: 'Error', text2: err.message });
        }
      }}
    ]);
  };

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View className="flex-1 px-4 pt-5">
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <View className="mb-2 self-start rounded-full bg-purple-600 px-3 py-1.5">
              <Text className="text-[11px] font-bold uppercase tracking-[1px] text-white">PRODUCTS</Text>
            </View>
            <Text className="text-[28px] font-bold" style={{ color: palette.textColor }}>Catalog</Text>
            <Text className={`mt-1 text-[13px] ${palette.textSoft}`}>{products.length} products</Text>
          </View>
          <TouchableOpacity onPress={() => { setEditProduct(null); setShowForm(true); }}
            className="flex-row items-center gap-2 rounded-full bg-purple-600 px-5 py-3">
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="text-[13px] font-bold text-white">Add</Text>
          </TouchableOpacity>
        </View>

        <View className={`mb-4 flex-row items-center gap-2 rounded-xl border px-3 py-2.5 ${palette.border}`}
          style={{ backgroundColor: palette.colors.surface }}>
          <Ionicons name="search" size={18} color={palette.textMutedColor} />
          <TextInput className="flex-1 text-[15px]"
            style={{ color: palette.textColor }}
            placeholder="Search by name or SKU..." placeholderTextColor={palette.textMutedColor}
            value={search} onChangeText={setSearch} />
        </View>

        <View className="mb-4">
          <FlatList
            horizontal showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setFilterCategory(item)}
                className={`mr-2 rounded-xl px-4 py-2 ${filterCategory === item ? 'bg-purple-600' : 'border'}`}
                style={filterCategory !== item ? { borderColor: palette.colors.border } : {}}>
                <Text className={`text-[13px] font-semibold ${filterCategory === item ? 'text-white' : palette.text}`}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}
          ListEmptyComponent={
            loading ? (
              <><SkeletonCard /><SkeletonCard /></>
            ) : (
              <CrystalAuraEmptyState icon="diamond-outline" title="No products"
                description={search ? 'Try a different search.' : 'Add your first product to get started.'}
                ctaLabel="Add Product" onCtaPress={() => { setEditProduct(null); setShowForm(true); }} />
            )
          }
          renderItem={({ item }) => (
            <ProductListItem product={item} onPress={openEdit} onDelete={handleDelete} />
          )}
        />
      </View>

      <ProductFormModal
        visible={showForm}
        onClose={() => { setShowForm(false); setEditProduct(null); }}
        onSave={handleSave}
        product={editProduct}
        saving={saving} />
    </SafeAreaView>
  );
}
