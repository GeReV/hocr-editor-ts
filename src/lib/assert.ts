export default function assert(condition: any, format: string = 'Assertion Error', ...args: any[]): asserts condition {
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
