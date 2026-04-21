import { ExternalTokenizer, ContextTracker } from "@lezer/lr";
import {
	interpStringContent,
	interpStringBrace,
	interpStringEnd,
	interpVStringContent,
	interpVStringBrace,
	interpVStringEnd,
	rawStringStart,
	regularRawStringContent,
	rawStringEnd,
	interpRawStringStart,
	interpRawStringContent,
	interpRawStringBraceStart,
	interpRawStringBraceEnd,
	interpRawStringEnd
} from "./syntax.grammar.terms";

const
	/** '"' */
	quote = 34,
	/** '\\' */
	backslash = 92,
	/** '{' */
	braceL = 123,
	/** '}' */
	braceR = 125,
	/** '$' */
	dollar = 36;

export const interpString = new ExternalTokenizer(input => {
	for (let i = 0; ; i++) {
		switch (input.next) {
			case -1:
				if (i > 0) { input.acceptToken(interpStringContent); }
				return;

			case quote:
				if (i > 0) { input.acceptToken(interpStringContent); }
				else { input.acceptToken(interpStringEnd, 1); }
				return;

			case braceL:
				if (input.peek(1) === braceL) { input.acceptToken(interpStringContent, 2); }
				else { input.acceptToken(interpStringBrace); }
				return;

			case braceR:
				if (input.peek(1) === braceR) { input.acceptToken(interpStringContent, 2); }
				return;

			case backslash:
				const next = input.peek(1);
				if (next === braceL || next === braceR) { return; }
				input.advance();
			// FALLTHROUGH

			default:
				input.advance();
		}
	}
});

export const interpVString = new ExternalTokenizer(input => {
	for (let i = 0; ; i++) {
		switch (input.next) {
			case -1:
				if (i > 0) { input.acceptToken(interpVStringContent); }
				return;

			case quote:
				if (input.peek(1) === quote) { input.acceptToken(interpVStringContent, 2); }
				else if (i > 0) { input.acceptToken(interpVStringContent); }
				else { input.acceptToken(interpVStringEnd, 1); }
				return;

			case braceL:
				if (input.peek(1) === braceL) { input.acceptToken(interpVStringContent, 2); }
				else { input.acceptToken(interpVStringBrace); }
				return;

			case braceR:
				if (input.peek(1) === braceR) { input.acceptToken(interpVStringContent, 2); }
				return;

			default:
				input.advance();
		}
	}
});

// ContextTracker that stores the opening quote count for raw string literals.
export const rawStringTracker = new ContextTracker<number>({
	start: 0,
	shift(context, term, _, input) {
		switch (term) {
			case rawStringStart:
				// input is at the start of the rawStringStart token; count consecutive quotes
				let count = 0;
				while (input.peek(count) === quote) { count++; }
				return count;
			case interpRawStringStart:
				let dollarCount = 0;
				while (input.peek(dollarCount) === dollar) { dollarCount++; }
				let quoteCount = 0;
				while (input.peek(dollarCount + quoteCount) === quote) { quoteCount++; }
				return -(dollarCount * 1024 + quoteCount);
			case interpRawStringBraceStart:
				return -context;
			case interpRawStringBraceEnd:
				return -context;
			case rawStringEnd:
			case interpRawStringEnd:
				return 0;
			default:
				return context;
		}
	},
	strict: false
});

// Handles rawStringStart, regularRawStringContent and rawStringEnd tokens.
// rawStringStart is also declared in @tokens for tokenizer precedence;
// this contextual tokenizer produces regularRawStringContent and rawStringEnd
// based on the opening delimiter length stored in the context.
export const rawString = new ExternalTokenizer((input, stack) => {
	const quoteCount: number = stack.context;

	if (quoteCount === 0) {
		// Expect rawStringStart: 3+ opening quotes
		if (input.next !== quote || input.peek(1) !== quote || input.peek(2) !== quote) return;
		while (input.next === quote) { input.advance(); }
		input.acceptToken(rawStringStart);
		return;
	}

	// Regular raw strings store only quote count (3+). Interpolated raw strings
	// use encoded context values that must be ignored by this tokenizer.
	else if (quoteCount < 3 || quoteCount >= 1024) { return; }

	if (input.next === -1) { return; }

	// Check for rawStringEnd: exactly quoteCount closing quotes (not followed by another quote)
	let isEnd = input.peek(quoteCount) !== quote;
	if (isEnd) {
		for (let i = 0; i < quoteCount; i++) {
			if (input.peek(i) !== quote) {
				isEnd = false;
				break;
			}
		}
	}
	if (isEnd) {
		for (let i = 0; i < quoteCount; i++) { input.advance(); }
		input.acceptToken(rawStringEnd);
		return;
	}

	// regularRawStringContent: advance until closing quotes or EOF
	for (let i = 0; ; i++) {
		switch (input.next) {
			case -1:
				if (i > 0) { input.acceptToken(regularRawStringContent); }
				return;

			case quote:
				let count = 0;
				while (input.peek(count) === quote) { count++; }
				if (count >= quoteCount && input.peek(count) !== quote) {
					if (i > 0) { input.acceptToken(regularRawStringContent); }
					return;
				}
			// FALLTHROUGH

			default:
				input.advance();
		}
	}
}, { contextual: true });

export const interpRawString = new ExternalTokenizer((input, stack) => {
	const context = stack.context;
	if (context === 0) {
		let dollarCount = 0;
		while (input.peek(dollarCount) === dollar) { dollarCount++; }
		if (dollarCount === 0) { return; }

		let quoteCount = 0;
		while (input.peek(dollarCount + quoteCount) === quote) { quoteCount++; }
		if (quoteCount < 3) { return; }

		for (let i = 0; i < dollarCount + quoteCount; i++) { input.advance(); }
		input.acceptToken(interpRawStringStart);
		return;
	}
	else if (context > 0) {
		const dollarCount = Math.floor(context / 1024);
		if (dollarCount === 0) { return; }

		let closeCount = 0;
		while (input.peek(closeCount) === braceR) { closeCount++; }
		if (closeCount === dollarCount && input.peek(closeCount) !== braceR) {
			input.acceptToken(interpRawStringBraceEnd, dollarCount);
		}
		return;
	}

	const encoded = -context;
	const dollarCount = Math.floor(encoded / 1024);
	const quoteCount = encoded % 1024;

	for (let i = 0; ; i++) {
		switch (input.next) {
			case -1:
				if (i > 0) { input.acceptToken(interpRawStringContent); }
				return;

			case quote:
				let count = 0;
				while (input.peek(count) === quote) { count++; }
				if (count >= quoteCount && input.peek(quoteCount) !== quote) {
					if (i > 0) { input.acceptToken(interpRawStringContent); }
					else { input.acceptToken(interpRawStringEnd, quoteCount); }
					return;
				}
				input.advance();
				break;

			case braceL:
				let openCount = 0;
				while (input.peek(openCount) === braceL) { openCount++; }
				if (openCount === dollarCount && input.peek(openCount) !== braceL) {
					if (i > 0) { input.acceptToken(interpRawStringContent); }
					else { input.acceptToken(interpRawStringBraceStart, dollarCount); }
					return;
				}
			// FALLTHROUGH

			default:
				input.advance();
		}
	}
}, { contextual: true });