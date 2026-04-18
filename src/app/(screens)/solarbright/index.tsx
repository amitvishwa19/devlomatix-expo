import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';

import solarHero from '../../../assets/images/solarbright/hero-solar.png';
import BackButton from './_components/BackButton';
import SolarBrightFloatingCta from './_components/SolarBrightFloatingCta';
import SolarBrightSection from './_components/SolarBrightSection';
import SolarBrightTagCard from './_components/SolarBrightTagCard';

const stats = [
  { value: '50+', label: 'Cities Served' },
  { value: '10K+', label: 'Panels Cleaned' },
  { value: '30%', label: 'Efficiency Boost' },
];

const services = [
  {
    title: 'Residential Cleaning',
    tag: 'Most Popular',
    description:
      'Perfect for rooftop solar panels on homes. We handle 1kW to 10kW setups across all Indian cities.',
  },
  {
    title: 'Commercial Cleaning',
    tag: 'Enterprise',
    description:
      'Offices, malls and hospitals. Large commercial installations cleaned with minimal disruption.',
  },
  {
    title: 'Solar Farm Cleaning',
    tag: 'Industrial',
    description:
      'Specialized robotic and manual cleaning for MW-scale solar farms across Rajasthan, Gujarat and beyond.',
  },
  {
    title: 'AMC & Maintenance',
    tag: 'Best Value',
    description:
      'Annual Maintenance Contracts from Rs 2,999 per year with scheduled cleaning after monsoon, dust and heat.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Book via Call or WhatsApp',
    description: 'Call or WhatsApp and SolarBright confirms a visit within your preferred time slot.',
  },
  {
    step: '02',
    title: 'Free Site Inspection',
    description: 'A technician checks panel condition, dust levels, and visible damage before work starts.',
  },
  {
    step: '03',
    title: 'Professional Cleaning',
    description:
      'Panels are cleaned using DM water, soft brushes, and eco-friendly methods that stay safe across brands.',
  },
  {
    step: '04',
    title: 'More Units, More Savings',
    description: 'Immediate boost in generation with stronger monthly savings on the electricity bill.',
  },
];

const benefits = [
  'Dust and pollution can cut panel output by 30%.',
  'Professional cleaning helps restore peak performance.',
  'Water-smart methods and preventive maintenance reduce repeat issues.',
];

const testimonials = [
  {
    name: 'Rajesh Kumar',
    role: 'Home Owner, Jaipur',
    content:
      "My 5kW setup's output had dropped significantly due to construction dust nearby. After SolarBright's cleaning, the units generated increased by almost 40% the very next day.",
  },
  {
    name: 'Anita Sharma',
    role: 'Villa Owner, Gurgaon',
    content:
      'Very professional service. They used specialized brushes and purified water. No scratches on the panels and they even shared before/after photos as proof.',
  },
  {
    name: 'Vikram Singh',
    role: 'Factory Manager, Ahmedabad',
    content:
      'Handling a 100kW plant was tough. Their AMC plan has simplified everything. Monthly reports and scheduled cleaning have boosted our factory solar savings.',
  },
];

