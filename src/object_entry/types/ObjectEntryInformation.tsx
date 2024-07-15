import {IntTypeInfo, RealTypeInfo, Type, UIntTypeInfo} from "./Type";

export interface ObjectEntryInformation {
  name: string,
  description?: string,
  friend?: string,
  id: number,
  unit?: string,
  ty: Type,
  plottable: boolean,
}

export function getMax(info: ObjectEntryInformation | undefined) {
  let max: number = 0

  switch (info?.ty.id) {
    case "uint": {
      const typeInfo = info?.ty.info as UIntTypeInfo;
      const bitSize = typeInfo.bit_size;
      max = Math.pow(2, bitSize) - 1; // NOTE might have some minor rounding errors.
      break
    }
    case "int": {
      const typeInfo = info?.ty.info as IntTypeInfo;
      const bitSize = typeInfo.bit_size;
      max = Math.pow(2, bitSize - 1) - 1; // NOTE might have some minor rounding errors.
      break
    }
    case "real": {
      const typeInfo = info?.ty.info as RealTypeInfo;
      max = typeInfo.max
    }
  }
  return max
}


export function getMin(info: ObjectEntryInformation | undefined) {
  let min: number = 0

  switch (info?.ty.id) {
    case "uint": {
      break
    }
    case "int": {
      const typeInfo = info?.ty.info as IntTypeInfo;
      const bitSize = typeInfo.bit_size;
      min = -Math.pow(2, bitSize - 1); // NOTE might have some minor rounding errors.
      break
    }
    case "real": {
      const typeInfo = info?.ty.info as RealTypeInfo;
      min = typeInfo.min
    }
  }
  return min
}


