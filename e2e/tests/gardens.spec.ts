import { test, expect } from "@playwright/test";

test.describe("Gardens", () => {
  test("gardens list shows existing gardens", async ({ page }) => {
    await page.goto("/gardens");
    await expect(page.getByRole("heading", { name: "Your Gardens" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sunrise Garden" })).toBeVisible();
  });

  test("create a new garden", async ({ page }) => {
    await page.goto("/gardens");
    await page.getByRole("button", { name: "Add Garden" }).click();

    await expect(page.getByRole("heading", { name: "Add Garden" })).toBeVisible();
    await page.getByLabel("Name").fill("My E2E Garden");
    await page.getByLabel("Length").fill("10");
    await page.getByLabel("Width").fill("8");
    await page.getByRole("button", { name: "Add Garden" }).click();

    await expect(page.getByRole("link", { name: "My E2E Garden" })).toBeVisible();
  });

  test("edit a garden name", async ({ page }) => {
    // Create a garden to edit
    await page.goto("/gardens");
    await page.getByRole("button", { name: "Add Garden" }).click();
    await page.getByLabel("Name").fill("Garden To Edit");
    await page.getByRole("button", { name: "Add Garden" }).click();
    await expect(page.getByRole("link", { name: "Garden To Edit" })).toBeVisible();

    // Open actions menu and edit
    await page.getByRole("button", { name: "Garden To Edit actions" }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();

    await expect(page.getByRole("heading", { name: "Edit Garden" })).toBeVisible();
    await page.getByLabel("Name").fill("Garden Edited");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("link", { name: "Garden Edited" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Garden To Edit" })).not.toBeVisible();
  });

  test("delete a garden", async ({ page }) => {
    // Create a garden to delete
    await page.goto("/gardens");
    await page.getByRole("button", { name: "Add Garden" }).click();
    await page.getByLabel("Name").fill("Garden To Delete");
    await page.getByRole("button", { name: "Add Garden" }).click();
    await expect(page.getByRole("link", { name: "Garden To Delete" })).toBeVisible();

    // Open actions menu and delete
    await page.getByRole("button", { name: "Garden To Delete actions" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();

    // Confirm dialog
    await expect(page.getByText("Delete garden?")).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByRole("link", { name: "Garden To Delete" })).not.toBeVisible();
  });
});
