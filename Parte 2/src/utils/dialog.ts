import { Page, test } from '@playwright/test';

// Acepta un alert nativo dentro del listener, apenas aparece.
// - Si se esperara después de la acción, un alert que aparece durante el clic
//   bloquea la página y el clic nunca termina (deadlock).
// - Se resuelve recién después de aceptar: si el test navegara antes, el accept
//   fallaría con "Not attached to an active page".
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