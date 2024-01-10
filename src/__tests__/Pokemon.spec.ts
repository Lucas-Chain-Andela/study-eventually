import {
  app,
  client,
  dispose,
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
): Promise<PokemonSnapshot> => {
  const result = await client().command(
    Pokemon,
    "HatchEgg",
    pokemon,
    {
      stream: pokemon.pokedexNumber.toString()
    }
  );

  if (!result) {
    throw new Error("Hatch command failed");
  }

  return result
}

const throwPokeball = async (
  pokedexNumber: number,
  attempt: models.CatchAttempt
): Promise<PokemonSnapshot> => {
  const result = await client().command(
    Pokemon,
    "ThrowPokeball",
    {
      ...attempt,
      pokedexNumber: pokedexNumber,
    },
    {
      stream: pokedexNumber.toString()
    }
  );

  if (!result) {
    throw new Error("Unexpected error throwing pokeball");
  }

  return result;
}

describe("Pokemon", () => {
  // we don't need the in memory store since this commit
  // https://github.com/Rotorsoft/eventually-monorepo/commit/60785ca59793b1a1239d2ac5b85993fea880b89e
  // const store = new InMemorySnapshotStore();
  const originalRandom = Math.random;

  beforeAll(async () => {
    app().with(Pokemon).build();
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


  it("allows pokemon to be looked up", async () => {
    const pokemon = await client().load(Pokemon, "pokemon-1");
    expect(pokemon.state.name).toBe("Bulbasaur");
  });

  describe("when a pokeball is thrown", () => {
    it("registers catch attempts when pokeball is thrown", async () => {
      const pokemon = await client().load(Pokemon, "pokemon-1");

      const result = await throwPokeball(pokemon.state.pokedexNumber, { id: 1, success: true });

      expect(result.state.catchAttempts.length).toBe(1);
    });

    describe("and the pokemon is caught", () => {
      it("registers the pokemon as caught", async () => {
        Math.random = jest.fn().mockReturnValue(0.9);
        const pokemon = await client().load(Pokemon, "pokemon-1");

        const result = await throwPokeball(pokemon.state.pokedexNumber, { id: 1, success: true });


        expect(result.state.catchAttempts.length).toBe(1);

        const attempt = result.state.catchAttempts[0] as any;
        expect(attempt.data.success).toBe(true);
      });
    });

    describe("and the pokemon is not caught", () => {
      it("registers the pokemon as not caught", async () => {
        Math.random = jest.fn().mockReturnValue(0.1);
        const pokemon = await client().load(Pokemon, "pokemon-1");

        const result = await throwPokeball(pokemon.state.pokedexNumber, { id: 1, success: true });

        expect(result.state.catchAttempts.length).toBe(1);
        const attempt = result.state.catchAttempts[0] as any;
        expect(attempt.data.success).toBe(false);
      });
    });
  });
})
