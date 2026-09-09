import client from './client';
import { MOCK_ORDERS } from './orders';

const MOCK_STORES = [
  {
    id: 'str_001', name: 'CrystalAura Shopify', platform: 'shopify', status: 'connected',
    storeUrl: 'https://crystalaura.myshopify.com',
    totalProducts: 45, totalOrders: 128, totalRevenue: 12850.00,
    lastSync: '2024-12-23T08:00:00Z', connectedAt: '2024-10-01T00:00:00Z'
  },
  {
    id: 'str_002', name: 'CrystalAura WooCommerce', platform: 'woocommerce', status: 'connected',
    storeUrl: 'https://crystalaura.com/shop',
    totalProducts: 32, totalOrders: 67, totalRevenue: 5430.00,
    lastSync: '2024-12-22T16:00:00Z', connectedAt: '2024-11-15T00:00:00Z'
  },
  {
    id: 'str_003', name: 'Etsy Shop', platform: 'shopify', status: 'disconnected',
    storeUrl: 'https://etsy.com/shop/crystalaura',
    totalProducts: 0, totalOrders: 0, totalRevenue: 0,
    lastSync: null, connectedAt: null
  }
];

export async function getStores(userId) {
  try {
    const res = await client.get('/stores');
    return res.data?.stores ?? res.data ?? [];
  } catch {
    return [...MOCK_STORES];
  }
}

export async function connectStore(userId, data) {
  try {
    const res = await client.post('/stores', data);
    return res.data?.store ?? res.data;
  } catch {
    const store = {
      id: `str_${Date.now()}`,
      ...data,
      status: 'connected',
      totalProducts: 0, totalOrders: 0, totalRevenue: 0,
      lastSync: new Date().toISOString(), connectedAt: new Date().toISOString()
    };
    MOCK_STORES.push(store);
    return store;
  }
}

export async function disconnectStore(userId, storeId) {
  try {
    await client.delete(`/stores/${storeId}`);
  } catch {
    const idx = MOCK_STORES.findIndex((s) => s.id === storeId);
    if (idx >= 0) MOCK_STORES[idx].status = 'disconnected';
  }
}

export async function syncStore(userId, storeId) {
  await new Promise((r) => setTimeout(r, 1000));
  const idx = MOCK_STORES.findIndex((s) => s.id === storeId);
  if (idx >= 0) {
    MOCK_STORES[idx].lastSync = new Date().toISOString();
    MOCK_STORES[idx].totalProducts += Math.floor(Math.random() * 3);
    return MOCK_STORES[idx];
  }
  return null;
}

export async function getStats(userId) {
  try {
    const res = await client.get('/stats');
    return res.data?.stats ?? res.data;
  } catch {
    const totalRevenue = MOCK_ORDERS.reduce((s, o) => s + o.totalAmount, 0);
    return {
      revenue: { total: totalRevenue, count: MOCK_ORDERS.length },
      products: { total: 45, active: 42, lowStock: 3 },
      orders: { total: MOCK_ORDERS.length, pending: MOCK_ORDERS.filter((o) => o.status === 'PENDING').length },
      stores: { connected: MOCK_STORES.filter((s) => s.status === 'connected').length }
    };
  }
}
