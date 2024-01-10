import { z } from "zod";

export enum PokemonType {
  FIRE = "Fire",
  WATER = "Water",
  GRASS = "Grass",
}

export const CatchAttempt = z.object({
  id: z.number(),
  success: z.boolean().optional(),
});

export const Pokemon = z.object({
  pokedexNumber: z.number(),
  name: z.string(),
  type: z.nativeEnum(PokemonType),
  catchAttempts: z.array(CatchAttempt),
});

export const ThrowPokeball = z.intersection(
  z.object({ pokedexNumber: z.number() }),
  CatchAttempt,
);

export const LookupPokemon = z.object({
  pokedexNumber: z.number(),
});
