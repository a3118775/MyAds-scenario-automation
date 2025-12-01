Overview:
This Playwright test automates the login flow for Google Accounts.
It performs the following steps:

Navigates to the Google Sign-In page for Looker Studio.
Verifies the page title contains "Build".
Waits for the email input field to be visible, then enters a specified email address.
Clicks the "Next" button to proceed.
Waits for a long timeout (likely to allow for manual captcha entry).
Clicks the "Next" button again after the timeout.