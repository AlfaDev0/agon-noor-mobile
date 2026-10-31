import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/settings';
import { SURAHS } from '../lib/data/surahs';
import { BASMALA, loadSurah, RIWAYAT, toArabicDigits } from '../lib/riwayat';
import { ARABIC_BOLD, ARABIC_FONT, Button, Chip, ScreenHeader, Txt } from '../components/ui';

const CHUNK = 5;

export default function SurahScreen({ route, navigation }: any) {
  const { s, t, theme, update } = useApp();
  const surahNo: number = route.params?.surah ?? 1;
  const startAyah: number | undefined = route.params?.ayah;
  const meta = SURAHS[surahNo - 1];
  const [verses, setVerses] = useState<string[] | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<number | null>(startAyah ?? null);
  const insets = useSafeAreaInsets();
  const doneList = s.khatma?.completed ?? [];
  const isDone = doneList.includes(surahNo);
  const toggleDone = () => {
    const next = isDone ? doneList.filter((n) => n !== surahNo) : [...doneList, surahNo].sort((a, b) => a - b);
    update({ khatma: { completed: next } });
  };
  const listRef = useRef<FlatList<{ start: number; items: string[] }>>(null);
  const font = s.quranFont;

  const load = useCallback(async () => {
    setVerses(null); setError(false);
    try {
      setVerses(await loadSurah(s.riwaya, surahNo));
    } catch {
      setError(true);
    }
  }, [s.riwaya, surahNo]);

  useEffect(() => { load(); }, [load]);

  const chunks = useMemo(() => {
    if (!verses) return [];
    const out: { start: number; items: string[] }[] = [];
    for (let i = 0; i < verses.length; i += CHUNK) out.push({ start: i + 1, items: verses.slice(i, i + CHUNK) });
    return out;
  }, [verses]);

  useEffect(() => {
    if (verses && startAyah && startAyah > 1) {
      const idx = Math.floor((startAyah - 1) / CHUNK);
      const id = setTimeout(() => {
        try { listRef.current?.scrollToIndex({ index: idx, animated: false }); } catch { /* ignore */ }
      }, 250);
      return () => clearTimeout(id);
    }
  }, [verses, startAyah]);

  const pick = (ayah: number) => {
    setSelected(ayah);
    update({ lastRead: { surah: surahNo, ayah } });
  };

  const showBasmala = surahNo !== 1 && surahNo !== 9;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScreenHeader
        back
        title={meta.ar}
        subtitle={`${meta.en} · ${meta.v} ${t('verses')}`}
        right={
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable onPress={() => update({ quranFont: Math.max(20, font - 2) })} style={{ padding: 6 }} accessibilityLabel="smaller">
              <Ionicons name="remove-circle-outline" size={26} color={theme.primary} />
            </Pressable>
            <Pressable onPress={() => update({ quranFont: Math.min(46, font + 2) })} style={{ padding: 6 }} accessibilityLabel="larger">
              <Ionicons name="add-circle-outline" size={26} color={theme.primary} />
            </Pressable>
          </View>
        }
      />
      <View style={{ paddingBottom: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {RIWAYAT.map((r) => (
            <Chip key={r.id} label={t(r.label)} active={s.riwaya === r.id} onPress={() => update({ riwaya: r.id })} />
          ))}
        </ScrollView>
      </View>

      {!verses && !error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Txt sub center>{t('loading')}</Txt>
        </View>
      ) : null}

      {error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 30 }}>
          <Ionicons name="cloud-offline" size={48} color={theme.sub} />
          <Txt center sub>{t('offline_error')}</Txt>
          <Button label={t('retry')} icon="refresh" onPress={load} />
        </View>
      ) : null}

      {verses ? (
        <FlatList
          ref={listRef}
          data={chunks}
          keyExtractor={(c) => `${s.riwaya}-${c.start}`}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 + insets.bottom }}
          onScrollToIndexFailed={(info) => {
            listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
          }}
          ListHeaderComponent={
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <View style={{
                alignSelf: 'stretch', alignItems: 'center', paddingVertical: 14, borderRadius: 20,
                backgroundColor: theme.card, borderWidth: 1.5, borderColor: theme.accent + '88',
              }}>
                <Text style={{ fontFamily: ARABIC_BOLD, fontSize: 32, color: theme.primary, lineHeight: 52 }}>سُورَةُ {meta.ar}</Text>
                {showBasmala ? <Text style={{ fontFamily: ARABIC_FONT, fontSize: Math.max(22, font - 2), color: theme.text, lineHeight: 48 }}>{BASMALA}</Text> : null}
              </View>
            </View>
          }
          ListFooterComponent={
            <View style={{ gap: 12, marginTop: 18 }}>
              <View style={{
                alignItems: 'center', gap: 6, paddingVertical: 16, borderRadius: 18, backgroundColor: theme.card,
                borderWidth: 1, borderColor: (surahNo === 114 && isDone) ? theme.accent : theme.border,
              }}>
                <Text style={{ fontFamily: ARABIC_BOLD, fontSize: 22, color: theme.primary }}>تمت السورة</Text>
                <Txt v="caption" sub center>{meta.ar} · {meta.v} {t('verses')}</Txt>
                <Button
                  kind={isDone ? 'soft' : 'primary'}
                  label={isDone ? t('surah_completed') : t('surah_complete')}
                  icon={isDone ? 'checkmark-circle' : 'checkmark-circle-outline'}
                  onPress={toggleDone}
                  style={{ marginTop: 6, paddingHorizontal: 18 }}
                />
                {surahNo === 114 && isDone ? (
                  <View style={{ alignItems: 'center', gap: 4, marginTop: 8 }}>
                    <Text style={{ fontSize: 28 }}>🎉</Text>
                    <Txt v="h2" color={theme.primary} center>{t('quran_complete')}</Txt>
                    <Txt v="small" sub center>{t('quran_complete_body')}</Txt>
                  </View>
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {surahNo > 1 ? (
                  <Button kind="soft" style={{ flex: 1 }} label={SURAHS[surahNo - 2].ar} icon="play-skip-back" onPress={() => navigation.replace('Surah', { surah: surahNo - 1 })} />
                ) : <View style={{ flex: 1 }} />}
                {surahNo < 114 ? (
                  <Button style={{ flex: 1 }} label={SURAHS[surahNo].ar} icon="play-skip-forward" onPress={() => navigation.replace('Surah', { surah: surahNo + 1 })} />
                ) : <View style={{ flex: 1 }} />}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <Text style={{
              fontFamily: ARABIC_FONT, fontSize: font, lineHeight: font * 2.1, color: theme.text,
              textAlign: 'justify', writingDirection: 'rtl', marginBottom: 6,
            }}>
              {item.items.map((v: string, i: number) => {
                const n = item.start + i;
                const sel = selected === n;
                return (
                  <Text key={n} onPress={() => pick(n)} style={sel ? { backgroundColor: theme.accent + '40' } : undefined}>
                    {v}{' '}
                    <Text style={{ color: theme.accent, fontSize: font * 0.8 }}>{'\uFD3F'}{toArabicDigits(n)}{'\uFD3E'}</Text>{' '}
                  </Text>
                );
              })}
            </Text>
          )}
        />
      ) : null}
    </View>
  );
}
