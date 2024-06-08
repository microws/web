import React, * as react from "react";
import { MicrowsErrorBoundary } from "./errorBoundary.js";
import { MicrowsContext } from "./MicrowsAppWrapper.js";

export * from "./api.js";
export * from "./utils.js";
export * from "./componentUtils.js";
export * from "./feature.js";

export * from "./amplify.js";
export * from "./errorBoundary.js";
export * from "./MicrowsAppWrapper.js";

const microwsModules = new Map();
export function registerModule(
  name: string,
  module: JSX.Element | ((props?: any) => Element) | ((props?: any) => JSX.Element),
) {
  microwsModules.set(name, module);
}

export type MicrowsContext = {
  componentVersions: Map<string, { time: string; hash: string }>;
};

/**
 * ex. const Dashboard = MicrowsModule("dashboard");
 */
const loadedFiles = new Set<string>();
const componentSet = new Map();

export function MicrowsModule<T extends Record<string, any> & { children?: react.ReactNode[] }>(
  name: string,
  options?: {
    fallback?: react.ReactNode;
  },
) {
  return function (props: T) {
    const { componentVersions } = react.useContext(MicrowsContext);
    const fileName = name.split(/:/)[0];
    const fileId = `/static/${encodeURIComponent(fileName)}-${encodeURIComponent(
      componentVersions.get(fileName)?.hash || "NA",
    )}.js`;

    if (!componentSet.has(fileId)) {
      componentSet.set(
        fileId,
        react.lazy(async () => {
          if (!loadedFiles.has(fileId) && !(globalThis.config.environment.match(/^dev/) && microwsModules.has(name))) {
            try {
              await import(fileId);
            } catch (e) {
              console.log("got Error");
              console.log(e);
            }
          }
          return { default: microwsModules.get(name) };
        }),
      );
    }
    const children = props.children;
    delete props.children;
    const Component = React.createElement(componentSet.get(fileId), props, children);
    return (
      <MicrowsErrorBoundary fallback={options?.fallback || "ErrorLoadingModule"}>
        <react.Suspense>{Component}</react.Suspense>
      </MicrowsErrorBoundary>
    );
  };
}
