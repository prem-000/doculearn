export {};

declare global {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }

  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent;
  }

  interface Navigator {
    standalone?: boolean;
  }
}
