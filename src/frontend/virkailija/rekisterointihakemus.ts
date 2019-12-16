import {Rekisterointi} from "../types";

export enum Tila {
    KASITTELYSSA = "KASITTELYSSA",
    HYVAKSYTTY = "HYVAKSYTTY",
    HYLATTY = "HYLATTY"
}

export type Paatos = {
    hyvaksytty: boolean;
    aikaleima: string;
    perustelu?: string; // vain, jos HYLATTY
}

export interface Rekisterointihakemus extends Rekisterointi {
    vastaanotettu: string;
    tila: Tila;
    paatos?: Paatos; // puuttuu, jos tila on KASITTELYSSA
}
