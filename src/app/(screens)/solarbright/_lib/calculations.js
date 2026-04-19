

export function formatUnits(units) {
  return `${units.toFixed(0)} kWh`;
}

export function formatCurrency(amount) {
  return `Rs ${amount.toLocaleString('en-IN')}`;
}

export function applianceShare(appliance, totalUnits) {
  if (totalUnits <= 0) return 0;
  return Math.round(appliance.monthlyUnits / totalUnits * 100);
}

export function totalApplianceUnits(appliances) {
  return appliances.reduce((sum, appliance) => sum + appliance.monthlyUnits, 0);
}