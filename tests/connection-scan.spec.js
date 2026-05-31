import { test } from '@playwright/test';
import QRCode from 'qrcode';
import { createReceiver, completeConnection } from './helpers';

test('WebRTC Connection: Integrated QR Code Scanner Flow', async ({ browser }) => {
  const receiver = await createReceiver(browser);

  // Generate the genuine connection QR code image inside Node.js runtime
  const qrCodeDataUrl = await QRCode.toDataURL(receiver.shareUrl, { width: 400, margin: 4 });

  const context2 = await browser.newContext();
  const page2 = await context2.newPage();

  // Inject a mock camera stream feeding the scaled QR code image into the camera pipeline
  await page2.addInitScript((qrDataUrl) => {
    const originalGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

    navigator.mediaDevices.getUserMedia = async (constraints) => {
      if (!constraints.video) return originalGUM(constraints);

      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      canvas.style.position = 'fixed';
      canvas.style.opacity = '0.001';
      canvas.style.pointerEvents = 'none';
      document.body.appendChild(canvas);
      const ctx = canvas.getContext('2d');

      const img = new Image();
      img.src = qrDataUrl;

      // Calculate 1/3 scale dimensions and centering offsets
      const qrSize = Math.floor(400 / 3);
      const offset = Math.floor((400 - qrSize) / 2);

      // 30 FPS render loop supplying the centered and downscaled QR code frame
      const tick = () => {
        // Clear frame with a solid white background to guarantee clear edge contrast
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 400, 400);

        if (img.complete && img.naturalWidth > 0) {
          // Render the image scaled down to 1/3 and perfectly centered
          ctx.drawImage(img, offset, offset, qrSize, qrSize);
        }
        requestAnimationFrame(tick);
      };
      tick();

      const stream = canvas.captureStream(30);

      if (constraints.audio) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const dst = audioCtx.createMediaStreamDestination();
        oscillator.connect(dst);
        oscillator.start();
        stream.addTrack(dst.stream.getAudioTracks()[0]);
      }

      return stream;
    };
  }, qrCodeDataUrl);

  await page2.goto('/videocall/');

  // Open sender view layout
  await page2.locator('.share-button').click({ force: true });

  // Activate scanner to capture our downscaled centered QR code matrix
  await page2.locator('button:has-text("Scan QR")').click({ force: true });

  // Verify that html5-qrcode captures and decodes the downscaled stream successfully
  await completeConnection(receiver.page, page2);

  await receiver.context.close();
  await context2.close();
});