// Field descriptors

import { FieldTypeString } from "./data-types.ts";

/*
type?: FieldTypeString;
primaryKey?: boolean;
unique?: boolean;
autoIncrement?: boolean;
length?: number;
allowNull?: boolean;
precision?: number;
scale?: number;
values?: (number | string)[];
*/

export class DataTypeBuilder {
  // IDEA: on pourrait regarder si typeof DataTypeBuilder
  // alors faire instance.toType()
  // et donc mettre tous ces fields en privé

  fullType: {
    type?: FieldTypeString;
    primaryKey?: boolean;
    length?: number;
    unique?: boolean;
    allowNull?: boolean;
    autoIncrement?: boolean;
    precision?: number;
    scale?: number;
    values?: (number | string)[]; // TODO: change
  } = {};

  constructor(type: FieldTypeString) {
    this.fullType.type = type;
  }

  unique() {
    this.fullType.unique = true;
    return this;
  }

  primary() {
    this.fullType.primaryKey = true;
    return this;
  }

  nullable() {
    this.fullType.allowNull = true;
    return this;
  }

  notNullable() {
    this.fullType.allowNull = false;
    return this;
  }

  autoIncrement() {
    this.fullType.autoIncrement = true;
    return this;
  }

  toType() {
    return this.fullType;
  }
}

// DataTypes.string(25)
//   .unique()
//   .primary()
//   .nullable()
//   .notNullable()
//   .autoIncrement()
