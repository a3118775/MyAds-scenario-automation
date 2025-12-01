const { test } = require('@playwright/test');
const { MyadsLoginPage } = require('../pages/LoginPage');
const fs = require('fs');
const path = require('path');

// Load credentials
const users = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../credentials/user.json'), 'utf-8')
);

test.describe('Resend Invite Tests', () => {
    test("resent invite test", async ({ page }) => {
  const myadsLoginPage = new MyadsLoginPage(page);
    await myadsLoginPage.goto();
    // await page.waitForTimeout(3000);
    await page.getByRole('button', { name: 'Login' }).click();
    await myadsLoginPage.enterAid(users.aid);
    await myadsLoginPage.enterPassword(users.mainUser.password);
    test.setTimeout(90000);
});
});
