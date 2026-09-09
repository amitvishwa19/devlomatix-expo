export async function getKabadxAnalytics() {
  return {
    overview: {
      totalPickups: 42,
      recycledTodayKg: 1240,
      recycledTotalKg: 18450,
      activeCollectors: 18,
      totalPayouts: 248500,
    },
    environmentalImpact: {
      co2SavedKg: 14200,
      treesSaved: 312,
      waterSavedLiters: 98000,
      landfillDivertedKg: 18450,
    },
    scrapCategoryBreakdown: [
      { category: 'Paper & Cardboard', percentage: 42, weightKg: 7749, payout: 92988, color: '#0284c7' },
      { category: 'Metals & Wire', percentage: 28, weightKg: 5166, payout: 108486, color: '#d97706' },
      { category: 'Plastics (PET/HDPE)', percentage: 18, weightKg: 3321, payout: 29889, color: '#059669' },
      { category: 'E-Waste & Appliances', percentage: 8, weightKg: 1476, payout: 14760, color: '#7c3aed' },
      { category: 'Glass & Others', percentage: 4, weightKg: 738, payout: 2377, color: '#4b5563' },
    ],
  };
}
