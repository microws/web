import { Amplify } from "aws-amplify";
import { fetchAuthSession } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { atomWithRefresh, createExternalPromise } from "./utils.js";
import { useAtom } from "jotai/react";

export { Hub };
export { signIn, signOut, signInWithRedirect } from "aws-amplify/auth";

export const AmplifyConfigure = Amplify.configure.bind(Amplify);

let { resolve: configureResolve, promise: authConfiguredPromise } = createExternalPromise();
export { authConfiguredPromise, fetchAuthSession };
Hub.listen("core", async ({ payload: { event, data } }) => {
  if (event == "configure") {
    configureResolve();
  }
});
export const userSessionAtom = atomWithRefresh<
  Promise<{
    isLoggedIn: boolean;
    identityId: string | false;
    profile?: Record<string, any>;
    token?: string;
  }>
>(async () => {
  await authConfiguredPromise;
  let result = await fetchAuthSession();
  if (result.userSub) {
    return {
      isLoggedIn: true,
      identityId: result.identityId,
      profile: result.tokens.idToken.payload,
      token: result.tokens.idToken.toString(),
    };
  } else {
    return {
      isLoggedIn: false,
      identityId: false,
    };
  }
});
export function useUser<T extends Record<string, any>>() {
  const [user] = useAtom(userSessionAtom);
  return user as {
    isLoggedIn: boolean;
    identityId?: string;
    profile: T;
    token: string;
  };
}
