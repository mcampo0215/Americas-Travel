/** Layout follows the usable window, including iPad multitasking and rotation. */
export function getDeviceLayout(width: number, height: number, fontScale = 1) {
  const isLandscape = width > height;
  const isTablet = width >= 700 && height >= 600;

  return {
    width,
    height,
    fontScale,
    isLandscape,
    isTablet,
    isLargeTablet: isTablet && width >= 1024,
    // Leave enough room for both the catalog and its summary at larger text sizes.
    useColumns: isTablet && width >= 1000 && fontScale <= 1.3,
    compactContentWidth: isLandscape ? 700 : 430,
  };
}
