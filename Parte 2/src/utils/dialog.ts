import { Page } from '@playwright/test';

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
        resolve(text);
      } catch (error) {
        reject(error);
      }
    });
  });

  await action();
  return message;
}