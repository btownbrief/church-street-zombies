import {defineConfig} from 'vite';

// Keep the existing root localhost preview; Pages serves the game under its repo slug.
export default defineConfig(({command,isPreview})=>({
  base: command==='build'||isPreview ? '/church-street-zombies/' : '/'
}));
