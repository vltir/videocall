import { test } from '@playwright/test';
import { createReceiver, completeConnection } from './helpers';

test('WebRTC Connection: Direct URL Room Link Flow', async ({ browser }) => {
  const receiver = await createReceiver(browser);

  const context2 = await browser.newContext();
  const page2 = await context2.newPage();

  // Navigate directly using the fully qualified room invitation URL
  await page2.goto(receiver.shareUrl);

  // Verify automatic signal handling transitions into a connected call
  await completeConnection(receiver.page, page2);

  await receiver.context.close();
  await context2.close();
});