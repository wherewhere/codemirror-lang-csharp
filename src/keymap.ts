import { syntaxTree } from "@codemirror/language";
import { keymap } from "@codemirror/view";
import { EditorSelection } from "@codemirror/state";

/** The {@link keymap} for continuing XML documentation comments. */
export const continueDocComment = keymap.of([{
    key: "Enter",
    run(view) {
        const state = view.state;
        const main = state.selection.main;
        if (!main.empty) { return false; }

        const doc = state.doc;
        const line = doc.lineAt(main.head);
        const pos = Math.max(line.from, main.head);
        const node = syntaxTree(state).resolve(pos, -1);
        if (node.name !== "DocComment") { return false; }

        const match = line.text.match(/^(\s*)\/\/\/ ?/);
        if (!match) { return false; }

        const prefix = `\n${match[1]}/// `;
        let insert = prefix;

        const nodeInner = syntaxTree(state).resolveInner(pos);
        let inTagNode = nodeInner.name === "Element"
            && doc.sliceString(pos - 1, pos) === ">"
            && doc.sliceString(pos, pos + 1) === "<";
        if (inTagNode) {
            insert += prefix;
        }
        const cursor = main.head + prefix.length;

        view.dispatch(state.update({
            changes: { from: main.head, to: main.head, insert },
            selection: EditorSelection.cursor(cursor),
            scrollIntoView: true,
            userEvent: "input"
        }));
        return true;
    }
}]);