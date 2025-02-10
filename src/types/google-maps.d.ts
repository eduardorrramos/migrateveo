declare global {
    interface Window {
      gm_authFailure?: () => void;
      google: any;
    }
  }
  export {};