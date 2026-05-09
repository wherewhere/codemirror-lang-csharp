import { completeFromList, ifNotIn, type CompletionSource } from "@codemirror/autocomplete";
import { atoms, keywords, types } from "./keywords";

type CompletionType = "class" | "constant" | "enum" |
    "function" | "interface" | "keyword" | "method" | "namespace" |
    "property" | "text" | "type" | "variable";

/**
 * Gets C# keywords completion.
 * @returns A {@link CompletionSource} instance for C# keywords.
 */
export function csharpCompletion() {
    function map(type: CompletionType) {
        return (label: string) => { return { label, type }; }
    }
    return ifNotIn([
        ';', '{', '}',
        "IntegerLiteral", "RealLiteral",
        "StringLiteral", "UTF8StringLiteral", "RawStringLiteral", "CharacterLiteral", "InterpolatedRegularString", "InterpolatedVerbatimString", "InterpolatedRawString",
        "LineComment", "BlockComment", "DocComment",
        "PP_Directive", "ArgumentName", "AttrsNamedArg",
        "ConstName", "MethodName", "ParamName", "VarName", "FieldName", "PropertyName"],
        completeFromList(keywords.map(map("keyword")).concat(types.map(map("type")), atoms.map(map("constant")))));
}