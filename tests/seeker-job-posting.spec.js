import { test, expect } from '@playwright/test';

test.describe('BidAuc — Login', () => {

 // Test 1: Phone field validation — should not accept non-numeric/short input
  test('should not proceed with invalid phone number', async ({ page }) => {
    await page.goto('http://localhost:5000/');
    await page.getByRole('img', { name: 'Profile Icon' }).click();
    await page.waitForTimeout(2000);

    await page.getByRole('link', { name: 'Login/Register' }).click();
    await page.waitForTimeout(3000);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForTimeout(3000);

    await page.getByRole('textbox', { name: 'Your Phone' }).click();
    await page.getByRole('textbox', { name: 'Your Phone' }).fill('97666919'); //Invalid Phone number

    let dialogMessage = '';
    page.once('dialog', async dialog => {
      dialogMessage = dialog.message();
      console.log(`Dialog message: ${dialogMessage}`);
      await dialog.dismiss();
    });

    await page.locator('[id="verify-phone-button "]').click();

    await page.waitForTimeout(3000);

    console.log('Dialog message on invalid phone:', dialogMessage);
    expect(dialogMessage).toBeTruthy();

  });


  // Test 2: Submit with wrong OTP → dialog/error appears
  test('should show error dialog on wrong OTP', async ({ page }) => {
    await page.goto('http://localhost:5000/');
    await page.getByRole('img', { name: 'Profile Icon' }).click();
    await page.waitForTimeout(2000);

    await page.getByRole('link', { name: 'Login/Register' }).click();
    await page.waitForTimeout(3000);

    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForTimeout(3000);


    await page.getByRole('textbox', { name: 'Your Phone' }).click();

    await page.locator('[id="verify-phone-button "]').click();

    await page.getByRole('textbox', { name: 'Your Phone' }).fill('9766629195');

     await page.locator('[id="verify-phone-button "]').click();
    await page.waitForTimeout(1000);

    await page.locator('#login-otp').click();
    await page.locator('#login-otp').fill('000000');

    let dialogMessage = '';
    page.once('dialog', async dialog => {
      dialogMessage = dialog.message();
      console.log(`Dialog message: ${dialogMessage}`);
      await dialog.dismiss();
    });

    await page.getByRole('button', { name: 'Submit' }).click();

    await page.waitForTimeout(1000);

    expect(dialogMessage).toBeTruthy();

  });


  
  // Test 3: Full successful login (use a real registered phone + real OTP)
  test('should login successfully with valid phone and OTP', async ({ page }) => {
    await page.goto('http://localhost:5000/');
    await page.getByRole('img', { name: 'Profile Icon' }).click();
     await page.waitForTimeout(2000);
    await page.getByRole('link', { name: 'Login/Register' }).click();
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForTimeout(2000);


    await page.getByRole('textbox', { name: 'Your Phone' }).fill('9766629195');

    


    await page.locator('[id="verify-phone-button "]').click();
    await page.waitForTimeout(1000);

    await page.locator('#login-otp').fill('123456'); // real here

    let dialogMessage = '';
    page.once('dialog', async dialog => {
      dialogMessage = dialog.message();
      console.log(`Dialog message: ${dialogMessage}`);
      await dialog.dismiss();
    });

    await page.getByRole('button', { name: 'Submit' }).click();

    await page.waitForTimeout(1000);

    console.log('Dialog message on successful login:', dialogMessage);
    if(dialogMessage == "User logged in successfully"){

    expect(dialogMessage).toBeTruthy();

    }
    else{

      expect(dialogMessage).toBeFalsy();

    }


  });
  

});

