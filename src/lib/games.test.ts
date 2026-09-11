import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
} from './games';
import { getAllCategories } from './categories';
import { getAllPublishers } from './publishers';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

async function seedFilteredGames(db: Database): Promise<{ categoryIds: number[]; publisherIds: number[] }> {
    const insertedCategories = await db
        .insert(categories)
        .values([
            { name: 'Adventure', description: 'adventure' },
            { name: 'Strategy', description: 'strategy' },
            { name: 'Puzzle', description: 'puzzle' },
        ])
        .returning({ id: categories.id });
    const insertedPublishers = await db
        .insert(publishers)
        .values([
            { name: 'Pub One', description: 'one' },
            { name: 'Pub Two', description: 'two' },
        ])
        .returning({ id: publishers.id });

    await db.insert(games).values([
        {
            title: 'Adventure One',
            description: 'Description',
            starRating: 4,
            categoryId: insertedCategories[0].id,
            publisherId: insertedPublishers[0].id,
        },
        {
            title: 'Puzzle One',
            description: 'Description',
            starRating: 4,
            categoryId: insertedCategories[2].id,
            publisherId: insertedPublishers[0].id,
        },
        {
            title: 'Strategy One',
            description: 'Description',
            starRating: 4,
            categoryId: insertedCategories[1].id,
            publisherId: insertedPublishers[1].id,
        },
        {
            title: 'Strategy Two',
            description: 'Description',
            starRating: 4,
            categoryId: insertedCategories[1].id,
            publisherId: insertedPublishers[0].id,
        },
    ]);

    return {
        categoryIds: insertedCategories.map((category) => category.id),
        publisherIds: insertedPublishers.map((publisher) => publisher.id),
    };
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('filters by one or more category ids', async () => {
        const { categoryIds } = await seedFilteredGames(db);

        const filtered = await getAllGames(db, { categoryIds: [categoryIds[1], categoryIds[2]] });

        expect(filtered.map((game) => game.title)).toEqual(['Puzzle One', 'Strategy One', 'Strategy Two']);
    });

    it('filters by publisher id', async () => {
        const { publisherIds } = await seedFilteredGames(db);

        const filtered = await getAllGames(db, { publisherId: publisherIds[1] });

        expect(filtered.map((game) => game.title)).toEqual(['Strategy One']);
    });

    it('combines category and publisher filters', async () => {
        const { categoryIds, publisherIds } = await seedFilteredGames(db);

        const filtered = await getAllGames(db, {
            categoryIds: [categoryIds[0], categoryIds[1]],
            publisherId: publisherIds[0],
        });

        expect(filtered.map((game) => game.title)).toEqual(['Adventure One', 'Strategy Two']);
    });

    it('returns category options ordered by name', async () => {
        await seedFilteredGames(db);

        const options = await getAllCategories(db);

        expect(options.map((category) => category.name)).toEqual(['Adventure', 'Puzzle', 'Strategy']);
    });

    it('returns publisher options ordered by name', async () => {
        await seedFilteredGames(db);

        const options = await getAllPublishers(db);

        expect(options.map((publisher) => publisher.name)).toEqual(['Pub One', 'Pub Two']);
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });
});
