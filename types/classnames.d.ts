declare module 'classnames' {
  type Value = string | number | boolean | undefined | null;
  type Mapping = { [key: string]: any };
  type Argument = Value | Mapping | Argument[];

  function classNames(...args: Argument[]): string;
  export = classNames;
}
