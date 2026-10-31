import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useApp } from './settings';
import { notificationsSupported } from './notifications';
import { isAlarmDue } from './alarmClock';
import type { PrayerKey } from './prayer';

type AlarmData = {
  kind: 'prayer' | 'alarm';
  prayer?: PrayerKey | string;
  alarmId?: string;
  label?: string;
  title?: string;
  body?: string;
  time?: string;
} | null;

type AlarmCtx = {
  visible: boolean;
  data: AlarmData;
  show: (d?: Omit<NonNullable<AlarmData>, 'kind'> & { kind?: 'prayer' }) => void;
  showAlarm: (d: { alarmId?: string; label?: string; title?: string; body?: string; time?: string }) => void;
  hide: () => void;
  snooze: () => void;
};

const Ctx = createContext<AlarmCtx>({
  visible: false,
  data: null,
  show: () => {},
  showAlarm: () => {},
  hide: () => {},
  snooze: () => {},
});

const SNOOZE_MIN = 5;

export function useAlarm() {
  return useContext(Ctx);
}

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const { s } = useApp();
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<AlarmData>(null);
  const fired = useRef<Set<string>>(new Set());
  const snoozeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alarmsRef = useRef(s.alarms);
  alarmsRef.current = s.alarms;

  const show = (d?: Omit<NonNullable<AlarmData>, 'kind'> & { kind?: 'prayer' }) => {
    setData({ kind: 'prayer', ...(d || {}) } as AlarmData);
    setVisible(true);
  };

  const showAlarm = (d: { alarmId?: string; label?: string; title?: string; body?: string; time?: string }) => {
    setData({ kind: 'alarm', ...d });
    setVisible(true);
  };

  const hide = () => setVisible(false);

  const snooze = () => {
    const d = data;
    setVisible(false);
    if (snoozeTimer.current) clearTimeout(snoozeTimer.current);
    snoozeTimer.current = setTimeout(() => {
      setData(d ? { ...d } : { kind: 'alarm' });
      setVisible(true);
    }, SNOOZE_MIN * 60 * 1000);
    if (notificationsSupported) {
      Notifications.scheduleNotificationAsync({
        content: {
          title: d?.title || 'Alarm',
          body: d?.label || d?.body || '',
          sound: 'default',
          data: { type: 'alarm', alarmId: d?.alarmId, label: d?.label },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: SNOOZE_MIN * 60, channelId: 'alarm' },
      }).catch(() => {});
    }
  };

  // In-app alarm engine: rings while the app is open even without OS notifications.
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const key = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
      for (const a of alarmsRef.current) {
        if (!isAlarmDue(a, now)) continue;
        const stamp = `${a.id}:${key}`;
        if (fired.current.has(stamp)) continue;
        fired.current.add(stamp);
        setData({ kind: 'alarm', alarmId: a.id, label: a.label, title: 'Alarm', time: `${a.h}:${String(a.m).padStart(2, '0')}` });
        setVisible(true);
      }
      if (fired.current.size > 200) fired.current = new Set();
    };
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!notificationsSupported) return;

    const sub1 = Notifications.addNotificationResponseReceivedListener((response) => {
      const content = response.notification.request.content;
      const d: any = content.data || {};
      if (d.type === 'alarm') {
        showAlarm({ alarmId: d.alarmId, label: d.label || content.body || undefined, title: content.title || undefined });
        return;
      }
      show({ prayer: d.prayer || 'fajr', title: content.title || undefined, body: content.body || undefined });
    });

    const sub2 = Notifications.addNotificationReceivedListener((notification) => {
      const content = notification.request.content;
      const d: any = content.data || {};
      if (d.type === 'alarm') {
        showAlarm({ alarmId: d.alarmId, label: d.label || content.body || undefined, title: content.title || undefined });
      } else if (d.type === 'adhan' || d.prayer) {
        show({ prayer: d.prayer || 'fajr', title: content.title || undefined, body: content.body || undefined });
      }
    });

    const sub3 = AppState.addEventListener('change', () => {});

    return () => {
      sub1.remove();
      sub2.remove();
      sub3.remove();
      if (snoozeTimer.current) clearTimeout(snoozeTimer.current);
    };
  }, []);

  return (
    <Ctx.Provider value={{ visible, data, show, showAlarm, hide, snooze }}>
      {children}
    </Ctx.Provider>
  );
}
