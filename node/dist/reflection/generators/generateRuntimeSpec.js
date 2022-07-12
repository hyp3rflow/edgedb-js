"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRuntimeSpec = void 0;
const builders_1 = require("../builders");
const generateRuntimeSpec = (params) => {
    const { dir, types } = params;
    const spec = dir.getPath("__spec__");
    const edgedb = params.isDeno ? "https://deno.land/x/edgedb/mod.ts" : "edgedb";
    spec.addImport({ $: true }, edgedb);
    spec.writeln([
        (0, builders_1.dts) `declare `,
        `const spec`,
        (0, builders_1.t) `: $.introspect.Types`,
        (0, builders_1.r) ` = new $.StrictMap()`,
        `;`,
    ]);
    spec.nl();
    for (const type of types.values()) {
        spec.writeln([
            (0, builders_1.r) `spec.set("${type.id}", ${JSON.stringify(type)}`,
            (0, builders_1.ts) ` as any`,
            (0, builders_1.r) `);`,
        ]);
    }
    spec.addExport("spec");
};
exports.generateRuntimeSpec = generateRuntimeSpec;
