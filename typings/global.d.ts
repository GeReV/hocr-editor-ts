interface Array<T> {
  filter(fn: BooleanConstructor): Array<Exclude<T, null | undefined | 0 | '' | false>>;
}
