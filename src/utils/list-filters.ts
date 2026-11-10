export function normalizeFilterText(value?: string | number | null) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function matchesFilterSearch(search: string, values: Array<string | number | null | undefined>) {
  const normalizedSearch = normalizeFilterText(search);

  if (!normalizedSearch) {
    return true;
  }

  return values.some((value) => normalizeFilterText(value).includes(normalizedSearch));
}
