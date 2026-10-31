import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../lib/settings';
import { useAlarm } from '../lib/alarm';
import { rescheduleAlarms } from '../lib/notifications';
import { ALL_DAYS, daysSummary, newAlarm, nextOccurrence, pad2, type AlarmItem } from '../lib/alarmClock';
import { Button, Card, Chip, IconBadge, PressScale, ScreenHeader, TimeStepper, Toggle, Txt } from '../components/ui';
import { useNow } from '../lib/usePrayer';

const DAY_KEYS = ['days_short_sun', 'days_short_mon', 'days_short_tue', 'days_short_wed', 'days_short_thu', 'days_short_fri', 'days_short_sat'] as const;

export default function AlarmScreen() {
  const { s, t, theme, update, align } = useApp();
  const { showAlarm } = useAlarm();
  const nav = useNavigation<any>();
  const now = useNow(30000);
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState<AlarmItem | null>(null);
  const [isNew, setIsNew] = useState(false);

  const alarms = useMemo(() => [...s.alarms].sort((a, b) => a.h * 60 + a.m - (b.h * 60 + b.m)), [s.alarms]);
  const next = useMemo(() => {
    let best: { a: AlarmItem; when: Date } | null = null;
    for (const a of alarms) {
      if (!a.enabled) continue;
      const when = nextOccurrence(a, now);
      if (when && (!best || when < best.when)) best = { a, when };
    }
    return best;
  }, [alarms, now]);

  const persist = (list: AlarmItem[]) => {
    update({ alarms: list });
    rescheduleAlarms(list, s.lang).catch(() => {});
  };

  const openNew = () => { setEditing(newAlarm(6, 30)); setIsNew(true); };
  const openEdit = (a: AlarmItem) => { setEditing({ ...a }); setIsNew(false); };
  const close = () => { setEditing(null); setIsNew(false); };

  const save = () => {
    if (!editing) return;
    const clean: AlarmItem = { ...editing, label: editing.label.trim(), days: editing.days.length ? editing.days : [...ALL_DAYS] };
    const list = isNew ? [...s.alarms, clean] : s.alarms.map((x) => (x.id === clean.id ? clean : x));
    persist(list);
    close();
  };

  const remove = (id: string) => persist(s.alarms.filter((x) => x.id !== id));
  const toggle = (a: AlarmItem, v: boolean) => persist(s.alarms.map((x) => (x.id === a.id ? { ...x, enabled: v } : x)));

  const toggleDay = (d: number) => {
    setEditing((e) => {
      if (!e) return e;
      const has = e.days.includes(d);
      const days = has ? e.days.filter((x) => x !== d) : [...e.days, d].sort((x, y) => x - y);
      return { ...e, days };
    });
  };

  const fmt = (h: number, m: number) => {
    if (s.h24) return `${pad2(h)}:${pad2(m)}`;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${pad2(m)} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const input = {
    backgroundColor: theme.card2, color: theme.text, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, textAlign: align, borderWidth: 1, borderColor: theme.border,
  } as const;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScreenHeader back title={t('alarms')} subtitle={t('alarm_sub')} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 + insets.bottom, gap: 14 }} keyboardShouldPersistTaps="handled">

        {next ? (
          <LinearGradient colors={theme.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: 18, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="alarm-outline" size={18} color="#fff" style={{ opacity: 0.9 }} />
              <Text style={{ color: '#ffffffCC', fontWeight: '700', fontSize: 12, letterSpacing: 1 }}>{t('alarm_upcoming').toUpperCase()}</Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 44, fontWeight: '900', writingDirection: 'ltr' }}>{fmt(next.a.h, next.a.m)}</Text>
            <Text style={{ color: '#ffffffE6', fontWeight: '700' }}>
              {(next.a.label || t('alarm')).trim()} · {daysSummary(next.a.days, t('alarm_daily'))}
            </Text>
            <Text style={{ color: '#ffffffB0', fontSize: 12 }}>
              {next.when.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
            </Text>
          </LinearGradient>
        ) : null}

        {!editing ? (
          <Button label={t('alarm_new')} icon="add" onPress={openNew} />
        ) : (
          <Card style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <IconBadge name="alarm" />
              <Txt v="h2" style={{ flex: 1 }}>{isNew ? t('alarm_new') : t('alarm_edit')}</Txt>
              <PressScale onPress={close} style={{ padding: 6 }}>
                <Ionicons name="close" size={22} color={theme.sub} />
              </PressScale>
            </View>

            <View style={{ alignItems: 'center', gap: 10, paddingVertical: 6 }}>
              <Text style={{ color: theme.primary, fontSize: 46, fontWeight: '900', writingDirection: 'ltr' }}>{fmt(editing.h, editing.m)}</Text>
              <TimeStepper value={{ h: editing.h, m: editing.m }} h24={s.h24} onChange={(v) => setEditing({ ...editing, h: v.h, m: v.m })} />
            </View>

            <View style={{ gap: 6 }}>
              <Txt v="caption" sub>{t('alarm_label')}</Txt>
              <TextInput
                value={editing.label} onChangeText={(label) => setEditing({ ...editing, label })}
                placeholder={t('alarm_label_ph')} placeholderTextColor={theme.sub} maxLength={40} style={input}
              />
            </View>

            <View style={{ gap: 8 }}>
              <Txt v="caption" sub>{t('alarm_days')}</Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {ALL_DAYS.map((d) => (
                  <PressScale
                    key={d}
                    onPress={() => toggleDay(d)}
                    style={{
                      paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1,
                      backgroundColor: editing.days.includes(d) ? theme.primary : theme.card2,
                      borderColor: editing.days.includes(d) ? theme.primary : theme.border,
                    }}
                  >
                    <Text style={{ color: editing.days.includes(d) ? theme.onPrimary : theme.text, fontWeight: '700', fontSize: 12.5 }}>{t(DAY_KEYS[d])}</Text>
                  </PressScale>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Chip label={t('alarm_daily')} active={editing.days.length === 7} onPress={() => setEditing({ ...editing, days: [...ALL_DAYS] })} />
                <Chip label={t('alarm_once')} active={editing.days.length === 1} onPress={() => setEditing({ ...editing, days: [new Date().getDay()] })} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: theme.text, fontWeight: '600' }}>{t('alarm_sound')}</Text>
              <Toggle value={editing.sound} onChange={(v) => setEditing({ ...editing, sound: v })} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: theme.text, fontWeight: '600' }}>{t('alarm_vibrate')}</Text>
              <Toggle value={editing.vibrate} onChange={(v) => setEditing({ ...editing, vibrate: v })} />
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button label={t('alarm_test')} icon="play" kind="soft" onPress={() => showAlarm({ alarmId: editing.id, label: editing.label || t('alarm'), time: fmt(editing.h, editing.m) })} style={{ flex: 1 }} />
              <Button label={t('alarm_save')} icon="checkmark" onPress={save} style={{ flex: 1 }} />
            </View>
            {!isNew ? (
              <Button label={t('alarm_delete')} icon="trash-outline" kind="danger" onPress={() => { remove(editing.id); close(); }} />
            ) : null}
          </Card>
        )}

        {alarms.length === 0 && !editing ? (
          <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 28 }}>
            <IconBadge name="alarm-outline" size={56} />
            <Txt v="h2">{t('alarm_none')}</Txt>
            <Txt v="small" sub center>{t('alarm_none_sub')}</Txt>
            <Button label={t('alarm_test')} icon="play" kind="soft" onPress={() => showAlarm({ label: t('alarm'), time: fmt(6, 30) })} />
          </Card>
        ) : null}

        {alarms.map((a) => (
          <Card key={a.id} style={{ gap: 12, opacity: a.enabled ? 1 : 0.6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <PressScale onPress={() => openEdit(a)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 28, fontWeight: '900', writingDirection: 'ltr', textAlign: align }}>{fmt(a.h, a.m)}</Text>
                  <Text style={{ color: theme.sub, fontSize: 12.5, fontWeight: '600', marginTop: 2 }}>
                    {(a.label || t('alarm')).trim()} · {daysSummary(a.days, t('alarm_daily'))}
                  </Text>
                </View>
              </PressScale>
              <Toggle value={a.enabled} onChange={(v) => toggle(a, v)} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button kind="soft" label={t('alarm_test')} icon="play" onPress={() => showAlarm({ alarmId: a.id, label: a.label || t('alarm'), time: fmt(a.h, a.m) })} style={{ flex: 1 }} />
              <Button kind="outline" label={t('alarm_edit')} icon="create-outline" onPress={() => openEdit(a)} style={{ flex: 1 }} />
            </View>
          </Card>
        ))}

        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 4 }}>
          <Ionicons name="water" size={18} color={theme.primary} />
          <Txt v="small" sub style={{ flex: 1 }}>{t('alarm_hint')}</Txt>
        </View>
      </ScrollView>
    </View>
  );
}
