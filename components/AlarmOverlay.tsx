import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAlarm } from '../lib/alarm';
import { useApp } from '../lib/settings';
import { playAlarmSound, stopAlarmSound } from '../lib/alarmAudio';

const { width, height } = Dimensions.get('window');

const CRACKS = [
  { a: 8, l: 260, w: 2.5, o: 0.9 },
  { a: 28, l: 190, w: 1.6, o: 0.7 },
  { a: 52, l: 240, w: 2, o: 0.65 },
  { a: 74, l: 150, w: 1.2, o: 0.5 },
  { a: 96, l: 280, w: 2.2, o: 0.8 },
  { a: 118, l: 200, w: 1.4, o: 0.55 },
  { a: 141, l: 260, w: 2, o: 0.7 },
  { a: 163, l: 170, w: 1.2, o: 0.5 },
  { a: 187, l: 300, w: 2.6, o: 0.9 },
  { a: 209, l: 210, w: 1.5, o: 0.6 },
  { a: 232, l: 250, w: 2, o: 0.7 },
  { a: 254, l: 160, w: 1.2, o: 0.45 },
  { a: 278, l: 290, w: 2.4, o: 0.85 },
  { a: 301, l: 220, w: 1.6, o: 0.6 },
  { a: 324, l: 180, w: 1.2, o: 0.5 },
  { a: 347, l: 300, w: 2.6, o: 0.9 },
];

