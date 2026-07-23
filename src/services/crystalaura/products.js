import client from './client';

let nextId = 100;
const MOCK_PRODUCTS = [
  {
    id: 'cry_001', title: 'Amethyst Cluster', category: 'Crystals', price: 49.99, compareAt: 69.99,
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4b049d0a?w=400',
    description: 'Natural amethyst geode cluster from Brazil. Known for its calming energy and spiritual protection properties.',
    rating: 4.8, inStock: true, inventoryCount: 25, reviews: 124, sku: 'AMC-001',
    createdAt: '2024-11-01T10:00:00Z', status: 'ACTIVE'
  },
  {
    id: 'cry_002', title: 'Rose Quartz Heart', category: 'Crystals', price: 29.99, compareAt: null,
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4b049d0a?w=400',
    description: 'Polished rose quartz heart-shaped stone. The stone of unconditional love and emotional healing.',
    rating: 4.7, inStock: true, inventoryCount: 50, reviews: 98, sku: 'RQH-002',
    createdAt: '2024-11-05T10:00:00Z', status: 'ACTIVE'
  },
  {
    id: 'cry_003', title: 'Clear Quartz Point', category: 'Crystals', price: 34.99, compareAt: 44.99,
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4b049d0a?w=400',
    description: 'High-vibration clear quartz single-terminated point. Master healer crystal for amplification.',
    rating: 4.9, inStock: true, inventoryCount: 15, reviews: 156, sku: 'CQP-003',
    createdAt: '2024-11-10T10:00:00Z', status: 'ACTIVE'
  },
  {
    id: 'cry_004', title: 'Citrine Palm Stone', category: 'Tumbled Stones', price: 19.99, compareAt: null,
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4b049d0a?w=400',
    description: 'Smooth citrine palm stone for abundance and manifestation work. Sourced from Madagascar.',
    rating: 4.6, inStock: true, inventoryCount: 80, reviews: 73, sku: 'CPS-004',
    createdAt: '2024-11-15T10:00:00Z', status: 'ACTIVE'
  },
  {
    id: 'cry_005', title: 'Black Tourmaline', category: 'Tumbled Stones', price: 24.99, compareAt: 34.99,
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4b049d0a?w=400',
    description: 'Raw black tourmaline pieces. Powerful grounding and protection stone for EMF shielding.',
    rating: 4.8, inStock: true, inventoryCount: 40, reviews: 211, sku: 'BTO-005',
    createdAt: '2024-11-20T10:00:00Z', status: 'ACTIVE'
  },
  {
    id: 'cry_006', title: 'Lapis Lazuli Bracelet', category: 'Bracelets', price: 39.99, compareAt: null,
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4b049d0a?w=400',
    description: 'Genuine lapis lazuli beaded bracelet with elastic cord. Stone of wisdom and truth.',
    rating: 4.5, inStock: true, inventoryCount: 30, reviews: 67, sku: 'LLB-006',
    createdAt: '2024-12-01T10:00:00Z', status: 'ACTIVE'
  },
  {
    id: 'cry_007', title: 'Moonstone Pendant', category: 'Jewelry', price: 44.99, compareAt: 54.99,
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4b049d0a?w=400',
    description: 'Rainbow moonstone pendant in sterling silver setting. Stone of new beginnings and intuition.',
    rating: 4.7, inStock: true, inventoryCount: 12, reviews: 89, sku: 'MOP-007',
    createdAt: '2024-12-05T10:00:00Z', status: 'ACTIVE'
  },
  {
    id: 'cry_008', title: 'Tiger\'s Eye Worry Stone', category: 'Tumbled Stones', price: 14.99, compareAt: null,
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4b049d0a?w=400',
    description: 'Polished tiger\'s eye worry stone with golden-brown chatoyancy. Stone of courage and protection.',
    rating: 4.4, inStock: true, inventoryCount: 100, reviews: 55, sku: 'TEW-008',
    createdAt: '2024-12-10T10:00:00Z', status: 'ACTIVE'
  },
  {
    id: 'cry_009', title: 'Selenite Charging Plate', category: 'Home', price: 59.99, compareAt: 79.99,
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4b049d0a?w=400',
    description: 'Large selenite charging plate for cleansing and recharging your crystal collection.',
    rating: 4.9, inStock: true, inventoryCount: 8, reviews: 178, sku: 'SCP-009',
    createdAt: '2024-12-15T10:00:00Z', status: 'ACTIVE'
  },
  {
    id: 'cry_010', title: 'Jade Buddha Statue', category: 'Home', price: 74.99, compareAt: 89.99,
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4b049d0a?w=400',
    description: 'Hand-carved jade Buddha statue for meditation altar. Brings peace and harmony to your space.',
    rating: 4.6, inStock: false, inventoryCount: 0, reviews: 42, sku: 'JBS-010',
    createdAt: '2024-12-20T10:00:00Z', status: 'DRAFT'
  },
];

const MOCK_CATEGORIES = ['Crystals', 'Tumbled Stones', 'Bracelets', 'Jewelry', 'Home', 'Sets'];

export async function getProducts(userId, { category, search, status } = {}) {
  try {
    const params = {};
    if (category) params.category = category;
    if (status) params.status = status;
    const res = await client.get('/products', { params });
    return res.data?.products ?? res.data ?? [];
  } catch {
    let filtered = [...MOCK_PRODUCTS];
    if (category && category !== 'All') filtered = filtered.filter((p) => p.category === category);
    if (status) filtered = filtered.filter((p) => p.status === status);
    if (search) filtered = filtered.filter((p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())
    );
    return filtered;
  }
}

export async function getProduct(userId, productId) {
  try {
    const res = await client.get(`/products/${productId}`);
    return res.data?.product ?? res.data;
  } catch {
    return MOCK_PRODUCTS.find((p) => p.id === productId) ?? null;
  }
}

export async function createProduct(userId, data) {
  try {
    const res = await client.post('/products', data);
    return res.data?.product ?? res.data;
  } catch {
    const newProduct = {
      ...data,
      id: `cry_${String(++nextId).padStart(3, '0')}`,
      rating: 0, reviews: 0, createdAt: new Date().toISOString(), status: 'DRAFT'
    };
    MOCK_PRODUCTS.unshift(newProduct);
    return newProduct;
  }
}

export async function updateProduct(userId, productId, data) {
  try {
    const res = await client.put(`/products/${productId}`, data);
    return res.data?.product ?? res.data;
  } catch {
    const idx = MOCK_PRODUCTS.findIndex((p) => p.id === productId);
    if (idx >= 0) {
      MOCK_PRODUCTS[idx] = { ...MOCK_PRODUCTS[idx], ...data };
      return MOCK_PRODUCTS[idx];
    }
    return null;
  }
}

export async function deleteProduct(userId, productId) {
  try {
    await client.delete(`/products/${productId}`);
  } catch {
    const idx = MOCK_PRODUCTS.findIndex((p) => p.id === productId);
    if (idx >= 0) MOCK_PRODUCTS.splice(idx, 1);
  }
}

export async function getCategories(userId) {
  return MOCK_CATEGORIES;
}

export { MOCK_PRODUCTS };
