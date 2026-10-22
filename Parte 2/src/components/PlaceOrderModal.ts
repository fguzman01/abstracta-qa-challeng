import { Locator, Page, expect } from '@playwright/test';
import { Customer } from '../types/customer';
import { acceptNextDialog } from '../utils/dialog';

export interface PurchaseConfirmation {
  title: string;
  details: string;
}

// Componente y no page: el modal no tiene URL propia, vive dentro de CartPage.

export class PlaceOrderModal {
  private readonly nameInput: Locator;
  private readonly countryInput: Locator;
  private readonly cityInput: Locator;
  private readonly cardInput: Locator;
  private readonly monthInput: Locator;
  private readonly yearInput: Locator;
  private readonly purchaseButton: Locator;
  private readonly confirmationTitle: Locator;
  private readonly confirmationDetails: Locator;
  private readonly confirmationOkButton: Locator;

  constructor(private readonly page: Page) {
    this.nameInput = page.locator('#name');
    this.countryInput = page.locator('#country');
    this.cityInput = page.locator('#city');
    this.cardInput = page.locator('#card');
    this.monthInput = page.locator('#month');
    this.yearInput = page.locator('#year');
    this.purchaseButton = page.getByRole('button', { name: 'Purchase' });
    this.confirmationTitle = page.locator('.sweet-alert h2');
    this.confirmationDetails = page.locator('.sweet-alert p.lead');
    this.confirmationOkButton = page.locator('.sweet-alert .confirm');
  }

  async fillForm(customer: Customer): Promise<void> {
    await this.nameInput.fill(customer.name);
    await this.countryInput.fill(customer.country);
    await this.cityInput.fill(customer.city);
    await this.cardInput.fill(customer.card);
    await this.monthInput.fill(customer.month);
    await this.yearInput.fill(customer.year);
  }

  async purchase(): Promise<PurchaseConfirmation> {
    await this.purchaseButton.click();
    await this.confirmationTitle.waitFor();

    return {
      title: await this.confirmationTitle.innerText(),
      details: await this.confirmationDetails.innerText(),
    };
  }

  async closeConfirmation(): Promise<void> {
    await this.confirmationOkButton.click();
  }

  async submitExpectingAlert(): Promise<string> {
    return acceptNextDialog(this.page, () => this.purchaseButton.click())
  }

  async expectNoConfirmation(): Promise<void> {
    await expect(this.confirmationTitle).toBeHidden();
  }

}