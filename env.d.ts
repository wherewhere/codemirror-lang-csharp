declare module "@codemirror/buildhelper/src/options" {
    import { lezer } from "@lezer/generator/rollup";

    export const options: {
        expandLink: (anchor: string) => `https://codemirror.net/6/docs/ref/#${typeof anchor}`,
        pureTopCalls: true,
        outputPlugin: () => ReturnType<typeof lezer>
    };
}