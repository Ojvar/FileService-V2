export const enumNumberFilterFnc = (x: unknown) => !isNaN(Number(x));
export const enumStringFilterFnc = (x: unknown) => typeof x === 'string';

export function enumKeys(
  enumValue: Object,
  filterFnc = enumNumberFilterFnc,
): Array<string> {
  return Object.keys(enumValue).filter(filterFnc);
}

export function enumValues(
  enumValue: Object,
  filterFnc = enumNumberFilterFnc,
): Array<string> {
  return Object.values(enumValue).filter(filterFnc);
}

export function enumValuesNumber(
  enumValue: Object,
  filterFnc = enumNumberFilterFnc,
): Array<number> {
  return Object.keys(enumValue)
    .filter(filterFnc)
    .map(x => +x);
}
