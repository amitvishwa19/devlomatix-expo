import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

const ATTRIBUTES = [
  { id: 'technical', label: 'Technical Proficiency', icon: 'code-slash-outline', color: '#6366f1', desc: 'Depth of knowledge and hands-on ability' },
  { id: 'culture', label: 'Culture Fit', icon: 'people-outline', color: '#22c55e', desc: 'Alignment with team values and work style' },
  { id: 'growth', label: 'Growth Potential', icon: 'trending-up-outline', color: '#8b5cf6', desc: 'Capacity to learn and take on more responsibility' },
  { id: 'communication', label: 'Communication', icon: 'chatbubbles-outline', color: '#f59e0b', desc: 'Clarity of expression and active listening' },
  { id: 'problem', label: 'Problem Solving', icon: 'bulb-outline', color: '#f43f5e', desc: 'Approach to analysing and resolving issues' },
];

const RECOMMENDATIONS = [
  { id: 'strong_hire', label: 'Strong Hire', icon: 'flash-outline', color: '#6366f1' },
  { id: 'hire', label: 'Hire', icon: 'checkmark-circle-outline', color: '#22c55e' },
  { id: 'maybe', label: 'Maybe / Note', icon: 'alert-circle-outline', color: '#94a3b8' },
  { id: 'no_hire', label: 'Do Not Hire', icon: 'close-circle-outline', color: '#f43f5e' },
];

const SCORE_LABELS = ['Poor', 'Below Avg', 'Average', 'Good', 'Exceptional'];

function ScoreSlider({ value, onChange, color }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View className="flex-row items-center gap-1.5">
      {stars.map(s => (
        <Pressable key={s} onPress={() => onChange(s)} className="p-1">
          <Ionicons name={s <= value ? 'star' : 'star-outline'} size={22} color={s <= value ? color : '#cbd5e1'} />
        </Pressable>
      ))}
      <Text className="ml-1 text-[11px] font-bold text-slate-400">{SCORE_LABELS[value - 1] || '-'}</Text>
    </View>
  );
}

export default function ScorecardForm({ onSubmit }) {
  const [scores, setScores] = useState({ technical: 3, culture: 3, growth: 3, communication: 3, problem: 3 });
  const [feedback, setFeedback] = useState('');
  const [recommendation, setRecommendation] = useState('');

  const setScore = (id, val) => setScores(prev => ({ ...prev, [id]: val }));
  const avg = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;

  const handleSubmit = () => {
    onSubmit?.({ scores, feedback, recommendation });
  };

  return (
    <View className="p-4">
      {/* Average score badge */}
      <View className="flex-row items-center justify-between mb-5">
        <Text className="text-[15px] font-bold text-slate-900">Evaluation Scorecard</Text>
        <View className="flex-row items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1.5">
          <Ionicons name="star" size={14} color="#6366f1" />
          <Text className="text-[14px] font-bold text-indigo-600">{avg.toFixed(1)}</Text>
          <Text className="text-[10px] text-indigo-400">/ 5</Text>
        </View>
      </View>

      {/* Attribute sliders */}
      {ATTRIBUTES.map(attr => (
        <View key={attr.id} className="mb-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <View className="flex-row items-center justify-between mb-1.5">
            <View className="flex-row items-center gap-2">
              <Ionicons name={attr.icon} size={16} color={attr.color} />
              <Text className="text-[12px] font-bold text-slate-900">{attr.label}</Text>
            </View>
            <Text className="text-[11px] font-bold" style={{ color: attr.color }}>{scores[attr.id]}/5</Text>
          </View>
          <Text className="text-[9px] text-slate-400 mb-2">{attr.desc}</Text>
          <ScoreSlider value={scores[attr.id]} onChange={v => setScore(attr.id, v)} color={attr.color} />
        </View>
      ))}

      {/* Overall feedback */}
      <Text className="text-[13px] font-bold text-slate-900 mb-1.5">Overall Feedback</Text>
      <TextInput value={feedback} onChangeText={setFeedback} placeholder="Describe specific examples or observations from the interview..." placeholderTextColor="#94a3b8" multiline numberOfLines={4} className="border border-slate-200 rounded-xl px-4 py-3 text-[12px] text-slate-900 mb-5 min-h-[80px]" textAlignVertical="top" />

      {/* Final Recommendation */}
      <Text className="text-[13px] font-bold text-slate-900 mb-2">Final Recommendation</Text>
      <View className="flex-row flex-wrap gap-2 mb-6">
        {RECOMMENDATIONS.map(r => (
          <Pressable key={r.id} onPress={() => setRecommendation(r.id)} className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2 ${recommendation === r.id ? 'bg-indigo-600' : 'bg-slate-100'}`}>
            <Ionicons name={r.icon} size={14} color={recommendation === r.id ? '#fff' : r.color} />
            <Text className={`text-[10px] font-bold ${recommendation === r.id ? 'text-white' : 'text-slate-600'}`}>{r.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={handleSubmit} disabled={!recommendation} className={`w-full rounded-xl py-3.5 items-center ${recommendation ? 'bg-indigo-600' : 'bg-slate-200'}`}>
        <Text className={`text-[14px] font-bold ${recommendation ? 'text-white' : 'text-slate-400'}`}>
          Finalize & Submit Scorecard
        </Text>
      </Pressable>

      <Text className="text-[9px] text-slate-400 text-center mt-2">Submitted scorecards are permanent and visible to the hiring team.</Text>
    </View>
  );
}
