import { authConfiguredPromise, userSessionAtom } from "./amplify.js";
import { fetchAuthSession } from "aws-amplify/auth";
import { useRef, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

export interface APIClientInterface {
  post: any;
  output: any;
  params: any;
  get: any;
}
async function api<T extends APIClientInterface>({
  url,
  timeout,
  body,
  headers,
  params,
}: {
  url: string;
  timeout?: number;
  body?: string;
  headers?: NodeJS.Dict<any>;
  params?: RequestInit;
}): Promise<T["output"]> {
  timeout = timeout || 1_000 * 6;
  await authConfiguredPromise;
  let session = await fetchAuthSession();
  const myHeaders = { ...headers };
  if (session.tokens?.idToken) {
    myHeaders.Authorization = `Bearer ${session.tokens.idToken.toString()}`;
  }
  let result = await fetch(url, {
    ...params,
    body: body,
    headers: myHeaders,
    signal: AbortSignal?.timeout?.(timeout),
  });

  if (result.ok) {
    if (result.headers.get("content-type").match(/application\/jsonlines/)) {
      return (await result.text())
        .split("\n")
        .filter((r) => r.trim() !== "")
        .map((r) => {
          try {
            return JSON.parse(r);
          } catch (e) {
            return {};
          }
        });
    } else if (result.headers.get("content-type").match(/application\/json/)) {
      return result.json();
    } else {
      return result.text();
    }
  } else {
    let body = await result.text();

    try {
      body = JSON.parse(body);
    } catch (e) {}
    throw {
      result: body,
      statusCode: result.status,
      statusText: result.statusText,
      response: result,
    };
  }
}

export function apiGet<T extends APIClientInterface>(url: string, options?: {}) {
  return api<T>({
    ...options,
    url,
  });
}

export function apiPost<T extends APIClientInterface>(url: string, body: T["post"], options?: {}) {
  return api<T>({
    ...options,
    params: {
      method: "POST",
    },
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    url,
  });
}

export function useMicrowsApi<T extends APIClientInterface>(url: string, options?: any) {
  const queryClient = useQueryClient();
  const nextSave = useRef<null | any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showIsSaving, setShowIsSaving] = useState(false);
  const [error, setError] = useState<null | any>(null);

  const { data } = useSuspenseQuery<T["output"]>({
    retry: (count, error: Error) => {
      if (count >= 3) {
        return false;
      }
      let e = error as unknown as Response;
      if ([400, 401, 403, 404].includes(e.status) || [400, 401, 403, 404].includes((e as any)?.statusCode)) {
        return false;
      } else {
        return true;
      }
    },
    queryKey: [url],
    queryFn: async () => {
      return await apiGet(url, {});
    },
  });
  const mutation = useMutation<T["output"]>({
    mutationFn: async (body) => {
      return await apiPost(url, body);
    },
    onSuccess: (data) => {
      queryClient.setQueryData([url], data);
    },
    onSettled: (data, error) => {
      if (error) {
        setError(error);
      } else {
        setError(null);
      }
      setShowIsSaving(false);
      if (nextSave.current) {
        setIsSaving(true);
        let body = nextSave.current;
        setTimeout(() => {
          setShowIsSaving(true);
          mutation.mutate(body);
        }, 500);
        nextSave.current = null;
      } else {
        setIsSaving(false);
        setShowIsSaving(false);
      }
    },
  });
  return {
    data: data as T["output"],
    update: (body: T["post"]) => {
      if (isSaving) {
        nextSave.current = body;
      } else {
        setIsSaving(true);
        setShowIsSaving(true);
        mutation.mutate(body);
      }
    },
    isSaving: showIsSaving,
    error: error,
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: [url] });
    },
  };
}