export default function SolarBrightScreen() {
  const { palette } = useAppTheme();

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View className={`flex-1 ${palette.page}`}>
        <ScrollView className={`flex-1 ${palette.page}`} showsVerticalScrollIndicator={false}>
          <View className="px-5 pb-32 pt-5">
            <BackButton />

            <View className={`mb-4 rounded-3xl p-5 shadow-xl ${palette.surface} ${palette.shadow}`}>
              <Text className="text-xs font-bold uppercase tracking-[1.8px] text-amber-600">
                SOLARBRIGHT
              </Text>
              <Text className={`mt-2.5 text-3xl font-bold leading-[38px] ${palette.text}`}>
                Maximize your solar energy output
              </Text>
              <Text className={`mt-2.5 text-base leading-6 ${palette.textSoft}`}>
                Premium solar panel cleaning and maintenance. Smart solar care focused on restoring
                efficiency, reducing dust impact, and improving ongoing performance.
              </Text>
            </View>

            <View className={`mb-4 overflow-hidden rounded-3xl shadow-xl ${palette.surface} ${palette.shadow}`}>
              <Image source={solarHero} className="h-[220px] w-full" resizeMode="cover" />
              <View className="p-5">
                <Text className={`text-lg font-bold ${palette.text}`}>
                  Premium solar panel cleaning and maintenance
                </Text>
                <Text className={`mt-2 text-sm leading-6 ${palette.textSoft}`}>
                  Professional cleaning, inspections, and maintenance support designed for rooftop,
                  commercial, and solar farm installations.
                </Text>
              </View>
            </View>

            <View className="mb-4 flex-row gap-2.5">
              {stats.map((item) => (
                <View key={item.label} className={`flex-1 rounded-2xl p-4 ${palette.amberSoft}`}>
                  <Text className={`text-2xl font-bold ${palette.text}`}>{item.value}</Text>
                  <Text className={`mt-1.5 text-sm leading-5 ${palette.textSoft}`}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>

            <SolarBrightSection title="Why SolarBright">
              {benefits.map((item) => (
                <View key={item} className={`mt-4 rounded-2xl p-4 ${palette.amberSoft}`}>
                  <Text className={`text-sm leading-6 ${palette.textSoft}`}>{item}</Text>
                </View>
              ))}
            </SolarBrightSection>

            <SolarBrightSection title="Complete solar panel care">
              <Text className={`mt-2 text-sm leading-6 ${palette.textSoft}`}>
                From rooftop homes to large solar farms, the service offering covers cleaning,
                inspection, and long-term maintenance.
              </Text>

              {services.map((item) => (
                <SolarBrightTagCard
                  key={item.title}
                  title={item.title}
                  tag={item.tag}
                  description={item.description}
                />
              ))}
            </SolarBrightSection>

            <SolarBrightSection title="How it works">
              {steps.map((item) => (
                <View key={item.step} className={`mt-4 rounded-2xl p-4 ${palette.surfaceInset}`}>
                  <Text className="text-xs font-bold uppercase tracking-[1.6px] text-amber-600">
                    Step {item.step}
                  </Text>
                  <Text className={`mt-2 text-base font-bold ${palette.text}`}>{item.title}</Text>
                  <Text className={`mt-2 text-sm leading-6 ${palette.textSoft}`}>
                    {item.description}
                  </Text>
                </View>
              ))}
            </SolarBrightSection>

            <SolarBrightSection title="Trusted by homeowners and businesses">
              {testimonials.map((item) => (
                <View key={item.name} className={`mt-4 rounded-2xl p-4 ${palette.amberSoft}`}>
                  <Text className={`text-sm leading-6 ${palette.textSoft}`}>"{item.content}"</Text>
                  <Text className={`mt-3 text-base font-bold ${palette.text}`}>{item.name}</Text>
                  <Text className={`mt-1 text-xs uppercase tracking-[1px] ${palette.textMuted}`}>
                    {item.role}
                  </Text>
                </View>
              ))}
            </SolarBrightSection>

            <SolarBrightSection title="Contact">
              <Text className={`mt-3 text-sm leading-6 ${palette.textSoft}`}>
                Free site inspection and a customized cleaning quote within 24 hours.
              </Text>

              <View className={`mt-4 rounded-2xl p-4 ${palette.surfaceInset}`}>
                <Text className={`text-xs font-bold uppercase tracking-[1.2px] ${palette.textMuted}`}>
                  Call Us
                </Text>
                <Text className={`mt-1 text-base font-bold ${palette.text}`}>+91 98765 43210</Text>
              </View>

              <View className={`mt-3 rounded-2xl p-4 ${palette.surfaceInset}`}>
                <Text className={`text-xs font-bold uppercase tracking-[1.2px] ${palette.textMuted}`}>
                  Email
                </Text>
                <Text className={`mt-1 text-base font-bold ${palette.text}`}>
                  info@solarbright.in
                </Text>
              </View>

              <View className={`mt-3 rounded-2xl p-4 ${palette.surfaceInset}`}>
                <Text className={`text-xs font-bold uppercase tracking-[1.2px] ${palette.textMuted}`}>
                  Location
                </Text>
                <Text className={`mt-1 text-base font-bold ${palette.text}`}>
                  Jaipur, Rajasthan, India
                </Text>
              </View>
            </SolarBrightSection>
          </View>
        </ScrollView>

        <SolarBrightFloatingCta />
      </View>
    </SafeAreaView>
  );
}
