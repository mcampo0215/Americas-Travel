import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getDeviceLayout } from '@/utils/device-layout';

export function useDeviceLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return getDeviceLayout(width - insets.left - insets.right, height - insets.top - insets.bottom, fontScale);
}
