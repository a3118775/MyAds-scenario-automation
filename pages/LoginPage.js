const { expect, default: test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const links = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/links.json'), 'utf-8')
);

class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = 'input[type="email"]';
    this.nextButton = page.getByRole('button', { name: 'Next' });
  }

  async goto() {
    await this.page.goto(links.loockerPage);
    console.log('Logged in to Loocker Dashboard');
  }

  async enterEmail(email) {
    await this.page.waitForSelector(this.emailInput, { state: 'visible', timeout: 10000 });
    await this.page.locator(this.emailInput).fill(email); 
    await this.nextButton.click();
    await this.page.pause();
    await this.nextButton.click();
    await this.page.waitForTimeout(5000);
  }

  async enterEmail2(email) {
    await this.page.waitForSelector(this.emailInput, { state: 'visible', timeout: 10000 });
    await this.page.locator(this.emailInput).fill(email);
    await this.nextButton.click();
    await this.page.waitForTimeout(7000);
  }
}

class MyadsLoginPage {
  constructor(page) {
    this.page = page;
    this.aid = 'input[type="text"]';
    this.password = 'input[type="password"]';
    this.login = page.getByRole('button', { name: 'Login' });
    this.submitButton = page.getByRole('button', { name: 'Submit' });
  }
  async goto() {
    await this.page.goto(links.myadsPage);
    console.log('Logged in to Myads Dashboard');
    
  } 
   async enterAid(aid) {
    await this.page.waitForSelector(this.aid, { state: 'visible', timeout: 10000 });
    await this.page.locator(this.aid).fill(aid);
  }
  async enterPassword(password) {
    await this.page.waitForSelector(this.password, { state: 'visible', timeout: 10000 });
    await this.page.locator(this.password).fill(password);
    await this.submitButton.click();
  }

}

class EmailLoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = 'input[type="email"]';
    this.nextButton = page.getByRole('button', { name: 'Next' });
  }
  async goto() {
    await this.page.goto(links.outlook);
    console.log('Logged in to Outlook');
  }
  async enterEmail(email) {
    await this.page.locator(this.emailInput).fill(email);
    await this.nextButton.click();
    await this.page.waitForTimeout(5000);
  }
}

class Jira {
  constructor(page) {
    this.page = page;
    this.aid = 'input[type="text"]';
    this.email = 'input[type="email"]';
    this.login = page.getByRole('button', { name: 'Login' });
  }
  async goto() {
    await this.page.goto(links.jiraDashboard);
    await this.page.getByRole('link', { name: 'log in', exact: true }).click();
    console.log('Logged in to Jira Dashboard');
  }
  async enterAid(aid) {
    await this.page.waitForSelector(this.aid, { state: 'visible', timeout: 110000 });
    await this.page.locator(this.aid).fill(aid);
    await this.page.getByRole('button', { name: 'Next' }).click();
    await this.page.waitForTimeout(3000);
  }
  async enterEmail(email) {
    await this.page.locator(this.email).fill(email);
    await this.page.getByRole('button', { name: 'Next' }).click();
    await this.page.waitForTimeout(5000);
  }
}

module.exports = { LoginPage, MyadsLoginPage, EmailLoginPage, Jira };