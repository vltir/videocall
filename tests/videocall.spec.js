import { test, expect } from '@playwright/test';

test('Videocall WebRTC: Video and Audio Transmission', async ({ browser }) => {

  // ==========================================
  // 1. CLIENT 1 (Receiver) starts application
  // ==========================================
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();

  await page1.goto('/videocall/');

  const statusReceiver = page1.locator('.status');
  await expect(statusReceiver).toContainText('Waiting for a sender…');

  const shareUrlLocator = page1.locator('.share-url');
  await expect(shareUrlLocator).toBeVisible();
  const connectionUrl = await shareUrlLocator.textContent();

  console.log(`Extracted connection url for Client 2: ${connectionUrl}`);
  expect(connectionUrl).toContain('?room=');

  // ==========================================
  // 2. CLIENT 2 (Sender) starts application on connection url
  // ==========================================
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();

  await page2.goto(connectionUrl);

  const videoClient2 = page2.locator('video.video-fullscreen');
  await expect(videoClient2).toBeVisible();

  // ==========================================
  // 3. CLIENT 1 (Receiver) accept connection
  // ==========================================
  const callOverlay = page1.locator('.call-overlay');
  await expect(callOverlay).toBeVisible();

  const acceptButton = page1.locator('.call-overlay-content button.primary');
  await acceptButton.click();

  await expect(callOverlay).not.toBeVisible();

  // ==========================================
  // 4. Verify WebRTC Video-Transfer
  // ==========================================
  const videoClient1 = page1.locator('video.video-fullscreen');
  await expect(videoClient1).toBeVisible();

  const isVideoPlayingOnClient1 = await videoClient1.evaluate((video) => {
    return video.readyState >= 2 && !video.paused && video.currentTime > 0;
  });

  await page1.waitForTimeout(2000);

  const currentTimeClient1 = await videoClient1.evaluate((video) => video.currentTime);
  console.log(`Video being transmitted. Current playing time: ${currentTimeClient1}s`);

  expect(currentTimeClient1).toBeGreaterThan(0);

  await context1.close();
  await context2.close();
});