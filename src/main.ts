import { isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const MOCK_STORAGE_KEY = 'msw:enabled';

function parseMockParam(value: string | null): boolean | null {
  if (value == null) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'on') {
    return true;
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'off') {
    return false;
  }

  return null;
}

function shouldEnableMocking(): boolean {
  if (!isDevMode()) {
    return false;
  }

  const urlValue = parseMockParam(new URLSearchParams(window.location.search).get('mock'));
  if (urlValue != null) {
    localStorage.setItem(MOCK_STORAGE_KEY, urlValue ? '1' : '0');
    return urlValue;
  }

  return localStorage.getItem(MOCK_STORAGE_KEY) === '1';
}

async function unregisterMockServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations
      .filter((registration) => {
        const urls = [
          registration.active?.scriptURL,
          registration.waiting?.scriptURL,
          registration.installing?.scriptURL,
        ];
        return urls.some((url) => (url ?? '').includes('mockServiceWorker.js'));
      })
      .map((registration) => registration.unregister())
  );
}

async function enableMocking(): Promise<void> {
  if (!shouldEnableMocking()) {
    await unregisterMockServiceWorker();
    return;
  }

  const { worker } = await import('./app/mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

enableMocking()
  .then(() => bootstrapApplication(App, appConfig))
  .catch((err) => console.error(err));
