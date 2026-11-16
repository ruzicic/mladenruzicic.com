/**
 * Stands in for the per-tile id prefix inside `TileArt.body`. Its own module,
 * free of zod and of `node:fs`, because the tile also renders inside client
 * islands.
 */
export const TILE_ART_ID = "__tile__"
