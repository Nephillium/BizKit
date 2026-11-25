/**
 * Website palette from styles/globals.css (the Next.js theme on
 * pitchcrafter.glmlabs.io). RGB channels there are:
 * background 250 250 250, foreground 15 23 42, primary 99 102 241,
 * primary-foreground 255 255 255, muted-foreground 100 116 139,
 * border 226 232 240. Selected length chips on the site use
 * rgb(238, 242, 255) with a primary border.
 *
 * White on #6366F1 is 4.47:1, just under WCAG AA for normal text (4.5:1).
 * Button fills use #6265EF, the same primary scaled one step toward black,
 * where white is 4.54:1. #6366F1 on #EEF2FF is 3.99:1, so chip labels use
 * #0F172A (about 16:1) with a primary border. #0F172A on #FAFAFA is about 17:1.
 */
export const theme = {
  /** Website --primary. Logo, borders, active icons, splash, and the icon field. */
  brand: '#6366F1',
  /** Primary darkened so white labels clear WCAG AA. */
  button: '#6265EF',
  /** Website primary-foreground. */
  onButton: '#FFFFFF',
  /** Website selected-chip fill (indigo-50). */
  tint: '#EEF2FF',
  /** Website --background. Page, header, and the status-bar strip. */
  page: '#FAFAFA',
  /** Website --card. */
  card: '#FFFFFF',
  /** Website --foreground. */
  ink: '#0F172A',
  /** Website --muted-foreground. */
  muted: '#64748B',
  /** Website --border. */
  line: '#E2E8F0',
} as const;
