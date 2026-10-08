/**
 * Contenido personal de /about. Cada bloque se muestra solo cuando tiene datos:
 * llena estos valores y aparece en la página.
 */
export type Book = { title: string; author: string }

/** Lo que estás leyendo ahora (2 o 3). */
export const BOOKS: Book[] = [
  { title: 'Modernidad líquida', author: 'Zygmunt Bauman' },
  { title: 'Vigilar y castigar', author: 'Michel Foucault' },
  { title: 'Cradle to Cradle', author: 'William McDonough y Michael Braungart' },
]

/** Playlist de trabajo: enlace de Spotify o Apple Music (Compartir → Copiar enlace). */
export const PLAYLIST = { name: 'Mr. Oizo Essentials', url: 'https://music.apple.com/mx/playlist/mr-oizo-essentials/pl.082ad83374da43b5863716438fa52858' }
