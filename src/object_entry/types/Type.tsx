

export type TypeId = "int" | "uint" | "real" | "enum" | "struct"


export interface Type {
  id : TypeId,
  info : TypeInfo
}

export type TypeInfo = IntTypeInfo | UIntTypeInfo | RealTypeInfo | EnumTypeInfo | StructTypeInfo;


export interface IntTypeInfo {
  bit_size : number
}

export interface UIntTypeInfo {
  bit_size : number
}

export interface RealTypeInfo {
  bit_size : number,
  min : number,
  max : number
}

export interface EnumTypeInfo {
  name : string,
  variants : string[]
}

export interface StructTypeInfo {
  name : string,
  attributes : { [name : string] : Type}
}
