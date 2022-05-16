export function expiredAtSeconds(seconds: number, date = new Date()): Date {
  return new Date(+date + seconds * 1000);
}
