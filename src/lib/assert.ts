export default function assert(condition: boolean, format: string = 'Assertion Error', ...args: any[]): void | never {
  if (!condition) {
    let argIndex = 0;

    const error = new Error(
      format.replace(/%s/g, function () {
        return args[argIndex++];
      }),
    );

    error.name = 'Invariant Violation';

    throw error;
  }
}
