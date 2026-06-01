import { test, expect } from "@playwright/test";

test.describe("Beds", () => {
  test("create a new bed", async ({ page }) => {
    await page.goto("/gardens");
    await page.getByRole("link", { name: "Sunrise Garden" }).click();

    await page.getByRole("button", { name: "Add Bed" }).click();
    await expect(page.getByRole("heading", { name: "Add Bed" })).toBeVisible();

    await page.getByLabel("Name").fill("My E2E Bed");
    await page.getByLabel("Length").fill("6");
    await page.getByLabel("Width").fill("4");
    await page.getByRole("button", { name: "Add Bed" }).click();

    // Bed appears in the Unplaced Beds section as a chip
    await expect(page.getByText("My E2E Bed")).toBeVisible();
  });

  test("edit a bed name", async ({ page }) => {
    // Create a bed to edit via the garden detail page
    await page.goto("/gardens");
    await page.getByRole("link", { name: "Sunrise Garden" }).click();
    await page.getByRole("button", { name: "Add Bed" }).click();
    await page.getByLabel("Name").fill("Bed To Edit");
    await page.getByLabel("Length").fill("4");
    await page.getByLabel("Width").fill("4");
    await page.getByRole("button", { name: "Add Bed" }).click();
    await expect(page.getByText("Bed To Edit")).toBeVisible();

    // Edit via the all-beds page where BedItem cards are still shown
    await page.goto("/beds");
    await page.getByRole("button", { name: "Bed To Edit actions" }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();

    await expect(page.getByRole("heading", { name: "Edit Bed" })).toBeVisible();
    await page.getByLabel("Name").fill("Bed Edited");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("link", { name: "Bed Edited" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Bed To Edit" })).not.toBeVisible();
  });

  test("delete a bed", async ({ page }) => {
    // Create a bed to delete via the garden detail page
    await page.goto("/gardens");
    await page.getByRole("link", { name: "Sunrise Garden" }).click();
    await page.getByRole("button", { name: "Add Bed" }).click();
    await page.getByLabel("Name").fill("Bed To Delete");
    await page.getByLabel("Length").fill("4");
    await page.getByLabel("Width").fill("4");
    await page.getByRole("button", { name: "Add Bed" }).click();
    await expect(page.getByText("Bed To Delete")).toBeVisible();

    // Delete via the all-beds page where BedItem cards are still shown
    await page.goto("/beds");
    await page.getByRole("button", { name: "Bed To Delete actions" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();

    await expect(page.getByText("Delete bed?")).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByRole("link", { name: "Bed To Delete" })).not.toBeVisible();
  });
});
