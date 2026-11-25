/**
 * Palette taken from the Android icon assets.
 * icon.png is #FD7C55 (872,595 of 1,048,576 pixels) with a white mark.
 * adaptive-icon.png is that white mark on transparency, and app.json paints
 * it on #FD7C55. White on #FD7C55 is about 2.6:1, so small text and button
 * labels use #C2410C (about 5.2:1 with white, and as text on white).
 * Near-black #1C1917 on the icon coral is about 6.8:1.
 */
export const theme = {
  brand: '#FD7C55',
  primary: '#C2410C',
  onBrand: '#1C1917',
  onPrimary: '#FFFFFF',
  page: '#FFFFFF',
  ink: '#1C1917',
  muted: '#57534E',
  line: '#E7E5E4',
  surface: '#F5F5F4',
} as const;
