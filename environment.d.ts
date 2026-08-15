declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_PASSWORD: string;
      GOOGLE_PRIVATE_KEY: string;
      GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
      GOOGLE_SHEET_ID: string;
    }
  }
}
export {};
