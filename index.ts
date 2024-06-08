export * from "./src/microwsClient.js";
declare global {
  interface Window {
    config: {
      environment: "prod" | "deva";
      components: any;
      [k: string]: any;
    };
  }
}
