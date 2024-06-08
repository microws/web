import { ReactNode, Suspense } from "react";
import { useMicrowsApi } from "./api.js";

export function FeatureRoute({ flag, children }: { flag: string | `${string}/${string}`; children: ReactNode }) {
  return (
    <Suspense>
      <Feature flag={flag}>{children}</Feature>
    </Suspense>
  );
}
export function Variation({
  value,
  children,
  element,
}: {
  variation?: Array<string> | string;
  value?: Array<string | boolean | number> | string | boolean | number;
  default?: boolean;
  children?: ReactNode;
  element?: ReactNode;
}) {
  return children || element;
}
function Feature({ flag, children }) {
  let { data: feature } = useMicrowsApi("/api/flag/" + flag);

  let defaultChild = null;
  let matchingChildren = children.filter((child) => {
    if (child.props.default) {
      defaultChild = child;
    }

    if (child.props.variation) {
      let variations = child.props.variation;

      if (!Array.isArray(variations)) {
        variations = [variations];
      }
      if (variations.includes(feature.variation)) {
        return true;
      }
    }
    if (child.props.value) {
      let values = child.props.value;

      if (!Array.isArray(values)) {
        values = [values];
      }
      if (values.includes(feature.value)) {
        return true;
      }
    } else if (child.props.notValue) {
      let values = child.props.notValue;
      if (!Array.isArray(values)) {
        values = [values];
      }
      if (!values.includes(feature.value)) {
        return true;
      }
    }
    return false;
  });
  if (matchingChildren.length > 0) {
    return matchingChildren;
  } else {
    return defaultChild || null;
  }
}
