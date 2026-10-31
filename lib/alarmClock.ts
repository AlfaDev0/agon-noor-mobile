export interface AlarmItem {
  id: string;
  h: number;
  m: number;
  label: string;
  days: number[];
  enabled: boolean;
  sound: boolean;
  vibrate: boolean;
}

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export function newAlarm(h = 6, m = 30): AlarmItem {
  return {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    h, m, label: '', days: [...ALL_DAYS], enabled: true, sound: true, vibrate: true,
  };
}

export function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function alarmLabel(a: AlarmItem) {
  return a.label.trim();
}

/** Next occurrence of the alarm after `from`, respecting repeat days. */
export function nextOccurrence(a: AlarmItem, from: Date): Date | null {
  const days = a.days.length ? a.days : ALL_DAYS;
  for (let add = 0; add <= 8; add++) {
    const d = new Date(from.getTime());
    d.setDate(d.getDate() + add);
    d.setHours(a.h, a.m, 0, 0);
    if (d.getTime() <= from.getTime()) continue;
    if (days.includes(d.getDay())) return d;
  }
  return null;
}

export function daysSummary(days: number[], dailyLabel: string): string {
  if (days.length === 7 || days.length === 0) return dailyLabel;
  return days.slice().sort((x, y) => x - y).map((d) => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d]).join(' · ');
}

export function isAlarmDue(a: AlarmItem, now: Date): boolean {
  if (!a.enabled) return false;
  const days = a.days.length ? a.days : ALL_DAYS;
  return days.includes(now.getDay()) && now.getHours() === a.h && now.getMinutes() === a.m;
}
