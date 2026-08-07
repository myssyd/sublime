/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assets from "../assets.js";
import type * as auth from "../auth.js";
import type * as billing from "../billing.js";
import type * as characterGeneration from "../characterGeneration.js";
import type * as characters from "../characters.js";
import type * as credits from "../credits.js";
import type * as http from "../http.js";
import type * as jobs from "../jobs.js";
import type * as lib_instagram from "../lib/instagram.js";
import type * as lib_videoValidation from "../lib/videoValidation.js";
import type * as stripe from "../stripe.js";
import type * as videoGeneration from "../videoGeneration.js";
import type * as videoImport from "../videoImport.js";
import type * as videoSources from "../videoSources.js";
import type * as videoSubmission from "../videoSubmission.js";
import type * as videos from "../videos.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  assets: typeof assets;
  auth: typeof auth;
  billing: typeof billing;
  characterGeneration: typeof characterGeneration;
  characters: typeof characters;
  credits: typeof credits;
  http: typeof http;
  jobs: typeof jobs;
  "lib/instagram": typeof lib_instagram;
  "lib/videoValidation": typeof lib_videoValidation;
  stripe: typeof stripe;
  videoGeneration: typeof videoGeneration;
  videoImport: typeof videoImport;
  videoSources: typeof videoSources;
  videoSubmission: typeof videoSubmission;
  videos: typeof videos;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
  videoPool: import("@convex-dev/workpool/_generated/component.js").ComponentApi<"videoPool">;
  r2: import("@convex-dev/r2/_generated/component.js").ComponentApi<"r2">;
  stripe: import("@convex-dev/stripe/_generated/component.js").ComponentApi<"stripe">;
};
