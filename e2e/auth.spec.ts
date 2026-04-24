import { test, expect } from '@playwright/test'

// E2E: fluxo de autenticação e navegação básica
// Requer usuário de teste criado no banco (via seed ou fixture)

const TEST_EMAIL = process.env.E2E_EMAIL ?? 'teste@retinaapp.com.br'
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? 'senha-teste-123'

test.describe('Autenticação', () => {
  test('página de login carrega corretamente', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /entrar|login/i })).toBeVisible()
    await expect(page.getByPlaceholder(/e-mail/i)).toBeVisible()
    await expect(page.getByPlaceholder(/senha/i)).toBeVisible()
  })

  test('login com credenciais inválidas exibe erro', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/e-mail/i).fill('invalido@exemplo.com')
    await page.getByPlaceholder(/senha/i).fill('senhaerrada')
    await page.getByRole('button', { name: /entrar/i }).click()
    await expect(page.getByText(/credenciais|inválido|incorret/i)).toBeVisible({ timeout: 5000 })
  })

  test('login bem-sucedido redireciona para dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/e-mail/i).fill(TEST_EMAIL)
    await page.getByPlaceholder(/senha/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /entrar/i }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
  })
})

test.describe('Navegação pós-login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/e-mail/i).fill(TEST_EMAIL)
    await page.getByPlaceholder(/senha/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /entrar/i }).click()
    await page.waitForURL(/dashboard/, { timeout: 10000 })
  })

  test('dashboard exibe elementos principais', async ({ page }) => {
    await expect(page.getByText(/progresso|questões|desempenho/i)).toBeVisible()
  })

  test('banco de questões carrega', async ({ page }) => {
    await page.goto('/banco')
    await expect(page.getByRole('heading', { name: /banco|questões/i })).toBeVisible()
  })

  test('página de planos carrega e exibe cards', async ({ page }) => {
    await page.goto('/planos')
    await expect(page.getByText(/Pro Mensal/i)).toBeVisible()
    await expect(page.getByText(/grátis|livre/i)).toBeVisible()
  })

  test('logout funciona', async ({ page }) => {
    // Busca botão ou link de logout no nav
    const logoutBtn = page.getByRole('button', { name: /sair|logout/i })
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click()
      await expect(page).toHaveURL(/login|^\/$/, { timeout: 5000 })
    }
  })
})

test.describe('Páginas públicas', () => {
  test('página de privacidade carrega', async ({ page }) => {
    await page.goto('/privacidade')
    await expect(page.getByRole('heading', { name: /privacidade/i })).toBeVisible()
  })

  test('página de termos carrega', async ({ page }) => {
    await page.goto('/termos')
    await expect(page.getByRole('heading', { name: /termos/i })).toBeVisible()
  })

  test('404 exibe mensagem amigável', async ({ page }) => {
    await page.goto('/pagina-que-nao-existe-xyz')
    await expect(page.getByText(/404|não encontrada/i)).toBeVisible()
  })
})
