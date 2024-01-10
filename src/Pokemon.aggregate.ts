import {
  Aggregate, bind,
} from "@rotorsoft/eventually";
import * as schemas from "./Pokemon.schemas";
import * as models from "./Pokemon.models";

type PokeAggregate = Aggregate<models.Pokemon, models.PokemonCommands, models.PokemonEvents>

export const Pokemon = (id: string): PokeAggregate => ({
  schemas: {
    state: schemas.Pokemon,
    commands: {
      HatchEgg: schemas.Pokemon,
      ThrowPokeball: schemas.ThrowPokeball,
    },
    events: {
      EggHatched: schemas.Pokemon,
      PokemonCaught: schemas.CatchAttempt,
    },
  },
  description: "A pokemon",
  stream: () => `pokemon-${id}`,
  init: () => ({
    pokedexNumber: parseInt(id),
    name: "Missingno",
    type: schemas.PokemonType.FIRE,
    catchAttempts: [],
  }),
  reduce: {
    PokemonCaught: (state, event) => ({
      ...state,
      catchAttempts: [...(state.catchAttempts || []), event],
    }),
    EggHatched: (_, event) => event.data,
  },
  on: {
    HatchEgg: (data, _) => Promise.resolve([bind("EggHatched", data)]),
    ThrowPokeball: (data, state) => {
      const isCaught = state.catchAttempts?.some((a) => a.success);
      if (isCaught) {
        throw Error("Pokemon is already caught");
      }
      return Promise.resolve(
        [bind(
          "PokemonCaught",
          {
            ...data,
            success: Math.random() > 0.5,
          }
        )]
      );
    },
  },
});
