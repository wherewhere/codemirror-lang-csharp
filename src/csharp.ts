import type { LRParser } from "@lezer/lr";
import { parser } from "./syntax.grammar";
import {
    LRLanguage,
    LanguageSupport,
    indentNodeProp,
    foldNodeProp,
    foldInside,
    continuedIndent
} from "@codemirror/language";
import { parseMixed } from "@lezer/common";
import { styleTags, tags } from "@lezer/highlight";
import { xml } from "./xml";

function docCommentXmlOverlay(from: number, content: string) {
    const ranges: { from: number; to: number }[] = [];
    let i = 0;
    while (i < content.length) {
        // Each segment starts with ///
        if (content[i] === '/' && content[i + 1] === '/' && content[i + 2] === '/') {
            i += 3;
            if (content[i] === ' ') { i++; }
            const lineStart = i;
            while (i < content.length &&
                content[i] !== '\r' && content[i] !== '\n' &&
                content[i] !== '\u0085' && content[i] !== '\u2028' && content[i] !== '\u2029') {
                i++;
            }
            if (i > lineStart) { ranges.push({ from: from + lineStart, to: from + i }); }
        }
        // Advance past newline and leading whitespace
        while (i < content.length &&
            (content[i] === '\r' || content[i] === '\n' ||
                content[i] === '\u0085' || content[i] === '\u2028' || content[i] === '\u2029' ||
                content[i] === ' ' || content[i] === '\t')) {
            i++;
        }
    }
    return ranges.length > 0 ? ranges : null;
}

export const csharpLanguage = LRLanguage.define({
    parser: parser.configure({
        props: [
            indentNodeProp.add({
                Delim: continuedIndent({ except: /^\s*(?:case\b|default:)/ })
            }),
            foldNodeProp.add({
                Delim: foldInside
            }),
            styleTags({
                "Keyword ContextualKeyword SimpleType": tags.keyword,
                BooleanLiteral: tags.bool,
                NullLiteral: tags.null,
                IntegerLiteral: tags.integer,
                RealLiteral: tags.float,
                'StringLiteral UTF8StringLiteral RawStringLiteral CharacterLiteral InterpolatedRegularString InterpolatedVerbatimString InterpolatedRawString $" @$" $@"':
                    tags.string,
                LineComment: tags.lineComment,
                BlockComment: tags.blockComment,
                DocComment: tags.docComment,

                ". .. : Astrisk Slash % + - ++ -- Not ~ << & | ^ && || < > <= >= == NotEq = += -= *= SlashEq %= &= |= ^= ? ?? ??= =>":
                    tags.operator,

                PP_Directive: tags.keyword,

                TypeIdentifier: tags.typeName,
                "ArgumentName AttrsNamedArg": tags.variableName,
                ConstName: tags.constant(tags.variableName),

                //Ident: tags.name,
                MethodName: tags.function(tags.variableName),
                ParamName: [tags.emphasis, tags.variableName],
                VarName: tags.variableName,
                "FieldName PropertyName": tags.propertyName,

                "( )": tags.paren,
                "{ }": tags.brace,
                "[ ]": tags.squareBracket
            })
        ],
        wrap: parseMixed((node, input) => {
            if (node.name !== "DocComment") {
                return null;
            }
            const content = input.read(node.from, node.to);
            if (content.indexOf("<") === -1) {
                return null;
            }
            const overlay = docCommentXmlOverlay(node.from, content);
            if (!overlay) {
                return null;
            }
            return {
                parser: (xml.language.parser as LRParser).configure({
                    props: [styleTags({ Text: tags.docComment })]
                }),
                overlay
            };
        })
    }),
    languageData: {
        commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
        closeBrackets: { brackets: ["(", "[", "{", '"', "'", '"""'] },
        indentOnInput: /^\s*((\)|\]|\})$|(else|else\s+if|catch|finally|case)\b|default:)/
    }
});

import { Prec } from "@codemirror/state";
import { continueDocComment } from "./keymap";
import { csharpCompletion } from "./complete";
export function csharp() {
    return new LanguageSupport(csharpLanguage, [
        Prec.high(continueDocComment),
        csharpLanguage.data.of({
            autocomplete: csharpCompletion()
        }),
        xml.support
    ]);
}