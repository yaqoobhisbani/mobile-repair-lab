import { useSettings } from "./use-settings"

export function useNavPrice(): number {
  const { data: settings } = useSettings()
  const price = settings?.navPrice ? parseFloat(settings.navPrice) : 1000
  return price > 0 ? price : 1000
}
