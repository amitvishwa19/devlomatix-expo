import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

/**
 * WhatsApp-authentic Template Message Bubble (React Native).
 * Mirrors the official WhatsApp rendering (white incoming / green outgoing bubble,
 * media header, interpolated body, footer, quick-reply buttons, carousel cards).
 */
export default function TemplateMessageBubble({ msg, templateDefinition, onPress }) {
  const { isDark } = useAppTheme();
  if (!msg) return null;

  const isFromMe = msg.fromMe;

  const bubbleBg = isFromMe ? (isDark ? '#005c4b' : '#d9fdd3') : (isDark ? '#202c33' : '#ffffff');
  const bubbleText = isDark ? '#e9edef' : '#111b21';
  const mutedText = isDark ? '#8696a0' : '#667781';
  const accent = isDark ? '#53bdeb' : '#00a884';
  const tickBlue = '#53bdeb';
  const softBg = isFromMe ? (isDark ? '#095948' : '#e7fce3') : (isDark ? '#1f2c33' : '#f2f5f4');
  const divider = isFromMe
    ? (isDark ? 'rgba(5,150,105,0.4)' : 'rgba(17,27,33,0.10)')
    : (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(17,27,33,0.07)');

  // Extract template name
  const templateName =
    msg.metadata?.templateName ||
    msg.metadata?.originalPayload?.template?.name ||
    (typeof msg.text === 'string' && msg.text.startsWith('[Template:')
      ? msg.text.split('[Template:')[1]?.split(']')[0]?.trim()
      : 'WhatsApp Template');

  // Parse metadata safely
  let meta = msg.metadata;
  if (typeof meta === 'string' && meta.trim().startsWith('{')) {
    try {
      meta = JSON.parse(meta);
    } catch { }
  }
  meta = meta || {};

  // Header Logic
  const headerComponent = templateDefinition?.metadata?.components?.find((c) => c.type === 'HEADER');
  const headerType = (headerComponent?.format || templateDefinition?.type || 'TEXT').toUpperCase();
  const headerText = headerComponent?.text || templateDefinition?.header || meta.headerText || null;
  let headerMediaUrl = meta.mediaUrl || meta.originalPayload?.mediaUrl || templateDefinition?.metadata?.mediaUrl || null;

  // Fallback: pull media link from the original sent/webhook payload header parameters
  if (!headerMediaUrl) {
    const comps = meta.originalPayload?.template?.components || meta.components || [];
    const hComp = comps.find((c) => c.type?.toLowerCase() === 'header');
    const param = hComp?.parameters?.[0];
    if (param && ['image', 'video', 'document'].includes(param.type)) {
      headerMediaUrl = param[param.type]?.link || null;
    }
  }

  // Buttons Logic
  let buttons = [];
  if (Array.isArray(templateDefinition?.buttons)) {
    buttons = templateDefinition.buttons;
  } else if (typeof templateDefinition?.buttons === 'string') {
    try {
      buttons = JSON.parse(templateDefinition.buttons);
    } catch { }
  } else if (Array.isArray(meta.buttons)) {
    buttons = meta.buttons;
  }

  // Carousel Logic
  const isCarousel = templateDefinition?.type?.toUpperCase() === 'CAROUSEL';
  const cards = isCarousel ? templateDefinition?.metadata?.cards || [] : [];

  const isInteractiveGroup =
    templateDefinition?.type === 'interactive-group' || meta.type === 'interactive-group';

  // Interpolate & Format Template Body
  const interpolate = (body) => {
    let text = body || '';
    const payloadComponents = meta.originalPayload?.template?.components || meta.components || [];
    const bodyComp = payloadComponents.find((c) => c.type?.toLowerCase() === 'body');
    const params = bodyComp?.parameters || [];
    params.forEach((p, idx) => {
      const val = p.text || p.value || '';
      if (val) text = text.replace(new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g'), val);
    });
    return text.replace(/\{\{\d+\}\}/g, '').trim();
  };

  const getRenderedBody = () => {
    const bodyTemplate = templateDefinition?.body;

    if (bodyTemplate) {
      let text = interpolate(bodyTemplate);

      // Interpolate named parameters or positional fallbacks
      const candidateName = meta.candidateName || meta.name || meta.originalPayload?.candidateName;
      const jobTitle = meta.jobTitle || meta.originalPayload?.jobTitle;
      const companyName = meta.companyName || meta.originalPayload?.companyName;

      if (candidateName) {
        text = text
          .replace(/\{\{1\}\}/g, candidateName)
          .replace(/\{\{name\}\}/gi, candidateName)
          .replace(/\{\{candidateName\}\}/gi, candidateName);
      }
      if (jobTitle) {
        text = text
          .replace(/\{\{2\}\}/g, jobTitle)
          .replace(/\{\{jobTitle\}\}/gi, jobTitle)
          .replace(/\{\{job\}\}/gi, jobTitle);
      }
      if (companyName) {
        text = text
          .replace(/\{\{3\}\}/g, companyName)
          .replace(/\{\{companyName\}\}/gi, companyName)
          .replace(/\{\{company\}\}/gi, companyName);
      }
      return text;
    }

    // Fallback: If raw text was stored with clean body
    if (msg.text && !msg.text.startsWith('[Template:')) {
      return msg.text;
    }

    // Fallback: Extract descriptive content after [Template: ...]
    if (typeof msg.text === 'string' && msg.text.startsWith('[Template:')) {
      const afterTag = msg.text.replace(/^\[Template:[^\]]+\]\s*/, '').trim();
      if (afterTag) return afterTag;
    }

    return `WhatsApp Template`;
  };

  const renderedBody = getRenderedBody();
  const timeStr = msg.timestamp
    ? new Date(Number(msg.timestamp) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const renderTick = () => {
    const status = msg.status || 'SENT';
    if (status === 'PENDING') return <ActivityIndicator size={10} color="#8696a0" />;
    if (status === 'FAILED') return <Ionicons name="alert-circle" size={13} color="#ef4444" />;
    if (status === 'READ' || status === 'DELIVERED') {
      return <Ionicons name="checkmark-done" size={14} color={tickBlue} />;
    }
    return <Ionicons name="checkmark" size={14} color={mutedText} />;
  };

  const renderButtonIcon = (btnType) => {
    const upper = (btnType || 'QUICK_REPLY').toUpperCase();
    if (upper === 'URL') return <Ionicons name="open-outline" size={14} color={accent} />;
    if (upper === 'PHONE_NUMBER') return <Ionicons name="call-outline" size={14} color={accent} />;
    if (upper === 'FLOW') return <Ionicons name="git-network-outline" size={14} color={accent} />;
    return <Ionicons name="chatbubble-ellipses-outline" size={14} color={accent} />;
  };

  // Carousel rendering
  if (isCarousel && cards.length > 0) {
    return (
      <View className="w-full" style={{ maxWidth: 320, alignItems: isFromMe ? 'flex-end' : 'flex-start' }}>
        {/* Carousel Header Bubble */}
        <View className="relative mb-2" style={{ maxWidth: 260 }}>
          <View className="overflow-hidden rounded-lg rounded-tl-none shadow-sm"
            style={{ backgroundColor: bubbleBg }}>
            <Text className="px-3 py-2 text-[14px] leading-5" style={{ color: bubbleText }}>
              {renderedBody}
            </Text>
            {templateDefinition?.footer ? (
              <Text className="px-3 pb-2 -mt-1 text-[11.5px] italic" style={{ color: mutedText }}>
                {templateDefinition.footer}
              </Text>
            ) : null}
          </View>
          {!isFromMe ? (
            <View style={{
              position: 'absolute', left: -7, top: 0, width: 0, height: 0,
              borderTopWidth: 7, borderRightWidth: 7,
              borderTopColor: bubbleBg, borderRightColor: 'transparent',
            }} />
          ) : null}
        </View>

        {/* Horizontal Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {cards.map((card, cIdx) => (
            <View key={cIdx} className="w-60 overflow-hidden rounded-xl shadow-lg border"
              style={{ backgroundColor: bubbleBg, borderColor: divider }}>
              {/* Card Image */}
              {card.mediaUrl ? (
                <Image source={{ uri: card.mediaUrl }} className="w-full h-28" resizeMode="cover" />
              ) : (
                <View className="w-full h-24 items-center justify-center" style={{ backgroundColor: isDark ? '#0b141a' : '#00000010' }}>
                  <Ionicons name="image-outline" size={24} color={mutedText} />
                </View>
              )}

              {/* Card Body */}
              <View className="p-3">
                {card.title ? (
                  <Text className="text-[14px] font-bold mb-1" style={{ color: bubbleText }} numberOfLines={1}>
                    {card.title}
                  </Text>
                ) : null}
                {card.description ? (
                  <Text className="text-[12.5px] leading-4" style={{ color: mutedText }} numberOfLines={2}>
                    {card.description}
                  </Text>
                ) : null}
                <Text className="text-[13px] leading-4 mt-1" style={{ color: bubbleText }}>
                  {interpolate(card.body)}
                </Text>

                {/* Card Buttons */}
                {card.buttons && card.buttons.length > 0 ? (
                  <View className="mt-2.5 pt-2.5" style={{ borderTopWidth: 1, borderTopColor: divider }}>
                    {card.buttons.filter(Boolean).map((btn, bIdx) => {
                      const b = typeof btn === 'object' ? btn : { type: 'QUICK_REPLY', text: btn };
                      return (
                        <View key={bIdx} className="flex-row items-center justify-center gap-1.5 py-1">
                          {renderButtonIcon(b.type)}
                          <Text className="text-[13px] font-bold" style={{ color: accent }}>
                            {b.text || 'View Details'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // Standard Template Message Bubble
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      className="relative overflow-hidden rounded-xl shadow-sm"
      style={{ backgroundColor: bubbleBg, maxWidth: 300 }}
    >
      {/* Source Beak */}
      {isFromMe ? (
        <View style={{
          position: 'absolute', right: -7, top: 0, width: 0, height: 0, zIndex: 1,
          borderTopWidth: 7, borderLeftWidth: 7,
          borderTopColor: bubbleBg, borderLeftColor: 'transparent',
        }} />
      ) : (
        <View style={{
          position: 'absolute', left: -7, top: 0, width: 0, height: 0, zIndex: 1,
          borderTopWidth: 7, borderRightWidth: 7,
          borderTopColor: bubbleBg, borderRightColor: 'transparent',
        }} />
      )}

      {/* Media Header (IMAGE / VIDEO / DOCUMENT / AUDIO) */}
      {headerType === 'IMAGE' ? (
        <View className="w-full h-36 overflow-hidden" style={{ backgroundColor: isDark ? '#0b141a' : '#00000010' }}>
          {headerMediaUrl ? (
            <Image source={{ uri: headerMediaUrl }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="h-full items-center justify-center">
              <Ionicons name="image-outline" size={26} color={mutedText} />
            </View>
          )}
        </View>
      ) : null}

      {headerType === 'VIDEO' ? (
        headerMediaUrl ? (
          <View className="w-full h-36 items-center justify-center" style={{ backgroundColor: '#0b141a' }}>
            <Ionicons name="play-circle-outline" size={44} color="#53bdeb" />
          </View>
        ) : (
          <View className="w-full h-36 items-center justify-center" style={{ backgroundColor: '#0b141a' }}>
            <Ionicons name="film-outline" size={26} color="#94a3b8" />
          </View>
        )
      ) : null}

      {headerType === 'DOCUMENT' ? (
        <View className="flex-row items-center gap-2.5 px-3 py-2.5"
          style={{ backgroundColor: softBg, borderBottomWidth: 1, borderBottomColor: divider }}>
          <View className="rounded-lg p-2" style={{ backgroundColor: 'rgba(59,130,246,0.12)' }}>
            <Ionicons name="document-text-outline" size={20} color="#3b82f6" />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-bold" style={{ color: bubbleText }} numberOfLines={1}>
              {meta.filename || 'Attachment Document'}
            </Text>
            <Text className="text-[10px] uppercase tracking-widest" style={{ color: mutedText }}>
              Template • PDF
            </Text>
          </View>
        </View>
      ) : null}

      {headerType === 'AUDIO' ? (
        <View className="flex-row items-center gap-2.5 px-3 py-2.5"
          style={{ backgroundColor: softBg, borderBottomWidth: 1, borderBottomColor: divider }}>
          <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: accent }}>
            <Ionicons name="musical-notes" size={15} color="#fff" />
          </View>
          <View className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(17,27,33,0.15)' }}>
            <View className="w-1/3 h-full rounded-full" style={{ backgroundColor: accent }} />
          </View>
          <Text className="text-[10px] font-mono" style={{ color: mutedText }}>0:24</Text>
        </View>
      ) : null}

      {/* Header Text (text format) */}
      {headerType === 'TEXT' && headerText ? (
        <View className="px-3 pt-2.5">
          <Text className="text-[14.5px] font-bold leading-tight" style={{ color: bubbleText }}>
            {headerText}
          </Text>
        </View>
      ) : null}

      {/* Body */}
      <View className="px-3 py-1.5">
        <Text className="text-[14.5px] leading-5" style={{ color: bubbleText }}>
          {renderedBody}
        </Text>

        {/* Candidate / Job Metadata Chips */}
        {(meta.candidateName || meta.jobTitle) ? (
          <View className="mt-1 pt-1.5 gap-0.5" style={{ borderTopWidth: 1, borderTopColor: divider }}>
            {meta.candidateName ? (
              <Text className="text-[11px]" style={{ color: mutedText }}>
                <Text className="font-bold" style={{ color: accent }}>Candidate: </Text>
                {meta.candidateName}
              </Text>
            ) : null}
            {meta.jobTitle ? (
              <Text className="text-[11px]" style={{ color: mutedText }}>
                <Text className="font-bold" style={{ color: accent }}>Position: </Text>
                {meta.jobTitle}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Footer */}
        {templateDefinition?.footer || meta.footer ? (
          <Text className="text-[12px] italic mt-1.5" style={{ color: mutedText }}>
            {templateDefinition?.footer || meta.footer}
          </Text>
        ) : null}

        {/* Time + Status inside bubble (WhatsApp style) */}
        <View className="flex-row items-center justify-end mt-1">
          <View className="flex-row items-center gap-0.5">
            {timeStr ? (
              <Text className="text-[10px] uppercase font-mono" style={{ color: mutedText }}>
                {timeStr}
              </Text>
            ) : null}
            {isFromMe ? renderTick() : null}
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      {buttons && buttons.filter(Boolean).length > 0 ? (
        <View style={{ borderTopWidth: 1, borderTopColor: divider, backgroundColor: softBg }}>
          {buttons.filter(Boolean).map((btn, idx) => {
            const b = typeof btn === 'object' ? btn : { type: 'QUICK_REPLY', text: btn };
            const btnType = (b.type || 'QUICK_REPLY').toUpperCase();
            const btnText = b.text || b.buttonText || 'Button';

            return (
              <View
                key={idx}
                className="flex-row items-center justify-center gap-1.5 py-2.5 px-3"
                style={idx < buttons.filter(Boolean).length - 1 ? { borderBottomWidth: 1, borderBottomColor: divider } : null}
              >
                {renderButtonIcon(btnType)}
                <Text className="text-[13.5px] font-semibold" style={{ color: accent }} numberOfLines={1}>
                  {btnText}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {/* Interactive List Toggle */}
      {isInteractiveGroup && !buttons.some(Boolean) ? (
        <View className="flex-row items-center justify-center gap-1.5 p-3"
          style={{ borderTopWidth: 1, borderTopColor: divider, backgroundColor: softBg }}>
          <Ionicons name="list-outline" size={14} color={accent} />
          <Text className="text-[13px] font-bold uppercase tracking-widest" style={{ color: accent }}>
            {meta.listButton || 'View Options'}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}