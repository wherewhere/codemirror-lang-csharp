import { xml } from "@codemirror/lang-xml";
import { atoms, keywords, types } from "./keywords";

const elements = [
    { name: "a", attributes: ["href"] },
    { name: "b" },
    { name: "br" },
    { name: "c" },
    { name: "code" },
    { name: "completionlist", top: true, attributes: ["cref"] },
    { name: "description" },
    { name: "example", top: true, children: ["code"] },
    { name: "exception", top: true, attributes: ["cref"] },
    { name: "i" },
    { name: "include", top: true, attributes: ["file", "path"] },
    { name: "inheritdoc", top: true, attributes: ["cref", "path"] },
    { name: "item", children: ["term", "description"] },
    { name: "list", children: ["listheader", "item", "term", "description"], attributes: ["type"] },
    { name: "listheader", children: ["term", "description"] },
    { name: "para" },
    { name: "param", top: true, attributes: ["name"] },
    { name: "paramref", attributes: ["name"] },
    { name: "remarks", top: true },
    { name: "returns", top: true },
    { name: "see", top: true, attributes: ["cref", "href", "langword"] },
    { name: "seealso", top: true, attributes: ["cref", "href"] },
    { name: "strong" },
    { name: "summary", top: true },
    { name: "term" },
    { name: "tt" },
    { name: "typeparam", top: true, attributes: ["name"] },
    { name: "typeparamref", attributes: ["name"] },
    { name: "u" },
    { name: "value", top: true }
] as const;

const attributes = [
    { name: "cref", values: types },
    { name: "langword", values: (keywords as readonly string[]).concat(types, atoms) },
    { name: "type", values: ["bullet", "number", "table"] }
] as const;

const xmlLanguage = xml({
    elements,
    attributes
});

export { xmlLanguage as xml };