import { expect, test, type Page } from "@playwright/test";

const adminBaseUrl = process.env.E2E_ADMIN_URL ?? "http://localhost:3101";

async function signInMarketplace(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("your@email.com").fill(email);
  await page.getByPlaceholder("Enter your password").fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
}

async function signInAdmin(page: Page, email: string, password: string) {
  await page.goto(`${adminBaseUrl}/login`);
  await page.getByPlaceholder("admin@onyxpropcare.com").fill(email);
  await page.getByPlaceholder("Enter your password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
}

async function registerMarketplaceUser(page: Page, role: "BUYER" | "SELLER", label: string) {
  const nonce = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `${label}.${nonce}@example.com`;
  const phone = `9${nonce.slice(-9)}`;
  const password = role === "SELLER" ? "Seller@123" : "Buyer@123";

  await page.goto("/register");

  if (role === "SELLER") {
    await page.getByRole("button", { name: /sell land/i }).click();
  }

  await page.getByPlaceholder("Enter your full name").fill(`Playwright ${label}`);
  await page.getByPlaceholder("your@email.com").fill(email);
  await page.getByPlaceholder("+91 98765 43210").fill(phone);
  await page.getByPlaceholder("Min. 6 characters").fill(password);
  await page.getByPlaceholder("Confirm your password").fill(password);
  await page.getByRole("button", { name: /create account/i }).click();

  await expect.poll(() => page.url(), { timeout: 30_000 }).not.toContain("/register");

  return { email, phone, password };
}

test.describe("marketplace quality gate", () => {
  test("home page renders and theme toggle persists", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /invest in india's finest land & plots/i })
    ).toBeVisible();

    const themeToggle = page.getByRole("button", { name: /switch to/i }).first();
    await expect(themeToggle).toBeVisible();

    const initialTheme = await page.evaluate(() =>
      document.documentElement.classList.contains("dark") ? "dark" : "light"
    );

    await themeToggle.click();

    const nextTheme = await page.evaluate(() =>
      document.documentElement.classList.contains("dark") ? "dark" : "light"
    );

    expect(nextTheme).not.toBe(initialTheme);

    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem("onyx-theme")))
      .toBe(nextTheme);
  });

  test("buyer can register and reach the dashboard", async ({ page }) => {
    await registerMarketplaceUser(page, "BUYER", "Buyer");
    await expect(page.getByText("Playwright Buyer")).toBeVisible();
  });

  test("buyer cannot activate seller listing plans", async ({ page }) => {
    await signInMarketplace(page, "priya.sharma@example.com", "Buyer@123");

    await page.waitForURL("**/");
    await page.goto("/pricing");

    await expect(page.getByRole("button", { name: /seller account required/i }).first()).toBeVisible();
  });

  test("seller can activate the free pack and reach the listing flow", async ({ page }) => {
    await registerMarketplaceUser(page, "SELLER", "Seller");

    await page.goto("/pricing");
    await page.getByRole("button", { name: /activate free pack/i }).click();

    await page.waitForURL("**/pricing/success**", { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /free pack activated/i })).toBeVisible();

    await page.goto("/dashboard/subscription");
    await expect(page.getByText(/free/i).first()).toBeVisible();

    await page.goto("/properties/new");
    await expect(page.getByRole("heading", { name: /list a new property/i })).toBeVisible();
    await expect(page.getByText(/0 \/ 1 properties used/i)).toBeVisible();
    await expect(page.getByText(/0 \/ 3 images/i)).toBeVisible();
  });

  test("category specific plan blocks the wrong property type and unlocks the right one", async ({ page }) => {
    await registerMarketplaceUser(page, "SELLER", "ResidentialSeller");

    await page.goto("/pricing");
    await page.getByRole("button", { name: "Residential Plots" }).click();
    await page
      .locator("article")
      .filter({ has: page.getByRole("heading", { name: /basic residential plot/i }) })
      .getByRole("button", { name: /continue to payment/i })
      .click();

    await page.waitForURL("**/pricing/success**", { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /basic residential pack activated/i })).toBeVisible();

    await page.goto("/properties/new");
    await expect(page.getByText(/no compatible listing pack/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /create listing/i })).toBeDisabled();

    await page.getByRole("combobox").first().selectOption("RESIDENTIAL_PLOT");
    await expect(page.getByText(/basic residential plot/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /create listing/i })).toBeEnabled();
  });

  test("mobile pricing layout stays usable without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/pricing");

    await expect(page.getByRole("heading", { name: /seller plans shaped for real listing inventory/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Farmland" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Residential Plots" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /basic farmland/i })).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalOverflow).toBeFalsy();
  });
});

test.describe("admin quality gate", () => {
  test("admin can access dashboard, properties, and inquiries", async ({ page }) => {
    await signInAdmin(page, "admin@onyx.com", "Admin@123");

    await page.waitForURL(`${adminBaseUrl}/dashboard`, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await page.goto(`${adminBaseUrl}/dashboard`);
    await expect(page.getByText(/active listings/i)).toBeVisible();

    await page.goto(`${adminBaseUrl}/properties`);
    await expect(page.getByRole("heading", { name: "Properties" })).toBeVisible();

    await page.goto(`${adminBaseUrl}/inquiries`);
    await expect(page.getByRole("heading", { name: "Inquiries" })).toBeVisible();
  });

  test("non-admin users are rejected from the admin portal", async ({ page }) => {
    await signInAdmin(page, "rajesh.patel@example.com", "Seller@123");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/admin privileges required/i)).toBeVisible();
  });
});
