import type { PetProfile, PetSize } from "./types";
import { sizeFromWeight } from "./match";

export function profileFromQuery(sp: URLSearchParams): PetProfile {
  const weight = parseFloat(sp.get("weight") ?? "5") || 5;
  const size = (sp.get("size") as PetSize) || sizeFromWeight(weight);
  return {
    name: "",
    species: (sp.get("species") as PetProfile["species"]) || "dog",
    breed: sp.get("breed") ?? "",
    weightKg: weight,
    size,
    isRestrictedBreed: sp.get("restricted") === "1",
    hasCarrier: sp.get("carrier") === "1",
    hasStroller: sp.get("stroller") === "1",
  };
}
