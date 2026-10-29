import { Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const ADHAN_URL = 'https://www.islamcan.com/audio/adhan/azan1.mp3';

let player: AudioPlayer | null = null;
let playing = false;

export async function playAdhan() {
  try {
    if (Platform.OS === 'web') {
      try {
        const a = new (window as any).Audio(ADHAN_URL);
        a.volume = 1.0;
        a.loop = true;
        (a as any).play().catch(() => {});
        (globalThis as any).__ADHAN_AUDIO__ = a;
        playing = true;
        return;
      } catch (e) {}
      return;
    }
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      shouldRouteThroughEarpiece: false,
    });
    if (player) {
      try {
        player.pause();
        player.remove();
      } catch (e) {}
      player = null;
    }
    const p = createAudioPlayer({ uri: ADHAN_URL });
    p.loop = true;
    p.volume = 1.0;
    p.play();
    player = p;
    playing = true;
  } catch (e) {
    // لو مفيش إنترنت أو خطأ، نكمل بدون صوت
  }
}

export async function stopAdhan() {
  try {
    if (Platform.OS === 'web') {
      const a = (globalThis as any).__ADHAN_AUDIO__;
      if (a) {
        try { a.pause(); a.currentTime = 0; } catch (e) {}
        (globalThis as any).__ADHAN_AUDIO__ = null;
      }
      playing = false;
      return;
    }
    if (player) {
      try {
        player.pause();
        player.remove();
      } catch (e) {}
      player = null;
    }
    playing = false;
  } catch (e) {
    playing = false;
  }
}

export function isPlaying() {
  return playing;
}
