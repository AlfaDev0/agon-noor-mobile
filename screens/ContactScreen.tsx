import React, { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useApp } from '../lib/settings';
import { Button, Card, FreePalestineChip, PressScale, ScreenHeader, Txt } from '../components/ui';

const OWNER = require('../assets/images/1792866791121_srjv0gq7m.jpg');
export const OWNER_NAME = 'Ahmed Ayman';
export const OWNER_PHONE_LOCAL = '01110581059';
export const OWNER_PHONE_INTL = '201110581059';

export default function ContactScreen() {
  const { t, theme, align } = useApp();
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [note, setNote] = useState<string | null>(null);

  const open = (url: string) => Linking.openURL(url).catch(() => setNote('—'));

  const sendWhatsApp = () => {
    const body = msg.trim().slice(0, 1000);
    if (!body) { setNote(t('message_required')); return; }
    setNote(null);
    const text = (name.trim() ? `${name.trim().slice(0, 60)}: ` : '') + body;
    open(`https://wa.me/${OWNER_PHONE_INTL}?text=${encodeURIComponent(text)}`);
  };

  const copy = async () => {
    await Clipboard.setStringAsync(OWNER_PHONE_LOCAL);
    setNote(t('copied'));
  };

  const input = {
    backgroundColor: theme.card2, color: theme.text, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, textAlign: align, borderWidth: 1, borderColor: theme.border,
  } as const;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader back title={t('contact_direct')} subtitle={t('contact_sub')} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
        <View style={{ borderRadius: 30, overflow: 'hidden', backgroundColor: '#0B1020', borderWidth: 1, borderColor: theme.border }}>
          <Image source={OWNER} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.55 }} contentFit="cover" contentPosition="top" transition={300} />
          <View style={{ backgroundColor: '#08111Fcc', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#25D36622', borderWidth: 1, borderColor: '#25D36688', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#25D366' }} />
                <Text style={{ color: '#D8FFE9', fontSize: 11.5, fontWeight: '800' }}>{t('photo_available')}</Text>
              </View>
              <FreePalestineChip compact />
            </View>
          </View>
          <View style={{ alignItems: 'center', paddingTop: 6 }}>
            <View style={{
              width: 220, height: 280, borderRadius: 26, overflow: 'hidden',
              borderWidth: 2.5, borderColor: theme.accent + 'CC', backgroundColor: '#101A2B',
              shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 10,
            }}>
              <Image source={OWNER} style={{ width: '100%', height: '100%' }} contentFit="cover" contentPosition={{ top: 0, left: '50%' }} transition={300} accessibilityLabel={OWNER_NAME} />
              <LinearGradient colors={['transparent', '#00000055', '#000000E8']} locations={[0.45, 0.7, 1]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 150, justifyContent: 'flex-end', padding: 14 }}>
                <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900' }}>{OWNER_NAME}</Text>
                <Text style={{ color: theme.accent, fontSize: 12.5, fontWeight: '800', marginTop: 2 }}>{t('photo_badge')}</Text>
              </LinearGradient>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 14, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#ffffff12', borderWidth: 1, borderColor: '#ffffff2A' }}>
              <Ionicons name="call" size={14} color={theme.accent} />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.6, writingDirection: 'ltr' }}>{OWNER_PHONE_LOCAL}</Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <PressScale style={{ flex: 1, backgroundColor: '#25D366', borderRadius: 18, paddingVertical: 14, alignItems: 'center', gap: 4 }}
            onPress={() => open(`https://wa.me/${OWNER_PHONE_INTL}`)}>
            <Ionicons name="logo-whatsapp" size={28} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{t('whatsapp')}</Text>
          </PressScale>
          <PressScale style={{ flex: 1, backgroundColor: theme.primary, borderRadius: 18, paddingVertical: 14, alignItems: 'center', gap: 4 }}
            onPress={() => open(`tel:+${OWNER_PHONE_INTL}`)}>
            <Ionicons name="call" size={28} color={theme.onPrimary} />
            <Text style={{ color: theme.onPrimary, fontWeight: '800', fontSize: 13 }}>{t('call')}</Text>
          </PressScale>
          <PressScale style={{ flex: 1, backgroundColor: theme.card, borderRadius: 18, paddingVertical: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: theme.border }}
            onPress={() => open(`sms:+${OWNER_PHONE_INTL}`)}>
            <Ionicons name="chatbubble-ellipses" size={28} color={theme.primary} />
            <Text style={{ color: theme.text, fontWeight: '800', fontSize: 13 }}>{t('sms')}</Text>
          </PressScale>
        </View>

        <Card style={{ gap: 12 }}>
          <TextInput value={name} onChangeText={setName} placeholder={t('your_name')} placeholderTextColor={theme.sub}
            returnKeyType="next" maxLength={60} style={input} />
          <TextInput value={msg} onChangeText={setMsg} placeholder={t('your_message')} placeholderTextColor={theme.sub}
            multiline numberOfLines={4} maxLength={1000} textAlignVertical="top" style={[input, { minHeight: 110 }]} />
          <Button label={t('send_message')} icon="logo-whatsapp" color="#25D366" onPress={sendWhatsApp} />
          <Button kind="soft" label={t('copy_number')} icon="copy" onPress={copy} />
          {note ? <Txt v="small" center color={theme.primary}>{note}</Txt> : null}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
