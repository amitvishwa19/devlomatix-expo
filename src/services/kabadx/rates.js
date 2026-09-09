export const INITIAL_SCRAP_RATES = [
  { id: 'rate-1', category: 'Paper', name: 'Newspaper & Magazines', pricePerKg: 16, unit: 'kg', icon: 'newspaper-outline', trend: 'up', color: '#0284c7' },
  { id: 'rate-2', category: 'Paper', name: 'Cardboard & Cartons', pricePerKg: 12, unit: 'kg', icon: 'cube-outline', trend: 'stable', color: '#0284c7' },
  { id: 'rate-3', category: 'Paper', name: 'Office Books & Note', pricePerKg: 14, unit: 'kg', icon: 'book-outline', trend: 'stable', color: '#0284c7' },
  
  { id: 'rate-4', category: 'Metal', name: 'Copper Wire & Cables', pricePerKg: 420, unit: 'kg', icon: 'flash-outline', trend: 'up', color: '#d97706' },
  { id: 'rate-5', category: 'Metal', name: 'Brass Utensils & Fittings', pricePerKg: 305, unit: 'kg', icon: 'trophy-outline', trend: 'up', color: '#d97706' },
  { id: 'rate-6', category: 'Metal', name: 'Aluminum Cans & Sheet', pricePerKg: 110, unit: 'kg', icon: 'cafe-outline', trend: 'stable', color: '#d97706' },
  { id: 'rate-7', category: 'Metal', name: 'Iron & Heavy Steel', pricePerKg: 28, unit: 'kg', icon: 'hammer-outline', trend: 'down', color: '#d97706' },
  
  { id: 'rate-8', category: 'Plastic', name: 'PET Bottles (Water/Soda)', pricePerKg: 22, unit: 'kg', icon: 'wine-outline', trend: 'stable', color: '#059669' },
  { id: 'rate-9', category: 'Plastic', name: 'Hard Plastic (Buckets/Chairs)', pricePerKg: 18, unit: 'kg', icon: 'trash-outline', trend: 'up', color: '#059669' },
  { id: 'rate-10', category: 'Plastic', name: 'Polythene & Wrap Film', pricePerKg: 10, unit: 'kg', icon: 'layers-outline', trend: 'stable', color: '#059669' },
  
  { id: 'rate-11', category: 'E-Waste', name: 'Old Laptops & Computers', pricePerKg: 180, unit: 'piece', icon: 'laptop-outline', trend: 'up', color: '#7c3aed' },
  { id: 'rate-12', category: 'E-Waste', name: 'Smartphones & Tablets', pricePerKg: 120, unit: 'piece', icon: 'phone-portrait-outline', trend: 'up', color: '#7c3aed' },
  { id: 'rate-13', category: 'E-Waste', name: 'Circuit Boards & PCB', pricePerKg: 250, unit: 'kg', icon: 'hardware-chip-outline', trend: 'up', color: '#7c3aed' },
  { id: 'rate-14', category: 'E-Waste', name: 'AC Scrap & Compressor', pricePerKg: 2200, unit: 'unit', icon: 'snow-outline', trend: 'stable', color: '#7c3aed' },
  
  { id: 'rate-15', category: 'Glass', name: 'Glass Bottles (Intact)', pricePerKg: 4, unit: 'piece', icon: 'beer-outline', trend: 'stable', color: '#4b5563' },
];

export async function getScrapRates() {
  return INITIAL_SCRAP_RATES;
}

export function calculateEstimatedPayout(selectedItems) {
  if (!Array.isArray(selectedItems)) return 0;
  return selectedItems.reduce((total, item) => {
    const rate = INITIAL_SCRAP_RATES.find(r => r.id === item.rateId || r.name === item.name);
    const price = rate ? rate.pricePerKg : (item.pricePerKg || 0);
    const weight = Number(item.weight || item.quantity || 0);
    return total + (price * weight);
  }, 0);
}
