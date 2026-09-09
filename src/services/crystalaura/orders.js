import client from './client';

const MOCK_ORDERS = [
  {
    id: 'ord_001', orderNumber: 'CA-2024-001', totalAmount: 84.98, currency: 'USD',
    status: 'DELIVERED', items: 2,
    customer: { name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+1-555-0101' },
    shippingAddress: { line1: '123 Main St', city: 'New York', state: 'NY', zip: '10001', country: 'US' },
    products: [
      { title: 'Amethyst Cluster', quantity: 1, price: 49.99, sku: 'AMC-001' },
      { title: 'Citrine Palm Stone', quantity: 2, price: 19.99, sku: 'CPS-004' }
    ],
    notes: 'Gift wrap please', createdAt: '2024-12-15T10:30:00Z',
    updatedAt: '2024-12-20T14:00:00Z', estimatedDelivery: '2024-12-20'
  },
  {
    id: 'ord_002', orderNumber: 'CA-2024-002', totalAmount: 44.99, currency: 'USD',
    status: 'SHIPPED', items: 1,
    customer: { name: 'Mike Chen', email: 'mike@example.com', phone: '+1-555-0102' },
    shippingAddress: { line1: '456 Oak Ave', city: 'Los Angeles', state: 'CA', zip: '90001', country: 'US' },
    products: [
      { title: 'Moonstone Pendant', quantity: 1, price: 44.99, sku: 'MOP-007' }
    ],
    notes: '', createdAt: '2024-12-18T14:00:00Z',
    updatedAt: '2024-12-21T09:00:00Z', estimatedDelivery: '2024-12-23'
  },
  {
    id: 'ord_003', orderNumber: 'CA-2024-003', totalAmount: 129.97, currency: 'USD',
    status: 'PROCESSING', items: 3,
    customer: { name: 'Emily Davis', email: 'emily@example.com', phone: '+1-555-0103' },
    shippingAddress: { line1: '789 Pine Rd', city: 'Chicago', state: 'IL', zip: '60601', country: 'US' },
    products: [
      { title: 'Clear Quartz Point', quantity: 1, price: 34.99, sku: 'CQP-003' },
      { title: 'Black Tourmaline', quantity: 2, price: 24.99, sku: 'BTO-005' },
      { title: 'Selenite Charging Plate', quantity: 1, price: 59.99, sku: 'SCP-009' }
    ],
    notes: 'Leave at front desk', createdAt: '2024-12-20T09:15:00Z',
    updatedAt: '2024-12-20T09:15:00Z', estimatedDelivery: '2024-12-28'
  },
  {
    id: 'ord_004', orderNumber: 'CA-2024-004', totalAmount: 19.99, currency: 'USD',
    status: 'PENDING', items: 1,
    customer: { name: 'Lisa Brown', email: 'lisa@example.com', phone: '+1-555-0104' },
    shippingAddress: { line1: '321 Elm St', city: 'Houston', state: 'TX', zip: '77001', country: 'US' },
    products: [
      { title: "Tiger's Eye Worry Stone", quantity: 1, price: 14.99, sku: 'TEW-008' }
    ],
    notes: '', createdAt: '2024-12-22T16:45:00Z',
    updatedAt: '2024-12-22T16:45:00Z', estimatedDelivery: '2024-12-30'
  },
  {
    id: 'ord_005', orderNumber: 'CA-2024-005', totalAmount: 169.98, currency: 'USD',
    status: 'CANCELLED', items: 2,
    customer: { name: 'James Wilson', email: 'james@example.com', phone: '+1-555-0105' },
    shippingAddress: { line1: '654 Maple Dr', city: 'Phoenix', state: 'AZ', zip: '85001', country: 'US' },
    products: [
      { title: 'Lapis Lazuli Bracelet', quantity: 2, price: 39.99, sku: 'LLB-006' },
      { title: 'Rose Quartz Heart', quantity: 3, price: 29.99, sku: 'RQH-002' }
    ],
    notes: 'Customer requested cancellation', createdAt: '2024-12-10T11:00:00Z',
    updatedAt: '2024-12-12T08:00:00Z', estimatedDelivery: null
  },
  {
    id: 'ord_006', orderNumber: 'CA-2024-006', totalAmount: 89.99, currency: 'USD',
    status: 'PENDING', items: 1,
    customer: { name: 'Anna Martinez', email: 'anna@example.com', phone: '+1-555-0106' },
    shippingAddress: { line1: '987 Cedar Ln', city: 'Miami', state: 'FL', zip: '33101', country: 'US' },
    products: [
      { title: 'Crystal Gift Box', quantity: 1, price: 89.99, sku: 'CGB-011' }
    ],
    notes: '', createdAt: '2024-12-23T10:00:00Z',
    updatedAt: '2024-12-23T10:00:00Z', estimatedDelivery: '2024-12-31'
  }
];

const STATUS_BADGES = {
  PENDING: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  PROCESSING: { label: 'Processing', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  SHIPPED: { label: 'Shipped', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  DELIVERED: { label: 'Delivered', color: '#16a34a', bg: 'rgba(22,163,74,0.15)' },
  CANCELLED: { label: 'Cancelled', color: '#dc2626', bg: 'rgba(220,38,38,0.15)' }
};

const STATUS_FLOW = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export async function getOrders(userId, { status } = {}) {
  try {
    const params = {};
    if (status) params.status = status;
    const res = await client.get('/orders', { params });
    return res.data?.orders ?? res.data ?? [];
  } catch {
    let filtered = [...MOCK_ORDERS];
    if (status && status !== 'ALL') filtered = filtered.filter((o) => o.status === status);
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

export async function getOrder(userId, orderId) {
  try {
    const res = await client.get(`/orders/${orderId}`);
    return res.data?.order ?? res.data;
  } catch {
    return MOCK_ORDERS.find((o) => o.id === orderId) ?? null;
  }
}

export async function updateOrderStatus(userId, orderId, newStatus) {
  try {
    const res = await client.put(`/orders/${orderId}`, { status: newStatus });
    return res.data?.order ?? res.data;
  } catch {
    const idx = MOCK_ORDERS.findIndex((o) => o.id === orderId);
    if (idx >= 0) {
      MOCK_ORDERS[idx] = { ...MOCK_ORDERS[idx], status: newStatus, updatedAt: new Date().toISOString() };
      return MOCK_ORDERS[idx];
    }
    return null;
  }
}

export async function updateOrderNotes(userId, orderId, notes) {
  const idx = MOCK_ORDERS.findIndex((o) => o.id === orderId);
  if (idx >= 0) {
    MOCK_ORDERS[idx] = { ...MOCK_ORDERS[idx], notes, updatedAt: new Date().toISOString() };
    return MOCK_ORDERS[idx];
  }
  return null;
}

export { STATUS_BADGES, STATUS_FLOW };
