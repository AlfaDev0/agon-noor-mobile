import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../lib/settings';
import { getSecure, setSecure, verifyPin } from '../lib/storage';
import { PinPad } from './PinPad';
import { PalestineFlag } from './PalestineFlag';
import { Txt } from './ui';

interface LockState { fails: number; until: number }

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { s, t, theme } = useApp();
  const insets = useSafeAreaInsets();
  const [err, setErr] = useState<string | null>(null);
  const [state, setState] = useState<LockState>({ fails: 0, until: 0 });
  const [left, setLeft] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const untilRef = useRef(0);

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;
    (async () => {
      const v = await getSecure<LockState>('lock.v1');
      if (v) setState(v);
      untilRef.current = v?.until ?? 0;
      const upd = () => setLeft(Math.max(0, Math.ceil((untilRef.current - Date.now()) / 1000)));
      upd();
      id = setInterval(upd, 500);
    })();
    return () => { if (id) clearInterval(id); };
  }, []);

  const blocked = left > 0;

  const submit = async (pin: string) => {
    if (blocked || !s.pin) return;
    if (verifyPin(pin, s.pin)) {
      setErr(null);
      await setSecure('lock.v1', { fails: 0, until: 0 });
      setState({ fails: 0, until: 0 });
      setLeft(0);
      onUnlock();
      return;
    }
    const fails = state.fails + 1;
    // exponential back-off after 3 failures: 15s, 30s, 60s ... capped at 15 min
    const delay = fails >= 3 ? Math.min(900, 15 * 2 ** (fails - 3)) * 1000 : 0;
    const next = { fails, until: delay ? Date.now() + delay : 0 };
    untilRef.current = next.until;
    setState(next);
    setLeft(Math.max(0, Math.ceil(delay / 1000)));
    await setSecure('lock.v1', next);
    setErr(t('wrong_pin'));
    setResetKey((k) => k + 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top, gap: 18 }}>
      <PalestineFlag width={72} radius={6} />
      <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="lock-closed" size={34} color={theme.onPrimary} />
      </View>
      <Txt v="title" center>{t('app_name')}</Txt>
      <PinPad
        key={resetKey}
        title={t('enter_pin')} error={blocked ? t('locked_try_later', { n: left }) : err}
        onComplete={submit} disabled={blocked}
      />
    </View>
  );
}
