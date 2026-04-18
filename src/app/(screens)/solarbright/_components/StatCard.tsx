import { Text, View } from 'react-native';

type StatCardProps = {
  label: string;
  value: string;
  tone?: 'amber' | 'slate';
};

export default function StatCard({ label, value, tone = 'amber' }: StatCardProps) {
  return (
    <View className={`flex-1 rounded-2xl p-4 ${tone === 'amber' ? 'bg-amber-50' : 'bg-slate-100'}`}>
      <Text className="text-2xl font-bold text-slate-900">{value}</Text>
      <Text className="mt-1.5 text-sm leading-5 text-slate-600">{label}</Text>
    </View>
  );
}
