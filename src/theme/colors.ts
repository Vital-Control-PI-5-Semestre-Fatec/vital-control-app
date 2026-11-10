import { Appearance } from 'react-native';

const lightColors = {
  background: '#EDF2F7',
  surface: '#C8D5E0',
  surfaceRaised: '#D7E1EA',
  primary: '#2D4F8E',
  secondary: '#1A7870',
  accent: '#1A8A7A',
  text: '#0C1B2E',
  textMuted: '#4A6580',
  border: '#B2C4D8',
  danger: '#C83E55',
  warning: '#9A6A00',
  white: '#FFFFFF',
} as const;

const darkColors = {
  background: '#0C1B2E',
  surface: '#0A2638',
  surfaceRaised: '#10364A',
  primary: '#5B9FE8',
  secondary: '#7EDBB0',
  accent: '#A0E8CA',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  border: '#1A3A52',
  danger: '#FF9CA8',
  warning: '#F3C969',
  white: '#FFFFFF',
} as const;

function activeColors() {
  return Appearance.getColorScheme() === 'dark' ? darkColors : lightColors;
}

export const colors = {
  get background() {
    return activeColors().background;
  },
  get surface() {
    return activeColors().surface;
  },
  get surfaceRaised() {
    return activeColors().surfaceRaised;
  },
  get primary() {
    return activeColors().primary;
  },
  get secondary() {
    return activeColors().secondary;
  },
  get accent() {
    return activeColors().accent;
  },
  get text() {
    return activeColors().text;
  },
  get textMuted() {
    return activeColors().textMuted;
  },
  get border() {
    return activeColors().border;
  },
  get danger() {
    return activeColors().danger;
  },
  get warning() {
    return activeColors().warning;
  },
  get white() {
    return activeColors().white;
  },
} as const;
