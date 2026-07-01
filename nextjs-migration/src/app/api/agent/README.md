# Agent API

Read-only API for other Codex projects. Requests must include:

```http
Authorization: Bearer <AGENT_API_TOKEN>
```

## Endpoints

- `GET /api/agent/catalog`
- `GET /api/agent/musics`
- `GET /api/agent/musics/[id]`
- `GET /api/agent/musics/search?q=keyword`

## Response Shape

`catalog` returns:

- `musics`: music summaries with related novel ids, comic ids, and lyric availability.
- `novels`: novel metadata with `r2Key` derived as `novel/{id}.md`.
- `comics`: comic metadata with `r2Prefix` derived as `comics/{id}/`.
- `books`: book metadata with ordered novel ids and purchase links.

`musics` endpoints return music summaries:

```ts
interface AgentMusicSummary {
  id: number;
  korTitle: string;
  enTitle: string;
  title: string;
  specialPath?: string;
  youtubeId: string;
  novels: number[];
  comics: number[];
  hasLyricTrack: boolean;
}
```
