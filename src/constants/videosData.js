import { videoChannelUrl } from '~/utils/constants';

/**
 * Videos Dataset Configured with YouTube Channel URL from `src/utils/constants.js`.
 */

// Helper to parse YouTube channel info from the constant URL
export function parseChannelFromUrl(url = videoChannelUrl) {
  if (!url) {
    return {
      id: 'alpha_defense_hindi',
      name: 'Alpha Defense Hindi',
      handle: '@AlphaDefenseHindi',
      url: 'https://www.youtube.com/@AlphaDefenseHindi',
      subscriberCount: '370K+ Subscribers',
      verified: true,
      isPrimary: true,
    };
  }

  let handle = '@AlphaDefenseHindi';
  const handleMatch = url.match(/@([a-zA-Z0-9_-]+)/);
  if (handleMatch) {
    handle = `@${handleMatch[1]}`;
  } else {
    const parts = url.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) handle = `@${last}`;
  }

  // Format readable channel name: "@AlphaDefenseHindi" -> "Alpha Defense Hindi"
  const rawName = handle.replace(/^@/, '');
  const formattedName = rawName.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ');

  return {
    id: 'configured_channel',
    name: formattedName || 'Alpha Defense Hindi',
    handle: handle,
    url: url,
    subscriberCount: '370K+ Subscribers',
    verified: true,
    isPrimary: true,
  };
}

export const CONFIGURED_PRIMARY_CHANNEL = parseChannelFromUrl(videoChannelUrl);

export const CONFIGURED_YOUTUBE_CHANNELS = [
  CONFIGURED_PRIMARY_CHANNEL,
];

export const DEFAULT_CHANNEL = CONFIGURED_PRIMARY_CHANNEL;

export const VIDEO_CATEGORIES = [
  { id: 'all', labelKey: 'allVideos', label: 'All Videos', icon: 'apps' },
  { id: 'air_force', labelKey: 'cropCareVideos', label: 'Air Systems & Fighters', icon: 'airplane' },
  { id: 'missiles_defense', labelKey: 'potentizationVideos', label: 'Missiles & Air Defense', icon: 'shield-checkmark' },
  { id: 'navy_maritime', labelKey: 'soilVitalityVideos', label: 'Navy & Carriers', icon: 'boat' },
  { id: 'land_armor', labelKey: 'pestControlVideos', label: 'Army & Armor', icon: 'car-sport' },
  { id: 'strategic_analysis', labelKey: 'masterclassVideos', label: 'Special Analyses', icon: 'school-outline' },
];

