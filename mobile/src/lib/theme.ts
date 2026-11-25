/**
 * Lighter palette built from the Android icon.
 * icon.png is #FD7C55 (872,595 of 1,048,576 pixels) with a white mark.
 * adaptive-icon.png is that white mark on transparency, painted on #FD7C55.
 *
 * White on #FD7C55 is about 2.6:1, below WCAG AA for large text (3:1).
 * #FD7C55 on #FFE4DA is about 2.1:1, and on #FFF4F0 about 2.4:1.
 * Near-black #1C1917 on #FD7C55 is about 6.8:1, and on #FFF4F0 about 16:1.
 * Buttons use the softer coral #FB8A68 with dark labels. Selected chips use
 * the light tint with a coral border and dark labels (coral text on the tint
 * is about 2.1:1, below large-text AA).
 */
export const theme = {
  /** Icon field. Buttons, logo, active icons, and chip borders. */
  brand: '#FD7C55',
  /** Softer button fill. Dark text on it is about 7.4:1. */
  button: '#FB8A68',
  /** Selected chips, tabs, and the credits pill. */
  tint: '#FFE4DA',
  /** Page, header, and the status-bar strip. */
  page: '#FFF4F0',
  /** Cards and the Google button stay white. */
  card: '#FFFFFF',
  ink: '#1C1917',
  muted: '#57534E',
  line: '#E7E5E4',
} as const;
