import { Page, test } from '@playwright/test';

export async function acceptNextDialog(page: Page, action: () => Promise<void>): Promise<string> {
  const viewDelay = Number(process.env.SLOW_MO ?? 0);

  const message = new Promise<string>((resolve, reject) => {
    page.once('dialog', async (dialog) => {
      try {
        const text = dialog.message();
        if (viewDelay > 0) {
          await page.waitForTimeout(viewDelay);
        }
        await dialog.accept();
        await test.info().attach('dialog-message', { body: text, contentType: 'text/plain' });
        resolve(text);
      } catch (error) {
        reject(error);
      }
    });
  });

  await action();
  return message;
}