export const VIDEOS_DATA = [
  {
    id: 'vid_tejas_mk1a',
    youtubeId: 'kYdG8Hj3c6o',
    searchQuery: 'Alpha Defense Hindi Tejas Mk1A',
    channelId: 'configured_channel',
    channelName: CONFIGURED_PRIMARY_CHANNEL.name,
    title: 'Tejas Mk1A Fighter Jet: F404 Engine Delivery & IAF Squadron Deployment',
    titleHi: 'तेजस Mk1A फाइटर जेट: इंजन आपूर्ति और वायुसेना में तैनाती',
    description: 'Detailed analysis of HAL Tejas Mk1A fighter jet deliveries, GE F404 engine schedule, Uttam AESA Radar integration, and Astra BVR missile testings.',
    category: 'air_force',
    duration: '14:25',
    speaker: CONFIGURED_PRIMARY_CHANNEL.name,
    language: 'Hindi',
    views: '185K',
    featured: true,
    remedies: ['Uttam AESA Radar', 'Astra Mk1 BVR', 'GE F404-IN20'],
    targetCrops: ['IAF Fighter Fleet', 'Tejas Mk1A'],
    thumbnailGradient: ['#0f766e', '#134e4a'],
    keyTakeaways: [
      'Tejas Mk1A features over 65% indigenous content including Uttam AESA radar and indigenous electronic warfare suite.',
      'Astra Mk1 & Mk2 Beyond Visual Range (BVR) missiles integrated for multi-target tracking.',
      'HAL expanding production lines across Bengaluru and Nashik facilities.',
    ],
  },
  {
    id: 'vid_amca_5th_gen',
    youtubeId: 'M7lc1UVf-VE',
    searchQuery: 'Alpha Defense Hindi AMCA 5th Gen',
    channelId: 'configured_channel',
    channelName: CONFIGURED_PRIMARY_CHANNEL.name,
    title: 'AMCA 5th Generation Stealth Fighter: CCS Sanction & Prototype Rollout',
    titleHi: 'AMCA 5वीं पीढ़ी का स्टेल्थ फाइटर जेट: सीसीएस मंजूरी और प्रोटोटाइप',
    description: 'In-depth review of India’s Advanced Medium Combat Aircraft (AMCA) program: Internal weapons bay, serpentine air intake, radar absorbent materials, and 110kN joint engine venture.',
    category: 'air_force',
    duration: '18:40',
    speaker: CONFIGURED_PRIMARY_CHANNEL.name,
    language: 'Hindi',
    views: '240K',
    featured: true,
    remedies: ['Internal Weapons Bay', 'Supercruise 110kN Engine', 'Diverterless Supersonic Intake'],
    targetCrops: ['5th Gen Stealth', 'AMCA Mk1 & Mk2'],
    thumbnailGradient: ['#1e40af', '#1e3a8a'],
    keyTakeaways: [
      'AMCA Mk1 approved by Cabinet Committee on Security with 5 prototypes planned.',
      'Supercruise capability allows supersonic flight without fuel-draining afterburners.',
      'First flight anticipated within 4-5 years with full indigenous avionics.',
    ],
  },
  {
    id: 'vid_s400_project_kusha',
    youtubeId: '9bZkp7q19f0',
    searchQuery: 'Alpha Defense Hindi S-400 Project Kusha',
    channelId: 'configured_channel',
    channelName: CONFIGURED_PRIMARY_CHANNEL.name,
    title: 'S-400 Triumf & Project Kusha: Indigenizing Long Range Air Defense (LR-SAM)',
    titleHi: 'S-400 ट्रायम्फ और प्रोजेक्ट कुशा: भारत का अभेद्य एयर डिफेंस शील्ड',
    description: 'Examining India’s multi-layered air defense grid: Russian S-400 squadrons operational deployment alongside DRDO’s Project Kusha (350km long-range interception system).',
    category: 'missiles_defense',
    duration: '16:15',
    speaker: CONFIGURED_PRIMARY_CHANNEL.name,
    language: 'Hindi',
    views: '310K',
    featured: false,
    remedies: ['S-400 48N6DM', 'Project Kusha 350km', 'Akash Prime / NG'],
    targetCrops: ['Air Space Shield', 'Multi-Layer Defense'],
    thumbnailGradient: ['#b91c1c', '#7f1d1d'],
    keyTakeaways: [
      'S-400 provides anti-stealth detection and engagement up to 400km.',
      'Project Kusha incorporates 3 distinct missile variants for 150km, 250km, and 350km ranges.',
      'Seamless integration with IACCS (Integrated Air Command and Control System).',
    ],
  },
  {
    id: 'vid_brahmos_ng_hypersonic',
    youtubeId: 'kJQP7kiw5Fk',
    searchQuery: 'Alpha Defense Hindi BrahMos Supersonic',
    channelId: 'configured_channel',
    channelName: CONFIGURED_PRIMARY_CHANNEL.name,
    title: 'BrahMos-NG & Hypersonic Cruise Missile: Supersonic Precision Strike',
    titleHi: 'ब्रह्मोस-NG और हाइपरसोनिक क्रूज मिसाइल: अचूक मारक क्षमता',
    description: 'Compact BrahMos Next-Generation missile designed for Su-30MKI, Tejas, and Rafale, featuring Mach 3.5 speed, reduced radar cross-section, and 300-500km range.',
    category: 'missiles_defense',
    duration: '13:50',
    speaker: CONFIGURED_PRIMARY_CHANNEL.name,
    language: 'Hindi',
    views: '195K',
    featured: false,
    remedies: ['Mach 3.5 Ramjet', 'Reduced 1.5t Weight', 'Advanced Active Radar Seeker'],
    targetCrops: ['Precision Strike', 'BrahMos-NG'],
    thumbnailGradient: ['#c2410c', '#9a3412'],
    keyTakeaways: [
      'BrahMos-NG weighs half of the standard BrahMos, allowing a Su-30MKI to carry up to 5 missiles.',
      'Extreme kinetic energy impact pulverizes hardened underground command bunkers.',
      'Lucknow defense corridor manufacturing facility nearing operational production.',
    ],
  },
  {
    id: 'vid_ins_vikrant_iac2',
    youtubeId: 'jNQXAC9IVRw',
    searchQuery: 'Alpha Defense Hindi INS Vikrant Rafale M',
    channelId: 'configured_channel',
    channelName: CONFIGURED_PRIMARY_CHANNEL.name,
    title: 'INS Vikrant & 65,000-Ton IAC-2: Indian Navy Aircraft Carrier Fleet',
    titleHi: 'आईएनएस विक्रांत और आईएसी-2: भारतीय नौसेना की महासागरीय शक्ति',
    description: 'Carrier battle group operations of INS Vikrant (R11) and INS Vikramaditya, Rafale-M fighter jet integration, and approval roadmap for third aircraft carrier.',
    category: 'navy_maritime',
    duration: '21:10',
    speaker: CONFIGURED_PRIMARY_CHANNEL.name,
    language: 'Hindi',
    views: '280K',
    featured: false,
    remedies: ['Rafale-Marine', 'MH-60R Romeo ASW', 'Kolkata/Visakhapatnam Class Escorts'],
    targetCrops: ['Blue Water Navy', 'Carrier Battle Group'],
    thumbnailGradient: ['#0369a1', '#0c4a6e'],
    keyTakeaways: [
      'INS Vikrant features 76% indigenous materials built by Cochin Shipyard Limited.',
      '26 Rafale-M fighters to operate off ski-jump STOBAR flight deck.',
      'IAC-2 repeat order designed to maintain continuous 3-carrier operational readiness.',
    ],
  },
  {
    id: 'vid_zorawar_light_tank',
    youtubeId: 'fJ9rUzIMcZQ',
    searchQuery: 'Alpha Defense Hindi Zorawar Tank',
    channelId: 'configured_channel',
    channelName: CONFIGURED_PRIMARY_CHANNEL.name,
    title: 'Zorawar 25-Ton Light Tank: High Altitude Mountain Warfare Game Changer',
    titleHi: 'जोरावर लाइट टैंक: लद्दाख और ऊंचे पहाड़ों में भारत की नई ताकत',
    description: 'DRDO & L&T developed Zorawar Light Tank tested in Ladakh: 25-ton weight, active protection system, anti-tank guided missiles, and amphibious assault capabilities.',
    category: 'land_armor',
    duration: '15:30',
    speaker: CONFIGURED_PRIMARY_CHANNEL.name,
    language: 'Hindi',
    views: '220K',
    featured: false,
    remedies: ['105mm High Pressure Gun', 'Active Protection Suite', 'High Altitude Cummins Engine'],
    targetCrops: ['Mountain Warfare', 'Armored Corps'],
    thumbnailGradient: ['#92400e', '#78350f'],
    keyTakeaways: [
      'Air transportable by C-17 Globemaster and Il-76 for rapid mountain deployment.',
      'Equipped with loitering munitions integration for long-range beyond-line-of-sight strikes.',
      'Designed specifically for rugged terrain in Eastern Ladakh and Sikkim sectors.',
    ],
  },
];
