export interface ResultFrame {
  y: number;
  height: number;
}

/** The result card is in view when it overlaps the viewport by more than a sliver. */
export function isResultCardInView(
  frame: ResultFrame | null,
  scrollY: number,
  viewportHeight: number,
): boolean {
  if (!frame || viewportHeight <= 0 || frame.height <= 0) return false;
  const top = frame.y;
  const bottom = frame.y + frame.height;
  return bottom > scrollY + 24 && top < scrollY + viewportHeight - 24;
}
