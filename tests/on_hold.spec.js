const { test } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { MyadsLoginPage } = require('../pages/LoginPage');
const {EmailLoginPage} = require('../pages/LoginPage');
const path = require('path');
const fs = require('fs');
const Cryptr = require('cryptr');
  const cryptr = new Cryptr('myTotallySecretKey3');
require('dotenv').config();
// const cryptr = new Cryptr(process.env.SECRET_KEY);

test("on hold test", async ({ page }) => {


  const email = cryptr.decrypt(process.env.MAIN_USER_USERNAME);
  const password = cryptr.decrypt(process.env.USER_PASSWORD);
  const aid = cryptr.decrypt(process.env.AID);
  const secondaryEmail = cryptr.decrypt(process.env.AID_USERNAME);

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.enterEmail(email);
  await loginPage.enterEmail2(secondaryEmail);

  // Selecting seller details
  await page.getByText('Sellers Detail').click();

  // Navigating to billing status section
  await page.getByText('Billing status').click();
  await page.waitForTimeout(5000);

  // Step 1: Find sellers with billing status "on_hold"
  const onHoldSellers = await page.$$eval('.row', rows => {
    const sellers = [];
    const headers = Array.from(document.querySelectorAll('.colName.word-wrap'))
      .map(h => h.textContent.trim().toLowerCase());

    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('.cell')).map(c => c.textContent.trim());

      if (cells.length === headers.length) {
        const billingStatusIndex = headers.findIndex(h => h.includes('billing status'));
        const billingStatus = cells[billingStatusIndex]?.toLowerCase();

        if (billingStatus === 'on_hold') {
          const seller = {};
          headers.forEach((header, i) => {
            seller[header] = cells[i];
          });

          sellers.push({
            seller_id: seller['seller id'],
            organization: seller['organization'],
            seller_name: seller['seller name'],
            billingStatus: seller['billing status'],
            onboarded: seller['onboarded'],
            ad_spend: seller['ad spend'],
            ad_atributed_revenue: seller['amount2'],
            ROAS: seller['roas'],
          });
        }
      }
    });

    return sellers;
  });

  console.log(`Found ${onHoldSellers.length} sellers on hold:`);
  onHoldSellers.forEach((seller, index) => {
    console.log(`Seller ${index + 1}:`, seller);
  });

  await page.waitForTimeout(5000);

  // Login to Myads.bestbuy.com
  const myadsLoginPage = new MyadsLoginPage(page);
  await myadsLoginPage.goto();
  await page.waitForTimeout(3000);
  await page.getByRole('button', { name: 'Login' }).click();
  await myadsLoginPage.enterAid(aid);
  await myadsLoginPage.enterPassword(password);
  test.setTimeout(90000);

  // Navigate to User Management
  await page.getByRole('button', { name: 'Account Menu' }).click();
  await page.waitForTimeout(3000);
  await page.getByRole('menuitem', { name: 'User Management' }).click();
  await page.waitForTimeout(3000);

  console.log(`Found ${onHoldSellers.length} sellers on hold:`);

  const allResults = [];

  // Step 2: Loop through each seller
  for (const seller of onHoldSellers) {
    const sellerName = seller.seller_name;
    if (!sellerName) {
      throw new Error("Seller name is missing in seller object");
    }

    const searchBox = page.getByRole('textbox', { name: 'search-input' });
    await searchBox.fill('');
    await searchBox.fill(sellerName);

    await page.getByLabel('Aid').uncheck();
    await page.getByLabel('First Name').uncheck(); // corrected casing
    await page.getByLabel('Last Name').uncheck();
    await page.getByLabel('Email').check();

    await searchBox.press('Enter');
    await page.waitForTimeout(3000);

    // Wait for table to load
    await page.waitForSelector('table tbody tr td');

    // Extract emails of sellers with role = "Billing Admin"
    const sellersWithEmails = await page.$$eval(
      'table tbody tr',
      rows => {
        const results = [];
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          const email = cells[3]?.innerText?.trim(); // 4th column
          const role = cells[4]?.innerText?.trim();  // 5th column
          const seller = cells[6]?.innerText?.trim(); // adjust index if seller name is in another column
          if (role?.includes('Billing Admin') && email) {
            results.push({ seller, email });
          }
        });
        return results;
      }
    );
    console.log('Billing Admin Emails:', sellersWithEmails);
    allResults.push(...sellersWithEmails);
  }

  // Format date as YYYY-MM-DD
  const date = new Date();
  const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
  let fileName = `email_sent_${formattedDate}.json`;
  const folderpath = path.join('./reports/');
  if (!fs.existsSync(folderpath)){
    fs.mkdirSync(folderpath);
  }

  fileName = path.join(folderpath, fileName);
  fs.writeFileSync(fileName, JSON.stringify(allResults, null, 2));
  console.log(`Final report saved to ${fileName}`);

  const EmailLogin = new EmailLoginPage(page);
  await EmailLogin.goto();

  //click on buttonnw mail
  await page.getByRole('button', { name: 'New mail' }).click();
  await page.waitForTimeout(3000);

  // Using role + aria-label
  const toField = page.locator('div[aria-label="To"][contenteditable="true"]');
  await toField.fill("ashlesha.diddibagil@bestbuy.com");
  await page.waitForTimeout(2000);

  // Subject field
  const subjectField = page.getByPlaceholder('Add a subject');
  await subjectField.fill('Regarding Billing Status On Hold');
  await page.waitForTimeout(2000);

  // Body field
  const messageBody = page.getByLabel('Message body');
  await messageBody.fill('Hello, \n \n We’re writing to let you know that your My Ads account is currently marked as ‘On Hold’ due to a recent billing issue. \n \nTo resolve this, please log in to your account and Pay Outstanding Amount.\n\nOnce the payment is successfully processed, your campaigns may be resumed.\n\nIf you have any questions or need assistance, feel free to reach out—we’re here to help.');
  await page.waitForTimeout(2000);

  //ad signature
  const insert = page.getByRole('tab', { name: 'Insert' })
  await insert.click();
  const signatureButton = page.getByRole('button', { name: 'Signature' })
  await signatureButton.click();
  await page.waitForTimeout(2000);
  const selectsign = page.getByText('Insert Signature');
  await selectsign.click();
  await page.waitForTimeout(6000);

  // Send the email
  const sendButton = page.getByRole('button', { name: 'Send', exact: true });
  await sendButton.click();
  await page.waitForTimeout(5000);
  console.log('Email sent successfully.');
});