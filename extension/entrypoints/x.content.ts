import { defineContentScript } from 'wxt/utils/define-content-script';
import { bridgeSaves } from '@/utils/bridge';
import { X_MATCHES, xPayload } from '@/sources/x';

export default defineContentScript({
  matches: X_MATCHES,
  runAt: 'document_start',
  main() {
    bridgeSaves('x', xPayload);
  },
});
