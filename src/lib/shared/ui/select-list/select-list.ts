export const selectOf =
  <T>(onSelect: (value: T) => void, value: T) =>
  (): void => {
    onSelect(value);
  };

export const currentOf = (selected: boolean): "true" | "false" =>
  selected ? "true" : "false";
