import { test, expect } from '@playwright/test';
import { createReceiver, completeConnection } from './helpers';

test('WebRTC Connection: Media Stream Transmission Flow', async ({ browser }) => {
  // 1. Setup Receiver (Client 1) via Shared Logic
  const receiver = await createReceiver(browser);

  // 2. Setup Sender (Client 2)
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await page2.goto(receiver.shareUrl);
  await expect(page2.locator('video.video-fullscreen')).toBeVisible();

  // 3. Complete WebRTC Handshake via Shared Logic
  await completeConnection(receiver.page, page2);
  await receiver.page.waitForTimeout(2000);

  // 4. Specific Video Transfer Verification (Motion Detection)
  const isVideoMoving = await receiver.page.evaluate(async () => {
    const video = document.querySelector('video.video-fullscreen');
    if (!video || video.readyState < 2) return false;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 64;
    canvas.height = 64;

    const capture = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return ctx.getImageData(0, 0, canvas.width, canvas.height).data.join(',');
    };

    const frame1 = capture();
    await new Promise(r => setTimeout(r, 1000));
    const frame2 = capture();

    return frame1 !== frame2;
  });
  expect(isVideoMoving).toBe(true);

  // 5. Specific Audio Transfer Verification (Signal Frequency Detection)
  const isAudioTransmitting = await receiver.page.evaluate(async () => {
    const video = document.querySelector('video.video-fullscreen');
    if (!video || !video.srcObject) return false;

    const stream = video.srcObject;
    if (stream.getAudioTracks().length === 0) return false;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let maxVolume = 0;

    for (let i = 0; i < 10; i++) {
      analyser.getByteFrequencyData(dataArray);
      maxVolume = Math.max(maxVolume, ...dataArray);
      await new Promise(r => setTimeout(r, 100));
    }

    await audioCtx.close();
    return maxVolume > 10;
  });
  expect(isAudioTransmitting).toBe(true);

  await receiver.context.close();
  await context2.close();
});