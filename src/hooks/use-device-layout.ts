import { useWindowDimensions } from 'react-native';

export function useDeviceLayout() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;

  return {
    width,
    height,
    isLandscape,
    isTablet,
    isLargeTablet,
  };
}
