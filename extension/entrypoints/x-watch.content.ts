// MAIN world: sees the page's own network calls. No browser.* APIs here.
import { defineContentScript } from 'wxt/utils/define-content-script';
import { watchSaves } from '@/utils/intercept';
import { X_MATCHES, xWatcher } from '@/sources/x';

export default defineContentScript({
  matches: X_MATCHES,
  runAt: 'document_start',
  world: 'MAIN',
  main() {
    watchSaves(xWatcher);
  },
});
