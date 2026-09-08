import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: Change '/09-fitness-tracker/' to match your GitHub repo name exactly
// e.g., if repo is 'my-fitness', use '/my-fitness/'
// If using a custom domain (CNAME), use '/' instead
export default defineConfig({
  plugins: [react()],
  base: '/09-fitness-tracker/',
})
