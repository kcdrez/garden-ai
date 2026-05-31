import { test, expect } from "@playwright/test";

test.describe("Beds", () => {
  test("garden detail shows its beds", async ({ page }) => {
    await page.goto("/gardens");
    await page.getByRole("link", { name: "Sunrise Garden" }).click();

    await expect(page.getByRole("heading", { name: "Garden Beds" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Front Raised Bed" })).toBeVisible();
  });

  test("create a new bed", async ({ page }) => {
    await page.goto("/gardens");
    await page.getByRole("link", { name: "Sunrise Garden" }).click();

    await page.getByRole("button", { name: "Add Bed" }).click();
    await expect(page.getByRole("heading", { name: "Add Bed" })).toBeVisible();

    await page.getByLabel("Name").fill("My E2E Bed");
    await page.getByLabel("Length").fill("6");
    await page.getByLabel("Width").fill("4");
    await page.getByRole("button", { name: "Add Bed" }).click();

    await expect(page.getByRole("link", { name: "My E2E Bed" })).toBeVisible();
  });

  test("edit a bed name", async ({ page }) => {
    await page.goto("/gardens");
    await page.getByRole("link", { name: "Sunrise Garden" }).click();

    // Create a bed to edit
    await page.getByRole("button", { name: "Add Bed" }).click();
    await page.getByLabel("Name").fill("Bed To Edit");
    await page.getByLabel("Length").fill("4");
    await page.getByLabel("Width").fill("4");
    await page.getByRole("button", { name: "Add Bed" }).click();
    await expect(page.getByRole("link", { name: "Bed To Edit" })).toBeVisible();

    await page.getByRole("button", { name: "Bed To Edit actions" }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();

    await expect(page.getByRole("heading", { name: "Edit Bed" })).toBeVisible();
    await page.getByLabel("Name").fill("Bed Edited");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("link", { name: "Bed Edited" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Bed To Edit" })).not.toBeVisible();
  });

  test("delete a bed", async ({ page }) => {
    await page.goto("/gardens");
    await page.getByRole("link", { name: "Sunrise Garden" }).click();

    // Create a bed to delete
    await page.getByRole("button", { name: "Add Bed" }).click();
    await page.getByLabel("Name").fill("Bed To Delete");
    await page.getByLabel("Length").fill("4");
    await page.getByLabel("Width").fill("4");
    await page.getByRole("button", { name: "Add Bed" }).click();
    await expect(page.getByRole("link", { name: "Bed To Delete" })).toBeVisible();

    await page.getByRole("button", { name: "Bed To Delete actions" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();

    await expect(page.getByText("Delete bed?")).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByRole("link", { name: "Bed To Delete" })).not.toBeVisible();
  });
});
