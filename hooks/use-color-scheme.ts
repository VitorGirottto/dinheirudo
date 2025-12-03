import { useColorScheme as _useColorScheme } from "react-native";

/**
 * Retorna o tema atual do sistema (light/dark) de forma segura.
 */
export function useColorScheme() {
  return _useColorScheme() ?? "light";
}
