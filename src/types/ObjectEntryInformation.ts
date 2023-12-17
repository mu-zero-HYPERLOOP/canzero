

export interface ObjectEntryCompositeType {
  // name of the composite type (name of the struct)
  name: string,
  // map of name -> type
  attributes: { name : string, type : ObjectEntryType}[],
}

// string[] for enums
export type ObjectEntryType = "int" | "uint" | "real" | string[] | ObjectEntryCompositeType;

export interface ObjectEntryInformation {
  name: string,
  description?: string,
  id: number,
  unit?: string,
  ty: ObjectEntryType,
}
