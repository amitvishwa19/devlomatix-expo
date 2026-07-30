import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

const DEPARTMENTS = ['All', 'Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Infrastructure'];
const STAGES = ['All', 'Applied', 'Screening', 'Interview', 'Offered', 'Hired', 'Rejected'];
const SCORE_RANGES = ['All', '4.0 - 5.0', '3.0 - 3.9', '2.0 - 2.9', 'Below 2.0'];
const SORT_OPTIONS = ['Newest First', 'Oldest First', 'Highest Score', 'Lowest Score', 'Name A-Z'];

export default function AdvancedFilters({ visible, onClose, onApply }) {
  const [filters, setFilters] = useState({
    department: 'All',
    stage: 'All',
    scoreRange: 'All',
    sortBy: 'Newest First',
    hasResume: false,
    location: '',
  });

  const toggle = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  const handleApply = () => {
    onApply?.(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({ department: 'All', stage: 'All', scoreRange: 'All', sortBy: 'Newest First', hasResume: false, location: '' });
  };

  const Chip = ({ label, selected, onPress }) => (
    <Pressable onPress={onPress} className={`rounded-full px-3.5 py-1.5 ${selected ? 'bg-indigo-600' : 'bg-slate-100'}`}>
      <Text className={`text-[10px] font-bold ${selected ? 'text-white' : 'text-slate-600'}`}>{label}</Text>
    </Pressable>
  );

  const Section = ({ title, options, value, onChange }) => (
    <View className="mb-4">
      <Text className="text-[12px] font-bold text-slate-900 mb-2">{title}</Text>
      <View className="flex-row flex-wrap gap-1.5">
        {options.map(o => <Chip key={o} label={o} selected={value === o} onPress={() => onChange(o)} />)}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-5 pt-14 pb-4 border-b border-slate-100">
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={22} color="#0f172a" />
          </Pressable>
          <Text className="text-[16px] font-bold text-slate-900">Advanced Filters</Text>
          <Pressable onPress={handleReset}>
            <Text className="text-[12px] font-bold text-indigo-600">Reset</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 pt-5">
          <Section title="Department" options={DEPARTMENTS} value={filters.department} onChange={v => toggle('department', v)} />
          <Section title="Stage" options={STAGES} value={filters.stage} onChange={v => toggle('stage', v)} />
          <Section title="AI Score Range" options={SCORE_RANGES} value={filters.scoreRange} onChange={v => toggle('scoreRange', v)} />
          <Section title="Sort By" options={SORT_OPTIONS} value={filters.sortBy} onChange={v => toggle('sortBy', v)} />

          <View className="mb-4">
            <Text className="text-[12px] font-bold text-slate-900 mb-2">Other</Text>
            <Pressable
              onPress={() => toggle('hasResume', !filters.hasResume)}
              className={`flex-row items-center gap-3 p-3.5 rounded-xl border ${filters.hasResume ? 'border-indigo-600 bg-indigo-500/5' : 'border-slate-200'}`}
            >
              <Ionicons name={filters.hasResume ? 'checkbox' : 'square-outline'} size={18} color={filters.hasResume ? '#6366f1' : '#94a3b8'} />
              <Text className="text-[12px] text-slate-700">Has Resume Attached Only</Text>
            </Pressable>
          </View>

          {/* Active filters summary */}
          <View className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <View className="flex-row items-start gap-2">
              <Ionicons name="funnel-outline" size={16} color="#6366f1" />
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-indigo-900">Active Filters</Text>
                <Text className="text-[10px] text-indigo-600 mt-0.5">
                  {filters.department !== 'All' ? `Department: ${filters.department}` : 'All Departments'}
                  {filters.stage !== 'All' ? ` · Stage: ${filters.stage}` : ''}
                  {filters.scoreRange !== 'All' ? ` · Score: ${filters.scoreRange}` : ''}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View className="px-5 pb-8 pt-3 border-t border-slate-100">
          <Pressable onPress={handleApply} className="w-full rounded-xl bg-indigo-600 py-3.5 items-center">
            <Text className="text-[14px] font-bold text-white">Apply Filters</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
