export type MusicSearchResult = {
  id: string;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string | null;
};

export async function fetchLyrics(artist: string, title: string): Promise<string | null> {
  try {
    const a = encodeURIComponent(artist.trim());
    const t = encodeURIComponent(title.trim());
    const res = await fetch(`https://api.lyrics.ovh/v1/${a}/${t}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.error || !json.lyrics) return null;
    return (json.lyrics as string).trim() || null;
  } catch {
    return null;
  }
}

export async function searchMusic(query: string): Promise<MusicSearchResult[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query.trim())}&media=music&limit=15&country=BR`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Erro ao buscar músicas');
  const json = await res.json();
  const seen = new Set<string>();
  const results: MusicSearchResult[] = [];
  for (const item of json.results ?? []) {
    const key = `${item.artistName}::${item.trackName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      id: String(item.trackId),
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName ?? '',
      artworkUrl: item.artworkUrl60 ?? null,
    });
  }
  return results;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function buildCifrasClubUrl(artist: string, title: string): string {
  return `https://www.cifraclub.com.br/${slugify(artist)}/${slugify(title)}/`;
}

export function buildYouTubeSearchUrl(artist: string, title: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${title}`)}`;
}

export function extractYouTubeLinks(links: string[]): string[] {
  return links.filter((l) => l.includes('youtube.com') || l.includes('youtu.be'));
}
