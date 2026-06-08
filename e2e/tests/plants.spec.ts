import { test, expect, type Page } from "@playwright/test";

async function goToBedDetail(page: Page) {
  await page.goto("/beds");
  await page.getByRole("link", { name: "Front Raised Bed" }).click();
}

async function createPlantInBed(page: Page, plantName: string) {
  // Scroll to the "Unplaced Plants" section and click "Add Plant"
  const addPlantBtn = page.getByRole("button", { name: "Add Plant" }).first();
  await addPlantBtn.scrollIntoViewIfNeeded();
  await addPlantBtn.click();
  await expect(page.getByRole("heading", { name: "Add Plant" })).toBeVisible();
  await page.getByLabel("Search plants").fill(plantName);
  await page.getByRole("button", { name: new RegExp(plantName) }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Add Plant" }).click();
  await expect(page.getByRole("heading", { name: "Add Plant" })).not.toBeVisible();
}

test.describe("Plants", () => {
  test("bed layout shows placed plants", async ({ page }) => {
    await goToBedDetail(page);
    await expect(page.getByText("All plants are placed in the bed.")).toBeVisible();
  });

  test("create a new plant in a bed", async ({ page }) => {
    await goToBedDetail(page);
    await createPlantInBed(page, "Basil");
    await expect(page.getByText("Basil").first()).toBeVisible();
  });

  test("place a plant on the canvas", async ({ page }) => {
    await goToBedDetail(page);
    await createPlantInBed(page, "Kale");
    await expect(page.getByText("Kale").first()).toBeVisible();

    // Click the canvas background to open the "Add to Bed" wizard
    await page.locator('rect[style*="crosshair"]').click();
    await expect(page.getByRole("heading", { name: "Add to Bed" })).toBeVisible();

    // Navigate through the wizard: choose "Place a Plant", then pick Kale
    await page.getByRole("button", { name: /Place a Plant/ }).click();
    await page.getByRole("button", { name: /Kale/ }).click();

    // Kale is now placed — its chip no longer appears in the unplaced section
    await expect(page.getByRole("button", { name: "Kale actions" })).not.toBeVisible();
  });

  test("add an observation to a plant from the all-plants list", async ({ page }) => {
    await page.goto("/plants");

    const plantItem = page.locator("li").filter({
      has: page.getByRole("link", { name: "Tomato" }),
    });
    await plantItem.getByRole("button", { name: "Plant actions" }).click();
    await page.getByRole("menuitem", { name: "Observations" }).click();

    await expect(page.getByRole("heading", { name: "Tomato" })).toBeVisible();
    await page.getByRole("button", { name: "Add Observation" }).click();

    const today = new Date().toISOString().split("T")[0];
    await page.getByLabel("Date").fill(today);
    await page.getByLabel("Note").fill("Looking healthy!");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Looking healthy!")).toBeVisible();
  });

  test("edit a plant", async ({ page }) => {
    await goToBedDetail(page);
    await createPlantInBed(page, "Cucumber");

    await page.getByRole("button", { name: /Cucumber.*actions/ }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();

    await expect(page.getByRole("heading", { name: "Edit Plant" })).toBeVisible();
    await page.getByLabel("Variety (optional)").fill("E2E Test Variety");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("E2E Test Variety")).toBeVisible();
  });

  test("delete a plant", async ({ page }) => {
    await goToBedDetail(page);
    await createPlantInBed(page, "Lettuce");

    await page.getByRole("button", { name: /Lettuce.*actions/ }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();

    await expect(page.getByText("Delete plant?")).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByRole("link", { name: "Lettuce" })).not.toBeVisible();
  });
});
