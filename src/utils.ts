import { Getter, atom } from "jotai";
import { parse } from "uuid";
import { binary_to_base58 } from "base58-js";
import { ReactNode } from "react";
import { Root, createRoot } from "react-dom/client";

export function createExternalPromise() {
  let resolve, reject;
  let promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { resolve, reject, promise };
}

export function atomWithRefresh<T>(fn: (get: Getter) => T) {
  const refreshCounter = atom(0);
  return atom(
    (get) => {
      get(refreshCounter);
      return fn(get);
    },
    (_, set) => set(refreshCounter, (i) => i + 1),
  );
}

export function classNames(obj: NodeJS.Dict<boolean>) {
  return Object.entries(obj)
    .map(([key, value]) => {
      if (value) {
        return key;
      }
      return null;
    })
    .filter(Boolean)
    .join(" ");
}

export function createGuidStringBrowser() {
  return binary_to_base58(parse(globalThis.crypto.randomUUID()));
}

let root: Root;
export function microwsRender(App: ReactNode) {
  function render(id: string) {
    if (!root) {
      root = createRoot(document.getElementById(id));
    }
    root.render(App);
  }
  if (document.readyState == "complete") {
    render("root");
  } else {
    globalThis.addEventListener("DOMContentLoaded", () => render("root"));
  }
}
