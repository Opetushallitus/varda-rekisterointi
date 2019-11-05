import {hasLength} from "./StringUtils";

export type Language = 'fi' | 'sv' | 'en';
export type LocalDate = string;
export type LocalizableText = Partial<Record<Language, string>>;

// koodisto
export type KoodiUri = string;
export type KoodiArvo = string;
export type Koodi = {
    uri: KoodiUri,
    arvo: KoodiArvo,
    nimi: LocalizableText,
};

// lokalisointi
export type Lokalisointi = Record<Language, Record<string, string>>;

export type Osoite = {
    katuosoite?: string,
    postinumeroUri?: string,
    postitoimipaikka?: string
}

export const tyhjaOsoite: Osoite = {
    katuosoite: '',
    postinumeroUri: '',
    postitoimipaikka: ''
};

export type Yhteystiedot = {
    puhelinnumero?: string
    sahkoposti?: string
    postiosoite?: Osoite
    kayntiosoite?: Osoite
}

export const tyhjatYhteystiedot: Yhteystiedot = {
    puhelinnumero: '',
    sahkoposti: '',
    postiosoite: tyhjaOsoite,
    kayntiosoite: tyhjaOsoite
};

export type KielistettyNimi = {
    nimi: string,
    kieli: Language, // ytj-kieli
    alkuPvm: LocalDate | null
}

export type Organisaatio = {
    oid?: string,
    ytunnus: string,
    ytjNimi: KielistettyNimi, // YTJ-kielen mukainen nimi
    alkuPvm: LocalDate | null,
    yritysmuoto: string,
    tyypit: KoodiUri[],
    kotipaikkaUri: KoodiUri,
    maaUri: KoodiUri,
    kieletUris: KoodiUri[],
    yhteystiedot: Yhteystiedot
}

export const tyhjaOrganisaatio: Organisaatio = {
    ytunnus: '',
    ytjNimi: {
        nimi: '',
        alkuPvm: null,
        kieli: 'fi'
    },
    alkuPvm: null,
    yritysmuoto: '',
    tyypit: ['organisaatiotyyppi_07'],
    kotipaikkaUri: '',
    maaUri: 'maatjavaltiot1_fin',
    kieletUris: [],
    yhteystiedot: tyhjatYhteystiedot
};

// kayttooikeus
export type Kayttaja = {
    etunimi: string,
    sukunimi: string,
    sahkoposti: string,
    asiointikieli: string,
    saateteksti: string,
}

// varda-rekisterointi
export type Rekisterointi = {
    organisaatio: Organisaatio,
    sahkopostit: string[],
    kayttaja: Kayttaja
}

export type Virheet<T> = {
    [K in keyof T]?: string | Virheet<T[K]>
}

export function onTyhja<T>(virheet: Virheet<T>):boolean {
    for (let k in virheet) {
        const kentta = virheet[k];
        if (typeof kentta === 'string') {
            if (hasLength(kentta)) return false;
        } else {
            if (!onTyhja(kentta as Virheet<T>)) {
                return false;
            }
        }
    }
    return true;
}
