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

  console.log(result);

  if (!result) {
    throw new Error("Hatch command failed");
  }

  return result
}

describe("Pokemon", () => {
  // we don't need the in memory store since this commit
  // https://github.com/Rotorsoft/eventually-monorepo/commit/60785ca59793b1a1239d2ac5b85993fea880b89e
  // const store = new InMemorySnapshotStore();

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


  it("allows pokemon to be looked up", async () => {
    const pokemon = await client().load(Pokemon, "pokemon-1");
    expect(pokemon.state.name).toBe("Bulbasaur");
  });
})
