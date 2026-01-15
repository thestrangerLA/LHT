
import { QueryConstraint, where, orderBy } from "firebase/firestore";

/**
 * ป้องกัน orderBy field ที่เป็น null
 */
export function safeOrderBy(
  field: string,
  direction: "asc" | "desc" = "desc"
): QueryConstraint[] {
  return [
    where(field, "!=", null),
    orderBy(field, direction),
  ];
}
