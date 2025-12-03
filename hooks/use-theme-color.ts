import { useColorScheme } from "./use-color-scheme";
import { Colors } from "@/constants/theme";

/**
 * Hook que retorna uma cor baseada no tema atual.
 * Se o tema for "light", retorna a cor clara; se for "dark", a cor escura.
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  return Colors[theme][colorName];
}
