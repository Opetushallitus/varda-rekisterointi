import React, {useContext, useState} from 'react';
import useAxios from "axios-hooks";
import {Koodi, Osoite, tyhjaOsoite, Virheet, Yhteystiedot} from "../types";
import {LanguageContext} from "../contexts";
import {hasLength} from "../StringUtils";
import FormFieldContainer from "../FormFieldContainer";
import classNames from "classnames/bind";
import OsoiteInput from "./OsoiteInput";
import Spinner from "../Spinner";
import ErrorPage from "../ErrorPage";

type Props = {
    alkuperaisetYhteystiedot: Yhteystiedot
    yhteystiedot: Yhteystiedot
    paivitaYhteystiedot: (yhteystiedot: Partial<Yhteystiedot>, virheet: Virheet<Yhteystiedot>) => void
}

type YhteystiedotKentta = Extract<keyof Yhteystiedot, 'puhelinnumero' | 'sahkoposti'>;

const tyhjatVirheet: Virheet<Yhteystiedot> = {};
const baseClasses = { 'oph-input': true };
const kayntiosoiteAvaimet = {
    katuosoite: 'KAYNTIOSOITE',
    postinumeroUri: 'KAYNTIOSOITTEEN_POSTINUMERO',
    postitoimipaikka: 'KAYNTIOSOITTEEN_POSTITOIMIPAIKKA'
};

export default function YhteystiedotInput({ alkuperaisetYhteystiedot, yhteystiedot, paivitaYhteystiedot }: Props) {
    const { i18n } = useContext(LanguageContext);
    const [{data: postinumerot, loading: postinumerotLoading, error: postinumerotError}]  = useAxios<Koodi[]>(
        '/varda-rekisterointi/api/koodisto/POSTI/koodi?onlyValid=true');
    const [ kopioiPostiosoite, asetaKopioiPostiosoite ] = useState(false);
    const [ virheet, asetaVirheet ] = useState(tyhjatVirheet);

    function vainLuku(kentta: YhteystiedotKentta): boolean {
        return hasLength(alkuperaisetYhteystiedot[kentta]);
    }

    function validoiPakollinen(arvo: string): undefined | string {
        if (!hasLength(arvo)) return i18n.translate('PAKOLLINEN_TIETO');
        return undefined;
    }

    function asetaKentta(kentta: YhteystiedotKentta, arvo: string) {
        const virhe = validoiPakollinen(arvo);
        if (virhe) {
            asetaVirheet((vanhatVirheet) => { return {...vanhatVirheet, [kentta]: virhe}});
        }
        paivitaYhteystiedot({ [kentta]: arvo }, virheet);
    }

    function asetaKopioiPostiosoiteCallback(kopioi: boolean) {
        if (kopioi) {
            paivitaYhteystiedot(
                { kayntiosoite: {...yhteystiedot.postiosoite} },
                { postiosoite: { ...(virheet.postiosoite as Virheet<Osoite>) } });
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
                       defaultValue={yhteystiedot.puhelinnumero}
                       disabled={vainLuku('puhelinnumero')}
                       onChange={event => asetaKentta('puhelinnumero', event.currentTarget.value)} />
            </FormFieldContainer>
            <FormFieldContainer label={i18n.translate('ORGANISAATION_SAHKOPOSTI')} labelFor="yhteystiedot-sahkoposti" errorText={virheet.sahkoposti}>
                <input className={classNames({ ...baseClasses, 'oph-input-has-error': !!virheet.sahkoposti })}
                       type="text"
                       id="yhteystiedot-sahkoposti"
                       defaultValue={yhteystiedot.sahkoposti}
                       disabled={vainLuku('sahkoposti')}
                       onChange={event => asetaKentta('sahkoposti', event.currentTarget.value)} />
            </FormFieldContainer>
            <OsoiteInput postinumerot={postinumerot}
                         alkuperainenOsoite={alkuperaisetYhteystiedot.postiosoite}
                         osoite={alkuperaisetYhteystiedot.postiosoite ? alkuperaisetYhteystiedot.postiosoite : tyhjaOsoite}
                         asetaOsoiteCallback={(osoite, osoiteVirheet) => paivitaYhteystiedot({postiosoite: osoite}, {postiosoite: osoiteVirheet})}
            />
            <OsoiteInput postinumerot={postinumerot}
                         alkuperainenOsoite={alkuperaisetYhteystiedot.kayntiosoite}
                         osoite={alkuperaisetYhteystiedot.kayntiosoite ? alkuperaisetYhteystiedot.kayntiosoite : tyhjaOsoite}
                         asetaOsoiteCallback={(osoite, osoiteVirheet) => paivitaYhteystiedot({kayntiosoite: osoite}, {kayntiosoite: osoiteVirheet})}
                         kaannosavaimet={kayntiosoiteAvaimet}
                         onKopio={kopioiPostiosoite}
                         asetaKopiointiCallback={asetaKopioiPostiosoiteCallback}
            />
        </>
    );
}
