import { expect, test, type Browser, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const adminBaseUrl = process.env.E2E_ADMIN_URL ?? "http://localhost:3101";
const apiBaseUrl = process.env.E2E_API_URL ?? "http://localhost:4000/api/v1";
const recordingsDir = path.resolve(process.cwd(), "artifacts", "recordings");

async function pause(page: Page, ms = 600) {
  await page.waitForTimeout(ms);
}

async function smoothScroll(page: Page) {
  await page.mouse.move(900, 320);
  await page.mouse.wheel(0, 700);
  await pause(page, 500);
  await page.mouse.wheel(0, -350);
  await pause(page, 400);
}

async function openAndShow(page: Page, url: string, settle = 1000) {
  await page.goto(url);
  await pause(page, settle);
  await smoothScroll(page);
}

async function loginMarketplace(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("your@email.com").fill(email);
  await page.getByPlaceholder("Enter your password").fill(password);
  await pause(page, 300);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL("**/");
  await pause(page, 800);
}

async function loginAdmin(page: Page, email: string, password: string) {
  await page.goto(`${adminBaseUrl}/login`);
  await page.getByPlaceholder("admin@onyxpropcare.com").fill(email);
  await page.getByPlaceholder("Enter your password").fill(password);
  await pause(page, 300);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(`${adminBaseUrl}/dashboard`);
  await pause(page, 800);
}

async function setTheme(page: Page, theme: "light" | "dark") {
  const toggle = page.getByRole("button", { name: /switch to/i }).first();

  if (!(await toggle.isVisible().catch(() => false))) {
    return;
  }

  const needsDark = theme === "dark" && (await toggle.getAttribute("aria-label"))?.match(/dark/i);
  const needsLight = theme === "light" && (await toggle.getAttribute("aria-label"))?.match(/light/i);

  if (needsDark || needsLight) {
    await toggle.click();
    await pause(page, 900);
  }
}

async function fetchShowcaseProperties() {
  const response = await fetch(`${apiBaseUrl}/properties?limit=3`);
  const payload = await response.json();

  if (!payload.success || !Array.isArray(payload.data) || payload.data.length < 3) {
    throw new Error("Unable to load showcase properties for recordings.");
  }

  return payload.data.slice(0, 3) as Array<{
    id: string;
    slug: string;
    title: string;
  }>;
}

async function recordScenario(
  browser: Browser,
  filename: string,
  run: (page: Page) => Promise<void>
) {
  await fs.mkdir(recordingsDir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();
  const video = page.video();

  try {
    await run(page);
  } finally {
    await context.close();
  }

  if (!video) {
    throw new Error(`Video capture unavailable for ${filename}`);
  }

  const source = await video.path();
  const target = path.join(recordingsDir, filename);

  await fs.copyFile(source, target);
}

test.describe.configure({ mode: "serial" });

test("record buyer light view", async ({ browser }) => {
  await recordScenario(browser, "buyer-light.webm", async (page) => {
    const properties = await fetchShowcaseProperties();
    await loginMarketplace(page, "priya.sharma@example.com", "Buyer@123");
    await setTheme(page, "light");

    await openAndShow(page, "/");
    await openAndShow(page, "/properties?type=FARMLAND&sortBy=price_desc");
    await openAndShow(page, `/properties/${properties[0].slug}`, 1200);
    await openAndShow(page, `/properties/compare?ids=${properties.map((property) => property.id).join(",")}`, 1200);
    await openAndShow(page, "/dashboard/favorites", 1200);
    await openAndShow(page, "/dashboard/inquiries", 1200);
  });
});

test("record buyer dark view", async ({ browser }) => {
  await recordScenario(browser, "buyer-dark.webm", async (page) => {
    const properties = await fetchShowcaseProperties();
    await loginMarketplace(page, "priya.sharma@example.com", "Buyer@123");
    await setTheme(page, "dark");

    await openAndShow(page, `/properties/${properties[1].slug}`, 1200);
    await openAndShow(page, "/insights/soil", 1100);
    await openAndShow(page, "/insights/water", 1100);
    await openAndShow(page, "/insights/legal", 1100);
    await openAndShow(page, "/insights/drone", 1100);
    await openAndShow(page, "/calculator", 1100);
    await openAndShow(page, "/contact", 1100);
  });
});

test("record seller light view", async ({ browser }) => {
  await recordScenario(browser, "seller-light.webm", async (page) => {
    await loginMarketplace(page, "rajesh.patel@example.com", "Seller@123");
    await setTheme(page, "light");

    await openAndShow(page, "/dashboard", 1100);
    await openAndShow(page, "/dashboard/subscription", 1200);
    await openAndShow(page, "/pricing", 1200);
    await page.getByRole("button", { name: "Residential Plots" }).click();
    await pause(page, 900);
    await smoothScroll(page);

    await openAndShow(page, "/dashboard/properties", 1200);
    await page.locator("a[href*='/dashboard/properties/'][href$='/edit']").first().click();
    await pause(page, 1300);
    await smoothScroll(page);

    await page.goto("/properties/new");
    await pause(page, 1200);
    await page.getByRole("combobox").first().selectOption("RESIDENTIAL_PLOT");
    await pause(page, 800);
    await smoothScroll(page);
  });
});

test("record seller dark view", async ({ browser }) => {
  await recordScenario(browser, "seller-dark.webm", async (page) => {
    const properties = await fetchShowcaseProperties();
    await loginMarketplace(page, "rajesh.patel@example.com", "Seller@123");
    await setTheme(page, "dark");

    await openAndShow(page, `/properties/${properties[2].slug}`, 1200);
    await openAndShow(page, "/dashboard/properties", 1200);
    await openAndShow(page, "/dashboard/inquiries", 1200);
    await openAndShow(page, "/dashboard/subscription", 1200);
    await openAndShow(page, "/pricing", 1200);
    await page.getByRole("button", { name: "Farmland" }).click();
    await pause(page, 700);
    await smoothScroll(page);
    await openAndShow(page, "/properties/new", 1200);
  });
});

test("record admin light view", async ({ browser }) => {
  await recordScenario(browser, "admin-light.webm", async (page) => {
    await loginAdmin(page, "admin@onyx.com", "Admin@123");
    await setTheme(page, "light");

    await page.goto(`${adminBaseUrl}/dashboard`);
    await pause(page, 1000);
    await smoothScroll(page);

    await page.goto(`${adminBaseUrl}/properties`);
    await pause(page, 1000);

    await page.goto(`${adminBaseUrl}/inquiries`);
    await pause(page, 1000);
  });
});

test("record admin dark view", async ({ browser }) => {
  await recordScenario(browser, "admin-dark.webm", async (page) => {
    await loginAdmin(page, "admin@onyx.com", "Admin@123");
    await setTheme(page, "dark");

    await page.goto(`${adminBaseUrl}/dashboard`);
    await pause(page, 1000);
    await page.goto(`${adminBaseUrl}/users`);
    await pause(page, 1000);
    await smoothScroll(page);

    await page.goto(`${adminBaseUrl}/settings`);
    await pause(page, 1000);
  });
});
