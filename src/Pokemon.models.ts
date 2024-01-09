import { z } from "zod";

import * as schemas from "./Pokemon.schemas";

export type Pokemon = z.infer<typeof schemas.Pokemon>;
export type CatchAttempt = z.infer<typeof schemas.CatchAttempt>;
export type ThrowPokeball = z.infer<typeof schemas.ThrowPokeball>;
export type LookupPokemon = z.infer<typeof schemas.LookupPokemon>;

export type PokemonCommands = {
  HatchEgg: Pokemon;
  ThrowPokeball: ThrowPokeball;
};

export type PokemonEvents = {
  PokemonCaught: CatchAttempt;
  EggHatched: Pokemon;
};
