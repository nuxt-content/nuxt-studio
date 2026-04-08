const westSlavicPluralization = (choice: number): number => {
  if (choice === 0 || choice >= 5) return 2

  if (choice === 1) return 0

  return 1
}

export const i18nPluralizationRulesMap: Record<string, (choice: number) => number> = {
  sk: westSlavicPluralization,
  cs: westSlavicPluralization,
}
