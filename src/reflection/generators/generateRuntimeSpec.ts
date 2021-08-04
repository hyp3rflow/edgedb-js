import type {GeneratorParams} from "../generate";

export const generateRuntimeSpec = async (params: GeneratorParams) => {
  const {dir, types} = params;

  const spec = dir.getPath("__spec__.ts");
  spec.addImport(`import {reflection as $} from "edgedb";`);
  spec.writeln([`export const spec: $.introspect.Types = new $.StrictMap();`]);
  spec.nl();

  for (const type of types.values()) {
    spec.writeln([`spec.set("${type.id}", ${JSON.stringify(type)} as any)`]);
  }
};