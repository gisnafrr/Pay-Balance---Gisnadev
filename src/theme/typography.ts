export const FONTS = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const TEXT_STYLES = {
  heroAmount: {
    fontFamily: FONTS.extraBold,
    fontSize: 34,
    letterSpacing: -1.1,
    fontVariant: ['tabular-nums' as const],
  },
  h1: {
    fontFamily: FONTS.extraBold,
    fontSize: 22,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  caption: {
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
  label: {
    fontFamily: FONTS.semiBold,
    fontSize: 11.5,
    letterSpacing: 0.2,
  },
  amount: {
    fontFamily: FONTS.bold,
    fontVariant: ['tabular-nums' as const],
    letterSpacing: -0.3,
  },
};
