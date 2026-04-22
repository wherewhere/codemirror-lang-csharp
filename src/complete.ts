import { completeFromList, ifNotIn } from "@codemirror/autocomplete";
import { atoms, keywords, types } from "./keywords";

export function csharpCompletion() {
    function map(type: string) {
        return (label: string) => { return { label, type }; }
    }
    return ifNotIn([
        ';', '{', '}',
        "IntegerLiteral", "RealLiteral",
        "StringLiteral", "UTF8StringLiteral", "RawStringLiteral", "CharacterLiteral", "InterpolatedRegularString", "InterpolatedVerbatimString", "InterpolatedRawString",
        "LineComment", "BlockComment", "DocComment",
        "PP_Directive", "ArgumentName", "AttrsNamedArg",
        "ConstName", "MethodName", "ParamName", "VarName", "FieldName", "PropertyName"],
        completeFromList(keywords.map(map("keywords")).concat(types.map(map("type")), atoms.map(map("constant")))));
}