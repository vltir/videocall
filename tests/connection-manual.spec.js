import { test, expect } from '@playwright/test';
import { createReceiver, completeConnection } from './helpers';

test('WebRTC Connection: Manual Word Input Flow', async ({ browser }) => {
  const receiver = await createReceiver(browser);

  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await page2.goto('/videocall/');

  // Open manual entry form
  await page2.locator('.share-button').click();

  // Type pairing words into input field
  const input = page2.locator('#room-input');
  await input.fill(receiver.words);

  // Close the autocompleter suggestion dropdown by pressing Escape
  await page2.keyboard.press('Escape');

  // Trigger call action (using force if any remaining overlay elements persist)
  await page2.locator('button:has-text("Start call")').click({ force: true });

  // Verify full multi-client connection
  await completeConnection(receiver.page, page2);

  await receiver.context.close();
  await context2.close();
});