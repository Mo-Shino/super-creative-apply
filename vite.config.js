import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// يحسب عنوان الموقع النهائي (لصورة المعاينة عند مشاركة اللينك على واتساب).
// على Vercel بيتجاب تلقائيًا، ولو عندك دومين خاص حطه في VITE_SITE_URL.
function siteUrlPlugin(env) {
  const url =
    env.VITE_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : '')
  return {
    name: 'site-url',
    transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', url.replace(/\/$/, '')),
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), siteUrlPlugin(env)],
    build: { target: 'es2020', chunkSizeWarningLimit: 600 },
  }
})
