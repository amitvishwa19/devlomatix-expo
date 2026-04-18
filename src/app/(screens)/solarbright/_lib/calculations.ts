import type { Appliance } from '../../../../types/solarbright-energy';

export function formatUnits(units: number) {
  return `${units.toFixed(0)} kWh`;
}

export function formatCurrency(amount: number) {
  return `Rs ${amount.toLocaleString('en-IN')}`;
}

export function applianceShare(appliance: Appliance, totalUnits: number) {
  if (totalUnits <= 0) return 0;
  return Math.round((appliance.monthlyUnits / totalUnits) * 100);
}

export function totalApplianceUnits(appliances: Appliance[]) {
  return appliances.reduce((sum, appliance) => sum + appliance.monthlyUnits, 0);
}
