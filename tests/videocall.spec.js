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

  const videoClient1 = page1.locator('video.video-fullscreen');
  await expect(videoClient1).toBeVisible();

  await page1.waitForTimeout(2000);

  // ==========================================
  // 4. Verify video transfer
  // ==========================================
  console.log('Verifying video transfer on changing pictures');
  const isVideoMoving = await page1.evaluate(async () => {
    const video = document.querySelector('video.video-fullscreen');
    if (!video || video.readyState < 2) return false;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 64;
    canvas.height = 64;
    const captureFrame = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return ctx.getImageData(0, 0, canvas.width, canvas.height).data.join(',');
    };

    const frame1 = captureFrame();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const frame2 = captureFrame();

    return frame1 !== frame2;
  });

  console.log(`Changing pictures: ${isVideoMoving}`);
  expect(isVideoMoving).toBe(true);

  // ==========================================
  // 5. Verify audio transfer
  // ==========================================
  console.log('Verifying audio transfer on frequencies');
  const isAudioTransmitting = await page1.evaluate(async () => {
    const video = document.querySelector('video.video-fullscreen');
    if (!video || !video.srcObject) return false;

    const stream = video.srcObject;
    if (stream.getAudioTracks().length === 0) return false;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();

    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let maxVolumeDetected = 0;

    for (let i = 0; i < 10; i++) {
      analyser.getByteFrequencyData(dataArray);
      const currentMax = Math.max(...dataArray);
      if (currentMax > maxVolumeDetected) {
        maxVolumeDetected = currentMax;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await audioCtx.close();

    return maxVolumeDetected > 10;
  });

  console.log(`frequency match: ${isAudioTransmitting}`);
  expect(isAudioTransmitting).toBe(true);

  await context1.close();
  await context2.close();
});