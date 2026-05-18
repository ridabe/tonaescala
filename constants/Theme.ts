export const Typography = {
  display:    { fontSize: 30, lineHeight: 38, fontWeight: '700' as const },
  titleLg:    { fontSize: 26, lineHeight: 34, fontWeight: '700' as const },
  titleMd:    { fontSize: 22, lineHeight: 30, fontWeight: '700' as const },
  titleSm:    { fontSize: 18, lineHeight: 26, fontWeight: '600' as const },
  bodyLg:     { fontSize: 17, lineHeight: 26, fontWeight: '400' as const },
  body:       { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  caption:    { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  micro:      { fontSize: 11, lineHeight: 14, fontWeight: '700' as const },
} as const;

export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  // named aliases for readability
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
} as const;

export const Radius = {
  xs:   4,
  sm:   6,
  md:   8,
  lg:   12,
  full: 999,
} as const;

export const Layout = {
  screenPadding:   16,
  cardGap:         12,
  sectionGap:      24,
  headerHeight:    56,
  bottomTabHeight: 64,
  minTouchTarget:  44,
} as const;
