export type VariantProps<T> = Record<string, any>;

type CVAOptions = {
  variants?: Record<string, Record<string, string>>;
  defaultVariants?: Record<string, string>;
};

export function cva(base: string, options: CVAOptions = {}) {
  const { variants = {}, defaultVariants = {} } = options;
  return (args: Record<string, any> = {}) => {
    const classes: string[] = [];
    if (base) classes.push(base);
    for (const key of Object.keys(variants)) {
      const value = args[key] ?? defaultVariants[key];
      if (value && variants[key] && variants[key][value]) {
        classes.push(variants[key][value]);
      }
    }
    if (args.className) classes.push(args.className);
    return classes.filter(Boolean).join(" ");
  };
}
