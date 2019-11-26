import React, {useContext, useState} from 'react';
import useAxios from "axios-hooks";
import {Koodi, Osoite, RekisterointiVirheet, Yhteystiedot} from "../types";
import {LanguageContext} from "../contexts";
import {hasLength} from "../StringUtils";
import FormFieldContainer from "../FormFieldContainer";
import classNames from "classnames/bind";
import OsoiteInput from "./OsoiteInput";
import Spinner from "../Spinner";
import ErrorPage from "../ErrorPage";

type Props = {
    vainLuku: boolean
    yhteystiedot: Yhteystiedot
    paivitaYhteystiedot: (yhteystiedot: Partial<Yhteystiedot>, virheet: Partial<RekisterointiVirheet<Yhteystiedot>>) => void
}

type YhteystiedotKentta = Extract<keyof Yhteystiedot, 'puhelinnumero' | 'sahkoposti'>;
type OsoiteKentta = Extract<keyof Yhteystiedot, 'postiosoite' | 'kayntiosoite'>;

const tyhjatVirheet: RekisterointiVirheet<Yhteystiedot> = {};
const baseClasses = { 'oph-input': true };
const kayntiosoiteAvaimet = {
    katuosoite: 'KAYNTIOSOITE',
    postinumeroUri: 'KAYNTIOSOITTEEN_POSTINUMERO',
    postitoimipaikka: 'KAYNTIOSOITTEEN_POSTITOIMIPAIKKA'
};

export default function YhteystiedotInput({ vainLuku, yhteystiedot, paivitaYhteystiedot }: Props) {
    const { i18n } = useContext(LanguageContext);
    const [{data: postinumerot, loading: postinumerotLoading, error: postinumerotError}]  = useAxios<Koodi[]>(
        '/varda-rekisterointi/api/koodisto/POSTI/koodi?onlyValid=true');
    const [ kopioiPostiosoite, asetaKopioiPostiosoite ] = useState(false);
    const [ virheet, asetaVirheet ] = useState(tyhjatVirheet);

    function validoiPakollinen(arvo: string): undefined | string {
        if (!hasLength(arvo)) return i18n.translate('PAKOLLINEN_TIETO');
        return undefined;
    }

    function asetaKentta(kentta: YhteystiedotKentta, arvo: string) {
        let uudetVirheet: RekisterointiVirheet<Yhteystiedot> = {};
        const virhe = validoiPakollinen(arvo);
        asetaVirheet((vanhatVirheet) => {
            uudetVirheet = { ...vanhatVirheet };
            if (virhe) {
                uudetVirheet[kentta] = virhe;
            } else if (uudetVirheet[kentta]) {
                delete uudetVirheet[kentta]
            }
            return uudetVirheet;
        });
        paivitaYhteystiedot({ [kentta]: arvo }, uudetVirheet);
    }

    function asetaOsoite(kentta: OsoiteKentta, osoite: Osoite, osoiteVirheet: RekisterointiVirheet<Osoite>) {
        let paivitys = { [kentta]: osoite };
        let virheet = { [kentta]: osoiteVirheet };
        if (kentta === 'postiosoite' && kopioiPostiosoite) {
            paivitys.kayntiosoite = {...osoite};
            virheet.kayntiosoite = {...osoiteVirheet};
        }
        paivitaYhteystiedot(paivitys, virheet);
    }

    function asetaKopioiPostiosoiteCallback(kopioi: boolean) {
        console.log(`Aseta kopio: ${kopioi}`);
        if (kopioi) {
            paivitaYhteystiedot(
                { kayntiosoite: {...yhteystiedot.postiosoite} },
                { kayntiosoite: { ...(virheet.postiosoite as RekisterointiVirheet<Osoite>) } } );
        }
        asetaKopioiPostiosoite(kopioi);
    }

    if (postinumerotLoading) {
        return <Spinner />;
    }
    if (postinumerotError) {
        return <ErrorPage>{i18n.translate('ERROR_FETCH')}</ErrorPage>;
    }

    return (
        <>
            <FormFieldContainer label={i18n.translate('PUHELINNUMERO')} labelFor="yhteystiedot-puhelinnumero" errorText={virheet.puhelinnumero}>
                <input className={classNames({ ...baseClasses, 'oph-input-has-error': !!virheet.puhelinnumero })}
                       type="text"
                       id="yhteystiedot-puhelinnumero"
                       key="yhteystiedot-puhelinnumero"
                       defaultValue={yhteystiedot.puhelinnumero}
                       disabled={vainLuku}
                       onBlur={event => asetaKentta('puhelinnumero', event.currentTarget.value)} />
            </FormFieldContainer>
            <FormFieldContainer label={i18n.translate('ORGANISAATION_SAHKOPOSTI')} labelFor="yhteystiedot-sahkoposti" errorText={virheet.sahkoposti}>
                <input className={classNames({ ...baseClasses, 'oph-input-has-error': !!virheet.sahkoposti })}
                       type="text"
                       id="yhteystiedot-sahkoposti"
                       key="yhteystiedot-sahkoposti"
                       defaultValue={yhteystiedot.sahkoposti}
                       disabled={vainLuku}
                       onBlur={event => asetaKentta('sahkoposti', event.currentTarget.value)} />
            </FormFieldContainer>
            <OsoiteInput postinumerot={postinumerot}
                         vainLuku={vainLuku}
                         osoite={yhteystiedot.postiosoite}
                         asetaOsoiteCallback={(osoite, osoiteVirheet) => asetaOsoite('postiosoite', osoite, osoiteVirheet)}
            />
            <OsoiteInput postinumerot={postinumerot}
                         vainLuku={vainLuku}
                         osoite={yhteystiedot.kayntiosoite}
                         asetaOsoiteCallback={(osoite, osoiteVirheet) => asetaOsoite('kayntiosoite', osoite, osoiteVirheet)}
                         kaannosavaimet={kayntiosoiteAvaimet}
                         onKopio={kopioiPostiosoite}
                         asetaKopiointiCallback={asetaKopioiPostiosoiteCallback}
            />
        </>
    );
}
