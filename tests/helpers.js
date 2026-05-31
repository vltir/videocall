import { expect } from '@playwright/test';

// Shared: Starts the receiver and extracts both the raw URL and pairing words
export async function createReceiver(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/videocall/');

  await expect(page.locator('.status')).toContainText('Waiting for a sender…');

  const shareUrl = await page.locator('.share-url').textContent();
  const wordsArray = await page.locator('.secret span').allTextContents();
  const words = wordsArray.join(' ');

  return { context, page, shareUrl, words };
}

// Shared: Handles the call acceptance dialog and verifies full DOM transition
export async function completeConnection(page1, page2) {
  await expect(page1.locator('.call-overlay')).toBeVisible();
  await page1.locator('.call-overlay-content button.primary').click({ force: true });
  await expect(page1.locator('.call-overlay')).not.toBeVisible();

  await expect(page1.locator('video.video-fullscreen')).toBeVisible();
  await expect(page2.locator('video.video-fullscreen')).toBeVisible();
}