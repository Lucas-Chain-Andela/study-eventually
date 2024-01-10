import {
  app,
  client,
  dispose,
  InMemorySnapshotStore,
  Snapshot,
} from "@rotorsoft/eventually";
import {
  Pokemon
} from "../Pokemon.aggregate";
import * as schemas from "../Pokemon.schemas";
import * as models from "../Pokemon.models";

export type PokemonSnapshot = Snapshot<models.Pokemon, models.PokemonEvents>;

const hatchEgg = async (
  pokemon: models.Pokemon,
): Promise<PokemonSnapshot[]> => {
  return client().command(
    Pokemon,
    "HatchEgg",
    pokemon,
    {
      id: pokemon.pokedexNumber.toString()
    }
  );
}

const throwPokeball = async (
  pokedexNumber: number,
  attempt: models.CatchAttempt
): Promise<PokemonSnapshot[]> => {
  return client().command(
    Pokemon,
    "ThrowPokeball",
    {
      ...attempt,
      pokedexNumber: pokedexNumber,
    },
    {
      id: pokedexNumber.toString()
    }
  );
}

describe("Pokemon", () => {
  const store = InMemorySnapshotStore();
  const originalRandom = Math.random;

  beforeAll(async () => {
    app().with(Pokemon).withSnapshot(Pokemon, {
      threshold: -1,
      store,
    }).build();
    await app().listen();

    await hatchEgg({
      pokedexNumber: 1, name: "Bulbasaur", type: schemas.PokemonType.GRASS, catchAttempts: []
    });
    await hatchEgg({
      pokedexNumber: 4, name: "Charmander", type: schemas.PokemonType.FIRE, catchAttempts: []
    });
    await hatchEgg({
      pokedexNumber: 7, name: "Squirtle", type: schemas.PokemonType.WATER, catchAttempts: []
    });
  });

  afterAll(async () => {
    await dispose()();
  });

  afterEach(() => {
    Math.random = originalRandom;
    jest.clearAllMocks();
  });

  it("allows looking up on multiple streams", async () => {
    const result = await store.query({});

    expect(result.length).toBe(3);
  });

  describe("when a pokeball is thrown", () => {
    it("registers catch attempts when pokeball is thrown", async () => {
      const pokemon = await store.read<PokemonSnapshot, models.PokemonEvents>("pokemon-1") as any as PokemonSnapshot;

      const result = await throwPokeball(pokemon.state.pokedexNumber, { id: 1, success: true });

      expect(result[0].state.catchAttempts.length).toBe(1);
    });

    describe("and the pokemon is caught", () => {
      it("registers the pokemon as caught", async () => {
        Math.random = jest.fn().mockReturnValue(0.9);
        const pokemon = await store.read<PokemonSnapshot, models.PokemonEvents>("pokemon-4") as any as PokemonSnapshot;

        const result = await throwPokeball(pokemon.state.pokedexNumber, { id: 1, success: true });

        const state = result[0].state;
        expect(state.catchAttempts.length).toBe(1);

        const attempt = state.catchAttempts[0] as any as { data: models.CatchAttempt };
        expect(attempt.data.success).toBe(true);
      });
    });

    describe("and the pokemon is not caught", () => {
      it("registers the pokemon as not caught", async () => {
        Math.random = jest.fn().mockReturnValue(0.1);
        const pokemon = await store.read<PokemonSnapshot, models.PokemonEvents>("pokemon-7") as any as PokemonSnapshot;

        const result = await throwPokeball(pokemon.state.pokedexNumber, { id: 1, success: true });

        const state = result[0].state;
        expect(state.catchAttempts.length).toBe(1);
        const attempt = state.catchAttempts[0] as any as { data: models.CatchAttempt };
        expect(attempt.data.success).toBe(false);
      });
    });
  });
})
