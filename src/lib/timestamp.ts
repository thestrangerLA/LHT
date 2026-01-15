
import { Timestamp } from "firebase/firestore";

export function toDateSafe(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value.seconds && typeof value.seconds === 'number') {
    return new Timestamp(value.seconds, value.nanoseconds).toDate();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }
  return null;
}
