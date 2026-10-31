import { Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const ALARM_SRC = require('../assets/audio/alarm.wav');

let player: AudioPlayer | null = null;
let webAudio: any = null;

export async function playAlarmSound() {
  try {
    if (Platform.OS === 'web') {
      try {
        const mod: any = ALARM_SRC;
        const uri = mod?.uri ?? (typeof mod === 'string' ? mod : null);
        if (!uri) return;
        const a = new (window as any).Audio(uri);
        a.loop = true;
        a.volume = 1;
        a.play().catch(() => {});
        webAudio = a;
      } catch { /* autoplay blocked */ }
      return;
    }
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      shouldRouteThroughEarpiece: false,
    });
    if (player) {
      try { player.pause(); player.remove(); } catch { /* ignore */ }
      player = null;
    }
    const p = createAudioPlayer(ALARM_SRC);
    p.loop = true;
    p.volume = 1;
    p.play();
    player = p;
  } catch { /* keep silent */ }
}

export async function stopAlarmSound() {
  try {
    if (Platform.OS === 'web') {
      if (webAudio) { try { webAudio.pause(); webAudio.currentTime = 0; } catch { /* ignore */ } webAudio = null; }
      return;
    }
    if (player) {
      try { player.pause(); player.remove(); } catch { /* ignore */ }
      player = null;
    }
  } catch { /* ignore */ }
}
