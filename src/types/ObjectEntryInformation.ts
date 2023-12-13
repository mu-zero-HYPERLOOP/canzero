

export interface ObjectEntryCompositeType {
  // name of the composite type (name of the struct)
  name: string,
  // map of name -> type
  attributes: { [key: string]: ObjectEntryType },
}

// string[] for enums
export type ObjectEntryType = "int" | "uint" | "real" | string[] | ObjectEntryCompositeType;

export function isInt(value: any): value is "int" {
  return value === "int";
}
export function isUint(value: any): value is "uint" {
  return value === "uint";
}
export function isReal(value: any): value is "real" {
  return value === "real";
}
export function isStringArray(value: any): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isObjectEntryCompositeType(value: any): value is ObjectEntryCompositeType {
  return typeof value === "object" && value !== null && "name" in value && "attributes" in value;
}

export interface ObjectEntryInformation {
  name: string,
  description?: string,
  id: number,
  unit?: string,
  ty: ObjectEntryType,
}