export default function AlarmOverlay() {
  const { visible, data, hide, snooze } = useAlarm();
  const { t } = useApp();
  const isAlarm = data?.kind === 'alarm';

  const [progress] = useState(() => new Animated.Value(0));
  const [cracks] = useState(() => new Animated.Value(0));
  const [flash] = useState(() => new Animated.Value(0));
  const [shake] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(0));
  const [wave] = useState(() => new Animated.Value(0));
  const [glow] = useState(() => new Animated.Value(0));
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);

  const stopEverything = () => {
    stopAlarmSound().catch(() => {});
    timers.current.forEach(clearInterval);
    timers.current = [];
  };

  useEffect(() => {
    if (!visible || !isAlarm) return;

    progress.setValue(0);
    cracks.setValue(0);
    flash.setValue(1);
    shake.setValue(0);
    pulse.setValue(0);
    wave.setValue(0);
    glow.setValue(0);

    playAlarmSound().catch(() => {});

    Animated.sequence([
      Animated.timing(flash, { toValue: 0.75, duration: 60, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(80),
      Animated.timing(shake, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 90, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0.6, duration: 80, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();

    Animated.timing(cracks, { toValue: 1, duration: 900, delay: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    Animated.timing(progress, { toValue: 1, duration: 7000, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();

    const loops = [
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(wave, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(wave, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])),
    ];
    loops.forEach((l) => l.start());

    const h = setInterval(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 220);
    }, 1200);
    timers.current.push(h);

    return () => {
      loops.forEach((l) => l.stop());
      stopEverything();
    };
  }, [visible, isAlarm, progress, cracks, flash, shake, pulse, wave, glow]);

  if (!visible || !isAlarm) return null;

  const waterHeight = progress.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.92] });
  const waveShift = wave.interpolate({ inputRange: [0, 1], outputRange: [-40, 40] });
  const shakeX = shake.interpolate({ inputRange: [-1, 0, 1], outputRange: [-14, 0, 14] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.65] });
  const crackScale = cracks.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => { stopEverything(); hide(); }}>
      <Animated.View style={[styles.root, { transform: [{ translateX: shakeX }] }]}>
        <LinearGradient colors={['#071A2B', '#0B2E4A', '#123B63']} style={StyleSheet.absoluteFill} />

        <Animated.View style={[styles.glow, { opacity: glowOpacity, backgroundColor: '#5AD7FF' }]} pointerEvents="none" />

        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#EAF9FF', opacity: flash }]} pointerEvents="none" />

        {/* water body */}
        <Animated.View style={[styles.water, { height: waterHeight }]} pointerEvents="none">
          <LinearGradient colors={['rgba(90,215,255,0.55)', 'rgba(30,120,200,0.85)', 'rgba(10,50,110,0.95)']} style={StyleSheet.absoluteFill} />
          <Animated.View style={[styles.waveBack, { transform: [{ translateX: waveShift }] }]} />
          <Animated.View style={[styles.waveFront, { transform: [{ translateX: Animated.multiply(waveShift, -1) }] }]} />
          <Animated.View style={[styles.shine, { opacity: glowOpacity }]} />
        </Animated.View>

        {/* rising bubbles */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Animated.View
            key={i}
            style={[styles.bubble, {
              left: (width / 6) * i + 10,
              width: 12 + (i % 4) * 9,
              height: 12 + (i % 4) * 9,
              bottom: 40 + i * 30,
              opacity: cracks,
              transform: [{ translateY: wave.interpolate({ inputRange: [0, 1], outputRange: [0, -60 - i * 18] }) }],
            }]}
            pointerEvents="none"
          />
        ))}

        {/* cracks */}
        <Animated.View style={[styles.crackLayer, { opacity: cracks, transform: [{ scale: crackScale }] }]} pointerEvents="none">
          {CRACKS.map((c, i) => (
            <View key={i} style={[styles.crackLine, { width: c.l, left: width / 2 - c.l / 2, opacity: c.o, transform: [{ rotate: `${c.a}deg` }] }]}>
              <View style={[styles.crackCore, { height: c.w }]} />
              <View style={[styles.crackBranch, { height: c.w * 0.6, transform: [{ rotate: `${20 + i * 3}deg` }] }]} />
            </View>
          ))}
          <View style={styles.crackHole} />
        </Animated.View>

        <View style={styles.content} pointerEvents="box-none">
          <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
            <View style={styles.iconWrap}>
              <Ionicons name="alarm" size={54} color="#E9FBFF" />
            </View>
          </Animated.View>
          <Text style={styles.kicker}>{data?.title || t('alarm_ringing')}</Text>
          {data?.time ? <Text style={styles.clock}>{data.time}</Text> : null}
          {data?.label ? <Text style={styles.label}>{data.label}</Text> : null}

          <TouchableOpacity activeOpacity={0.85} onPress={() => { stopEverything(); hide(); }} style={styles.stopBtn}>
            <LinearGradient colors={['#EAFFFB', '#9BE8FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.stopGradient}>
              <Ionicons name="stop" size={22} color="#062331" />
              <Text style={styles.stopText}>{t('alarm_stop')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} onPress={() => { stopEverything(); snooze(); }} style={styles.snoozeBtn}>
            <Ionicons name="time-outline" size={20} color="#DDF5FF" />
            <Text style={styles.snoozeText}>{t('alarm_snooze')}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  glow: { position: 'absolute', width: width * 1.4, height: width * 1.4, borderRadius: width * 0.7, top: -width * 0.3, left: -width * 0.2 },
  water: { position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  waveBack: {
    position: 'absolute', top: -34, left: -80, width: width + 160, height: 70, borderRadius: 40,
    backgroundColor: 'rgba(140,235,255,0.35)',
  },
  waveFront: {
    position: 'absolute', top: -22, left: -60, width: width + 120, height: 54, borderRadius: 34,
    backgroundColor: 'rgba(210,248,255,0.30)',
  },
  shine: { position: 'absolute', left: 0, right: 0, top: 0, height: 8, backgroundColor: '#D9FAFF' },
  bubble: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(210,250,255,0.35)', borderWidth: 1, borderColor: 'rgba(230,252,255,0.65)' },
  crackLayer: { position: 'absolute', alignItems: 'center', justifyContent: 'center', width: width, height: height },
  crackLine: { position: 'absolute', height: 3, top: height / 2 },
  crackCore: { flex: 1, backgroundColor: 'rgba(240,253,255,0.95)', borderRadius: 2 },
  crackBranch: { position: 'absolute', left: '30%', top: 0, width: '40%', backgroundColor: 'rgba(190,240,255,0.7)', borderRadius: 2 },
  crackHole: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(235,252,255,0.9)', shadowColor: '#BFF3FF', shadowOpacity: 1, shadowRadius: 18, shadowOffset: { width: 0, height: 0 } },
  content: { alignItems: 'center', paddingHorizontal: 26, width: '100%' },
  iconWrap: {
    width: 106, height: 106, borderRadius: 53, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(120,225,255,0.18)', borderWidth: 1.5, borderColor: 'rgba(200,248,255,0.65)',
    shadowColor: '#8DEBFF', shadowOpacity: 0.55, shadowRadius: 28, shadowOffset: { width: 0, height: 0 }, marginBottom: 18,
  },
  kicker: { color: '#BFEFFF', fontSize: 15, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  clock: { color: '#FFFFFF', fontSize: 64, fontWeight: '900', letterSpacing: 1, textShadowColor: 'rgba(0,20,40,0.5)', textShadowRadius: 18 },
  label: { color: '#E6FAFF', fontSize: 20, fontWeight: '700', marginTop: 4, marginBottom: 30, textAlign: 'center' },
  stopBtn: { width: '86%', borderRadius: 999, overflow: 'hidden', marginTop: 8 },
  stopGradient: { paddingVertical: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  stopText: { color: '#062331', fontSize: 20, fontWeight: '900' },
  snoozeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 24, marginTop: 12, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(200,248,255,0.45)' },
  snoozeText: { color: '#DDF5FF', fontSize: 16, fontWeight: '700' },
});
