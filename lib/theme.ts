export type ThemeId = 'green' | 'blue' | 'gold' | 'dark' | 'light' | 'purple' | 'sunset';

export interface Theme {
  id: ThemeId;
  dark: boolean;
  bg: string;
  card: string;
  card2: string;
  text: string;
  sub: string;
  primary: string;
  primaryDark: string;
  onPrimary: string;
  accent: string;
  border: string;
  danger: string;
  success: string;
  grad: [string, string];
}

export const THEMES: Record<ThemeId, Theme> = {
  green: {
    id: 'green', dark: false, bg: '#F1F7F3', card: '#FFFFFF', card2: '#E5F1EA', text: '#10261B', sub: '#5C7367',
    primary: '#0F7B4F', primaryDark: '#0A5C3B', onPrimary: '#FFFFFF', accent: '#D4AF37', border: '#D6E6DC',
    danger: '#C62828', success: '#16A34A', grad: ['#0F7B4F', '#064A30'],
  },
  blue: {
    id: 'blue', dark: false, bg: '#F0F4FC', card: '#FFFFFF', card2: '#E2EAFA', text: '#0F1B3D', sub: '#5A6A8F',
    primary: '#1D4ED8', primaryDark: '#1E3A8A', onPrimary: '#FFFFFF', accent: '#F5B942', border: '#D4DEF3',
    danger: '#C62828', success: '#16A34A', grad: ['#2457E6', '#14246B'],
  },
  gold: {
    id: 'gold', dark: false, bg: '#FBF6E9', card: '#FFFDF7', card2: '#F5EAC9', text: '#2B2108', sub: '#7D6B3C',
    primary: '#B5830B', primaryDark: '#85600A', onPrimary: '#FFFFFF', accent: '#0F7B4F', border: '#EBDDB1',
    danger: '#C62828', success: '#16A34A', grad: ['#D4A21A', '#7A5608'],
  },
  dark: {
    id: 'dark', dark: true, bg: '#09100D', card: '#121C18', card2: '#1A2823', text: '#E9F2EE', sub: '#8CA399',
    primary: '#2FBF85', primaryDark: '#1E8F63', onPrimary: '#04140D', accent: '#E0B84F', border: '#22332C',
    danger: '#F0625D', success: '#34D399', grad: ['#126B4B', '#0A3A2A'],
  },
  light: {
    id: 'light', dark: false, bg: '#F6F7F9', card: '#FFFFFF', card2: '#EDF0F4', text: '#18202B', sub: '#677386',
    primary: '#0E7490', primaryDark: '#0B566B', onPrimary: '#FFFFFF', accent: '#E08A00', border: '#E1E5EB',
    danger: '#C62828', success: '#16A34A', grad: ['#1394B5', '#0B566B'],
  },
  purple: {
    id: 'purple', dark: true, bg: '#120A1F', card: '#1D1233', card2: '#281A45', text: '#F1E9FF', sub: '#A392C4',
    primary: '#A78BFA', primaryDark: '#7C5CE0', onPrimary: '#150B26', accent: '#F0ABFC', border: '#33224F',
    danger: '#FB7185', success: '#34D399', grad: ['#7C3AED', '#2E1065'],
  },
  sunset: {
    id: 'sunset', dark: false, bg: '#FFF5EE', card: '#FFFFFF', card2: '#FFE8D9', text: '#33170B', sub: '#8A6350',
    primary: '#E4572E', primaryDark: '#B33F1C', onPrimary: '#FFFFFF', accent: '#F2A93B', border: '#F6D9C6',
    danger: '#C62828', success: '#16A34A', grad: ['#F2A93B', '#C2410C'],
  },
};

export const THEME_ORDER: ThemeId[] = ['green', 'blue', 'gold', 'dark', 'light', 'purple', 'sunset'];
