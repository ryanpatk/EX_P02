import { defineContentScript } from 'wxt/utils/define-content-script';
import { bridgeSaves } from '@/utils/bridge';
import { PINTEREST_MATCHES, pinterestPayload } from '@/sources/pinterest';

export default defineContentScript({
  matches: PINTEREST_MATCHES,
  runAt: 'document_start',
  main() {
    bridgeSaves('pinterest', pinterestPayload);
  },
});
