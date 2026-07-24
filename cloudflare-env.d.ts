/* eslint-disable @typescript-eslint/no-explicit-any */
// Minimal ambient compatibility shim for vinext/Cloudflare builds.
// Runtime bindings are injected by Cloudflare; this file does not fabricate data.
declare module "cloudflare:workers" {
  export const env: {
    DB?: any;
    [key: string]: unknown;
  };
}

type Fetcher = {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
};

type D1Database = any;
