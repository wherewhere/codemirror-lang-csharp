import type { LRParser } from "@lezer/lr";
import { parser } from "./syntax.grammar";
import {
    LRLanguage,
    LanguageSupport,
    LanguageDescription,
    indentNodeProp,
    foldNodeProp,
    foldInside,
    continuedIndent,
    flatIndent
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

/** A language provider for C#. */
export const csharpLanguage = LRLanguage.define({
    parser: parser.configure({
        props: [
            indentNodeProp.add({
                BracesDelim: continuedIndent({ except: /^\s*}/ }),
                BracketsDelim: continuedIndent({ except: /^\s*]/ }),
                ParensDelim: continuedIndent({ except: /^\s*\)/ }),
                ChevronsDelim: continuedIndent({ except: /^\s*>/ }),
                IfStmt: continuedIndent({ except: /^\s*({|else\b)/ }),
                TryStmt: continuedIndent({ except: /^\s*({|catch\b|finally\b)/ }),
                "String LabeledStmt": flatIndent,
                "Expression Declaration Statement": continuedIndent({ except: /^\s*{/ })
            }),
            foldNodeProp.add({
                Delim: foldInside,
                BlockComment(node) { return { from: node.from + 2, to: node.to - 2 } },
            }),
            styleTags({
                "Keyword ContextualKeyword SimpleType": tags.keyword,
                BooleanLiteral: tags.bool,
                NullLiteral: tags.null,
                IntegerLiteral: tags.integer,
                RealLiteral: tags.float,
                String: tags.string,
                LineComment: tags.lineComment,
                BlockComment: tags.blockComment,
                DocComment: tags.docComment,

                Operator: tags.operator,
                Separator: tags.separator,

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
            if (content.indexOf('<') === -1) {
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
        closeBrackets: { brackets: ['(', '[', '{', '"', '\'', '"""'] },
        indentOnInput: /^\s*([)\]}]$|(else|else\s+if|catch|finally)\b)/
    }
});

import { Prec } from "@codemirror/state";
import { continueDocComment } from "./keymap";
import { csharpCompletion } from "./complete";

/**
 * Gets C# support. Includes {@link continueDocComment}, {@link csharpCompletion} and {@link xml.support}.
 * @returns A {@link LanguageSupport} instance for C#.
 */
export function csharp() {
    return new LanguageSupport(csharpLanguage, [
        Prec.high(continueDocComment),
        csharpLanguage.data.of({
            autocomplete: csharpCompletion()
        }),
        xml.support
    ]);
}

/**
 * Gets C# language description.
 * @returns A {@link LanguageDescription} instance for C#.
 */
export function csharpData() {
    return LanguageDescription.of({
        name: "C#",
        alias: ["csharp", "cs"],
        extensions: ["cs", "csx"],
        support: csharp()
    });
}