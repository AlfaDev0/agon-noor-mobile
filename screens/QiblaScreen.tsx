import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useApp } from '../lib/settings';
import { distanceToKaabaKm, qiblaBearing } from '../lib/prayer';
import { Button, Card, ScreenHeader, Txt } from '../components/ui';

const SIZE = 300;

type SensorState = 'idle' | 'waiting' | 'active' | 'denied' | 'unavailable';

export default function QiblaScreen() {
  const { s, t, theme } = useApp();
  const { lat, lng, name } = s.location;
  const bearing = qiblaBearing(lat, lng);
  const dist = distanceToKaabaKm(lat, lng);

  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [state, setState] = useState<SensorState>('idle');
  const [rot] = useState(() => new Animated.Value(0));
  const [glow] = useState(() => new Animated.Value(0));
  const last = useRef(0);
  const subRef = useRef<{ remove: () => void } | null>(null);
  const webHandler = useRef<((e: any) => void) | null>(null);

  const applyHeading = useCallback((h: number, acc: number | null) => {
    const norm = ((h % 360) + 360) % 360;
    setHeading(norm);
    setAccuracy(acc);
    setState('active');
  }, []);

  const startNative = useCallback(async () => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (Platform.OS !== 'web' && perm.status !== 'granted') {
        // true heading needs location permission, magnetic still works
      }
      const sub = await Location.watchHeadingAsync((hd) => {
        const val = hd.trueHeading >= 0 ? hd.trueHeading : hd.magHeading;
        applyHeading(val, hd.accuracy ?? null);
      });
      subRef.current = sub;
      setState('waiting');
    } catch {
      setState('unavailable');
    }
  }, [applyHeading]);

  const startWeb = useCallback(async () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const D = (window as any).DeviceOrientationEvent;
    if (!D) { setState('unavailable'); return; }
    try {
      if (typeof D.requestPermission === 'function') {
        const res = await D.requestPermission();
        if (res !== 'granted') { setState('denied'); return; }
      }
    } catch { setState('denied'); return; }

    const handler = (e: any) => {
      let h: number | null = null;
      if (typeof e.webkitCompassHeading === 'number' && e.webkitCompassHeading >= 0) {
        h = e.webkitCompassHeading;
      } else if (typeof e.alpha === 'number') {
        h = 360 - e.alpha;
        if (typeof e.webkitCompassAccuracy === 'number' && e.webkitCompassAccuracy >= 0) {
          setAccuracy(e.webkitCompassAccuracy < 15 ? 3 : e.webkitCompassAccuracy < 30 ? 2 : 1);
        }
      }
      if (h != null && isFinite(h)) applyHeading(h, null);
    };
    window.addEventListener('deviceorientationabsolute' as any, handler, true);
    window.addEventListener('deviceorientation', handler, true);
    webHandler.current = handler;
    setState('waiting');
    setTimeout(() => {
      setHeading((cur) => {
        if (cur == null) setState((st) => (st === 'waiting' ? 'unavailable' : st));
        return cur;
      });
    }, 2500);
  }, [applyHeading]);

  const start = useCallback(() => {
    if (Platform.OS === 'web') startWeb();
    else startNative();
  }, [startNative, startWeb]);

  useEffect(() => {
    start();
    return () => {
      subRef.current?.remove();
      subRef.current = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && webHandler.current) {
        window.removeEventListener('deviceorientationabsolute' as any, webHandler.current, true);
        window.removeEventListener('deviceorientation', webHandler.current, true);
        webHandler.current = null;
      }
    };
  }, [start]);

  // Smooth rotation along the shortest arc.
  useEffect(() => {
    if (heading == null) return;
    const target = -heading;
    let diff = target - (last.current % 360);
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const next = last.current + diff;
    last.current = next;
    Animated.timing(rot, { toValue: next, duration: 140, easing: Easing.linear, useNativeDriver: true }).start();
  }, [heading, rot]);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    if (heading != null) loop.start();
    return () => loop.stop();
  }, [heading, glow]);

  const dialRotate = rot.interpolate({ inputRange: [-72000, 72000], outputRange: ['-72000deg', '72000deg'] });
  const aligned = heading != null && Math.abs(((heading - bearing + 540) % 360) - 180) < 5;
  const accLabel = accuracy == null
    ? t('qibla_accuracy_medium')
    : accuracy >= 3 ? t('qibla_accuracy_high') : accuracy === 2 ? t('qibla_accuracy_medium') : t('qibla_accuracy_low');
  const accColor = accuracy == null ? theme.accent : accuracy >= 3 ? theme.success : accuracy === 2 ? theme.accent : theme.danger;
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] });

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScreenHeader back title={t('qibla')} subtitle={name} />
      <View style={{ flex: 1, alignItems: 'center', padding: 16, gap: 16 }}>
        <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
          {aligned ? (
            <Animated.View pointerEvents="none" style={{
              position: 'absolute', width: SIZE + 26, height: SIZE + 26, borderRadius: (SIZE + 26) / 2,
              backgroundColor: theme.success + '33', transform: [{ scale: glowScale }], opacity: glowOpacity,
            }} />
          ) : null}
          <Animated.View style={{
            width: SIZE, height: SIZE, borderRadius: SIZE / 2, overflow: 'hidden',
            borderWidth: 3, borderColor: aligned ? theme.success : theme.border,
            transform: [{ rotate: heading == null ? '0deg' : dialRotate }],
            shadowColor: '#000', shadowOpacity: theme.dark ? 0.4 : 0.16, shadowRadius: 18, elevation: 6,
          }}>
            <LinearGradient colors={[theme.card, theme.card2]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              {['N', 'E', 'S', 'W'].map((d, i) => (
                <View key={d} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', transform: [{ rotate: `${i * 90}deg` }] }}>
                  <Text style={{ marginTop: 12, color: d === 'N' ? theme.danger : theme.sub, fontWeight: '900', fontSize: 19 }}>{d}</Text>
                </View>
              ))}
              {Array.from({ length: 72 }).map((_, i) => (
                <View key={i} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', transform: [{ rotate: `${i * 5}deg` }] }}>
                  <View style={{
                    marginTop: 38, width: i % 9 === 0 ? 3 : 1.5,
                    height: i % 9 === 0 ? 18 : i % 3 === 0 ? 11 : 6,
                    borderRadius: 2,
                    backgroundColor: i % 9 === 0 ? theme.primary : theme.border,
                  }} />
                </View>
              ))}
              <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', transform: [{ rotate: `${bearing}deg` }] }}>
                <View style={{ marginTop: 46, alignItems: 'center' }}>
                  <View style={{
                    width: 46, height: 46, borderRadius: 14, backgroundColor: '#0E0E0E',
                    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.accent,
                    shadowColor: theme.accent, shadowOpacity: 0.6, shadowRadius: 10,
                  }}>
                    <Text style={{ fontSize: 22 }}>🕋</Text>
                  </View>
                  <View style={{ width: 5, height: SIZE / 2 - 104, backgroundColor: theme.accent, borderRadius: 3, marginTop: 5 }} />
                </View>
              </View>
              <View style={{ position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: theme.card, borderWidth: 3, borderColor: theme.primary }} />
            </LinearGradient>
          </Animated.View>
          <View style={{ position: 'absolute', top: -16, alignItems: 'center' }}>
            <Ionicons name="caret-down" size={32} color={aligned ? theme.success : theme.primary} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: heading == null ? theme.sub : accColor }} />
            <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>
              {heading == null ? t('qibla_live') : `${t('qibla_accuracy')}: ${accLabel}`}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }}>
            <Ionicons name="location" size={13} color={theme.primary} />
            <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>{heading == null ? '—' : `${heading.toFixed(0)}°`}</Text>
          </View>
        </View>

        <Card style={{ alignSelf: 'stretch', alignItems: 'center', gap: 4 }}>
          <Txt v="caption" sub center>{t('qibla_direction')}</Txt>
          <Text style={{ color: aligned ? theme.success : theme.primary, fontSize: 42, fontWeight: '900' }}>{bearing.toFixed(1)}°</Text>
          <Txt v="small" sub center>{t('degrees_from_north')}</Txt>
          <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.border, marginVertical: 10 }} />
          <Txt v="small" sub center>{t('distance_kaaba')}: {Math.round(dist).toLocaleString()} km</Txt>
        </Card>

        {heading == null ? (
          <Card style={{ alignSelf: 'stretch', gap: 10 }}>
            <Txt v="small" sub center>{state === 'denied' ? t('qibla_unavailable') : t('qibla_unavailable')}</Txt>
            <Button label={t('qibla_enable')} icon="compass" onPress={start} kind="soft" />
          </Card>
        ) : aligned ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 }}>
            <Ionicons name="checkmark-circle" size={24} color={theme.success} />
            <Text style={{ color: theme.success, fontWeight: '900', fontSize: 16 }}>{t('qibla_aligned')}</Text>
          </View>
        ) : (
          <Txt v="small" sub center style={{ paddingHorizontal: 10 }}>{t('qibla_rotate')}</Txt>
        )}

        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: 6 }}>
          <Ionicons name="information-circle" size={18} color={theme.sub} />
          <Txt v="small" sub style={{ flex: 1 }}>{t('qibla_tip')}</Txt>
        </View>
      </View>
    </View>
  );
}
