import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Authentication", () => {
  test("login with valid credentials redirects to gardens", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Username or email").fill("testuser");
    await page.getByLabel("Password").fill("TestPass123!");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL("/gardens");
    await expect(page.getByRole("heading", { name: "Your Gardens" })).toBeVisible();
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Username or email").fill("testuser");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("logout clears session and redirects to login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Username or email").fill("testuser");
    await page.getByLabel("Password").fill("TestPass123!");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL("/gardens");

    // Log out
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Logout" }).click();

    await expect(page).toHaveURL("/login");
  });

  test("unauthenticated access to protected route redirects to login", async ({ page }) => {
    await page.goto("/gardens");
    await expect(page).toHaveURL("/login");
  });
});
