import { config as loadEnv } from 'dotenv';
import { IsNull } from 'typeorm';
import dataSource from '../typeorm.config';
import { Store } from '../src/entities/store.entity';

loadEnv();

const MAPBOX_TOKEN =
  process.env.MAPBOX_TOKEN ||
  process.env.MAPBOX_ACCESS_TOKEN ||
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type GeocodeResult = { latitude: number; longitude: number } | null;

function buildAddress(store: Store): string {
  const parts = [store.addressLine1, store.addressLine2, store.city, store.state, store.postalCode]
    .filter(Boolean)
    .map((part) => part?.toString().trim())
    .filter((part) => part && part.length > 0);
  return parts.join(', ');
}

async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (!MAPBOX_TOKEN) {
    throw new Error('Missing Mapbox token (set MAPBOX_TOKEN or MAPBOX_ACCESS_TOKEN)');
  }
  const url =
    'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
    encodeURIComponent(address) +
    `.json?access_token=${MAPBOX_TOKEN}&limit=1&autocomplete=true&types=address,poi,place`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Mapbox geocoding failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as any;
  const first = data?.features?.[0];
  if (!first?.center || first.center.length < 2) return null;
  const [lng, lat] = first.center;
  return { latitude: lat, longitude: lng };
}

async function main() {
  if (!MAPBOX_TOKEN) {
    throw new Error('Missing Mapbox token. Set MAPBOX_TOKEN in your environment.');
  }

  await dataSource.initialize();
  const repo = dataSource.getRepository(Store);

  const missing = await repo.find({
    where: [{ latitude: IsNull() }, { longitude: IsNull() }],
    order: { createdAt: 'ASC' },
  });

  console.log(`[coords] stores missing lat/lng: ${missing.length}`);
  for (const store of missing) {
    const address = buildAddress(store);
    try {
      const result = await geocodeAddress(address);
      if (!result) {
        console.warn(`[coords] no result for "${store.name}" (${store.id}) -> ${address}`);
        continue;
      }
      store.latitude = result.latitude;
      store.longitude = result.longitude;
      await repo.save(store);
      console.log(
        `[coords] updated ${store.name} (${store.id}) -> ${result.latitude}, ${result.longitude}`,
      );
      await new Promise((resolve) => setTimeout(resolve, 250)); // gentle rate limiting
    } catch (error) {
      console.error(`[coords] failed for "${store.name}" (${store.id})`, error);
    }
  }

  await dataSource.destroy();
  console.log('[coords] done');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
