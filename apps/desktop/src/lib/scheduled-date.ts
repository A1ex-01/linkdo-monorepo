const LOCAL_DATE_TIME = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?$/;

// Converts the value emitted by datetime-local into the API's local datetime
// contract. Do not use Date or toISOString here: both would change timezones.
export function toScheduledDateRequest(value: string): string {
  const match = LOCAL_DATE_TIME.exec(value);
  if (!match) {
    throw new Error("scheduled date must be a local datetime");
  }
  return `${match[1]} ${match[2]}:${match[3] ?? "00"}`;
}

export function toScheduledDateInput(value?: string): string {
  if (!value) return "";
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?/.exec(value);
  if (!match) return "";
  return `${match[1]}T${match[2]}:${match[3] ?? "00"}`;
}
