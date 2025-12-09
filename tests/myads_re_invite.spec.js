const { test,expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { MyadsLoginPage, Jira } = require('../pages/LoginPage');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('myTotallySecretKey3');
const links = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/links.json'), 'utf-8')
);
require('dotenv').config();
import { parse } from 'csv-parse/sync';


test("Myads Re-invite Test", async ({ page, context }) => {
  test.setTimeout(23000000); // set once at the top

  const aid = cryptr.decrypt(process.env.AID);
  const password = cryptr.decrypt(process.env.USER_PASSWORD);
  const email = cryptr.decrypt(process.env.MAIN_USER_USERNAME);

  const jira = new Jira(page);
  await jira.goto();
  await jira.enterAid(aid);
  await jira.enterEmail(email);
  await page.waitForTimeout(51000);
  await page.locator('#gadget-141451 iframe').contentFrame().locator('div').filter({ hasText: 'My Issues' }).nth(4).click();
  await page.locator('#gadget-141451 iframe').contentFrame().getByTestId('export-button').click();
  await page.locator('#gadget-141451 iframe').contentFrame().getByText('Export CSV').click();  const downloadPromise = page.waitForEvent('download');
  const download = await downloadPromise;
  // Wait until download is finished
  const download2 = await download.page();

  // Save with absolute path
  await download.saveAs('downloads/file.csv');
  const content = fs.readFileSync('downloads/file.csv', 'utf-8');
  // console.log(content);

  // Parse CSV into objects
  const records = parse(content, {
    columns: false,          // no header row in your sample
    skip_empty_lines: true
  });

  // Filter rows where last column = "New"
  const newTickets = records.filter(row => {
    const status = row[row.length - 1]; // last column
    return status?.toLowerCase() === 'new';
  });

  if (newTickets.length === 0) {
    console.log("No new tickets found. Ending test.");
    return; // stops the test execution
  }

  // Map: ticketId -> [seller emails]
  const ticketToSellerEmails = new Map();

  // Example: use ticket IDs in further actions
  for (const ticket of newTickets) {
    const ticketId = ticket[0];
    await page.getByRole('searchbox', { name: 'Search ( Type \'/\' )' }).click();
    await page.getByRole('searchbox', { name: 'Search ( Type \'/\' )' }).fill(ticketId);
    await page.getByRole('searchbox', { name: 'Search ( Type \'/\' )' }).press('Enter')
    //await page.waitForTimeout(5000);
    const description = await page.getByText('Description Seller').innerText();

    const keywords = [
      'myads log in issue',
      'to my bby my ads account and i seem to have lost access',
      'We cant log in',
      'Cannot get access to account.',
      'can you please grant us access to my ads portal',
      'keep receiving error message when he tried to login to the Ads',
      'I am having trouble logging into the ad site',
    ];

    if (keywords.some(k => description.toLowerCase().includes(k))) {
      const sellerEmailTxt = await page.locator('#customfield_18560-val').innerText();
      const sellerEmails = sellerEmailTxt.split(',').map(e => e.trim()).filter(Boolean);
      ticketToSellerEmails.set(ticketId, sellerEmails);
    }
  }

  if (ticketToSellerEmails.size === 0) {
    console.log("No description-related tickets found. Ending test.");
    return;
  }
  
  // Flatten all seller emails for MyAds search, but keep per-ticket mapping
  console.log('Ticket-from-emails:', Object.fromEntries(ticketToSellerEmails));
  
  // Login to Myads.bestbuy.com
  const myadsLoginPage = new MyadsLoginPage(page);
  await myadsLoginPage.goto();
  await page.waitForTimeout(3000);
  await page.getByRole('button', { name: 'Login' }).click();
  await myadsLoginPage.enterAid(aid);
  await myadsLoginPage.enterPassword(password);

  // Navigating to user management section
  await page.getByRole('button', { name: 'Account Menu' }).click();
  await page.waitForTimeout(3000);
  await page.getByRole('menuitem', { name: 'User Management' }).click();
  await page.waitForTimeout(3000);

  // Track which sellers got reinvites
  const reinvitedSet = new Set();

  const allSellerEmails = [...new Set([...ticketToSellerEmails.values()].flat())];

  // Loop through each seller email
  for (const emailfetch of allSellerEmails) {
    await page.getByRole('textbox', { name: 'search-input' }).fill(emailfetch);

    await page.getByLabel('Aid').uncheck();
    await page.getByLabel('First Name').uncheck();
    await page.getByLabel('Last Name').uncheck();
    await page.getByLabel('Email').check();
    await page.getByLabel('Brand').uncheck();
    await page.waitForTimeout(5000);

    // Open More menu first
    await page.getByRole('button', { name: 'more' }).click();
    const resendOption = page.getByRole('button', { name: 'Resend invite button' });
    const isResendVisible = await resendOption.isVisible();

    if (isResendVisible) {
      await resendOption.click();
      await page.getByRole('button', { name: 'Resend Invite' }).click();
      reinvitedSet.add(emailfetch);
      console.log(`Invite resent for ${emailfetch}`);
    } else {
      console.log(`Resend button was not available to the seller: ${emailfetch}`);
    }
  }
  console.log('Reinvited sellers:', [...reinvitedSet]);

  // Navigate back to Jira dashboard
  await page.goto(links.jiraDashboard);
  await page.waitForTimeout(5000);

  //Loop through the same tickets you processed
  for (const [ticketId, sellerEmails] of ticketToSellerEmails.entries()) {
    const recipientsForTicket = sellerEmails.filter(e => reinvitedSet.has(e));
    if (recipientsForTicket.length === 0) {
      console.log(`No reinvited sellers for ticket ${ticketId}; skipping email.`);
      continue;
    }
      // Search and open the ticket
      await page.getByRole('searchbox', { name: 'Search ( Type \'/\' )' }).fill('MKTPSS-3268');//ticketId
      await page.getByRole('searchbox', { name: 'Search ( Type \'/\' )' }).press('Enter');
      await page.waitForTimeout(5000);

      // Add a comment to the ticket (acts as your "mail")
      await page.getByRole('button', { name: 'Email' }).click();
      await page.waitForTimeout(4000);
      await page.getByRole('textbox', { name: 'Recipients (To):' }).click();
      await page.getByRole('textbox', { name: 'Recipients (To):' }).fill(recipientsForTicket.join(', '));//
      await page.waitForTimeout(4000);
      await page.locator('#select2-drop').click();
      await page.waitForTimeout(5000);
      await page.getByLabel('Email Template:').selectOption('6');
      await page.waitForTimeout(2000);
      await page.locator('iframe[title="Rich Text Area"]').contentFrame().getByLabel('Body:, Rich Text Area. Press').fill('Hello,/n /n Thank you for contacting My Ads Support!/nWe have resent an invite to setup account. Please check all email folders, including spam, junk, and trash, in case the message was filtered incorrectly./nOnce setup is done .The attached word document will help walk you through the steps to get started with My Ads. We have also attached a link here that provides step by step instructions for creating your first Sponsored Products campaign./nNote: You must add a credit card before you are able to publish a campaign. Only your accounts assigned billing admin can upload a credit card.');
      await page.waitForTimeout(2000);

      await page.keyboard.press('PageDown');
      await page.keyboard.press('End');
      await page.getByRole('button', { name: 'Send', exact: true }).click();

      //await page.goBack();
      // await page.waitForTimeout(2000);
      // await page.getByRole('button', { name: ' New' }).click();
      // await page.getByRole('menuitem', { name: 'Close  Change status to' }).click();
      // const resolutionDropdown = page.getByLabel('Resolution Required').click();
      // await resolutionDropdown.selectOption('12');

      // await page.getByRole('button', {name:'Close'}).click();

      console.log(`Mail sent for ticket ${ticketId} to: ${recipientsForTicket.join(', ')}`);
  }

  //Prepare just the reinvited sellers list
  const date = new Date();
  const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
  let fileName = `reinvite_sent_${formattedDate}.json`;
  const folderpath = path.join('./reinvite/');
  if (!fs.existsSync(folderpath)){
    fs.mkdirSync(folderpath);
  }
  
  fileName = path.join(folderpath, fileName);
  fs.writeFileSync(fileName, JSON.stringify(...reinvitedSet, null, 2));
  console.log(`Final report saved to ${fileName}`);

});
