import { test, expect } from '@playwright/test';

test('register, validate, log in, restore verified user, CRUD and log out across tabs', async ({ page, context }) => {
  const email = `browser-${Date.now()}@example.com`;
  const password = 'BrowserPassword123!';
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Chưa có tài khoản? Đăng ký' }).click();
  await page.getByLabel('Email', { exact: true }).fill('invalid');
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('email hợp lệ');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByLabel('Xác nhận mật khẩu').fill('mismatch');
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('không khớp');
  await page.getByLabel('Xác nhận mật khẩu').fill(password);
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Đăng ký thành công');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('WrongPassword!');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('không đúng');
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('lab.auth')));
  expect(saved.user.email).toBe(email);
  expect(JSON.stringify(saved)).not.toContain(password);
  await page.evaluate(() => { const saved = JSON.parse(localStorage.getItem('lab.auth')); saved.user.email = 'tampered@example.com'; localStorage.setItem('lab.auth', JSON.stringify(saved)); });
  await page.reload();
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await expect(page.getByText('tampered@example.com', { exact: true })).toHaveCount(0);
  const name = `Browser product ${Date.now()}`;
  await page.getByLabel('Tên sản phẩm').fill(name);
  await page.getByLabel('Giá (VNĐ)').fill('123');
  await page.getByLabel('Số lượng').fill('2');
  await page.getByRole('button', { name: 'Thêm sản phẩm', exact: true }).click();
  const row = page.getByRole('row').filter({ hasText: name });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Sửa', exact: true }).click();
  await page.getByLabel('Số lượng').fill('5');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(row.getByRole('cell', { name: '5', exact: true })).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await row.getByRole('button', { name: 'Xóa', exact: true }).click();
  await expect(row).toHaveCount(0);
  const second = await context.newPage();
  await second.goto('/');
  await expect(second.getByText(email, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
  await expect(second.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('lab.auth'))).toBeNull();
  const revoked = await page.request.get('http://localhost:5080/api/auth/me', { headers: { Authorization: `Bearer ${saved.token}` } });
  expect(revoked.status()).toBe(401);
  expect(errors).toEqual([]);
});

test('corrupt, expired and forged sessions return to login', async ({ page }) => {
  await page.goto('/');
  for (const saved of ['broken json', JSON.stringify({ token: 'F'.repeat(64), expiresAt: '2000-01-01T00:00:00Z' }), JSON.stringify({ token: 'F'.repeat(64), expiresAt: '2099-01-01T00:00:00Z' })]) {
    await page.evaluate(value => localStorage.setItem('lab.auth', value), saved);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('lab.auth'))).toBeNull();
  }
});
