import { Children, ReactElement, ReactNode } from "react";

type CaseProps<T> = {
  matches?: T;
  children: ReactNode;
};
export function Case<T>({ matches, children }: CaseProps<T>) {
  return children;
}
export function Switch<T>({
  value,
  children,
}: {
  value: T;
  children: ReactElement<CaseProps<T>>[] | ReactElement<CaseProps<T>>;
}) {
  return Children.toArray(children).filter((child: ReactElement<CaseProps<T>>) => {
    if (child.type == Case) {
      if (child.props.matches !== undefined && child.props.matches === value) {
        return true;
      }
      return false;
    } else {
      return true;
    }
  });
}
