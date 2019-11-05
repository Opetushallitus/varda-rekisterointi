import React, {useContext, useEffect, useState} from 'react';
import useAxios from 'axios-hooks';
import FormFieldContainer from '../FormFieldContainer';
import {Koodi, Yhteystiedot, Organisaatio, Osoite} from '../types';
import Spinner from '../Spinner';
import { LanguageContext } from '../contexts';
import classNames from 'classnames/bind';
import ErrorPage from '../ErrorPage';
import OsoiteInput from "./OsoiteInput";
import {RekisterointiVirheet} from "./Rekisterointi";
import {hasLength} from "../StringUtils";

export type YhteystietoVirheet = RekisterointiVirheet<Yhteystiedot>

type Props = {
    readOnly?: boolean,
    alkuperaisetYhteystiedot: Yhteystiedot,
    yhteystiedot: Yhteystiedot,
    paivitaOrganisaatio: (paivitys: Partial<Organisaatio>, virheet: Partial<RekisterointiVirheet<Organisaatio>>) => void
    errors: RekisterointiVirheet<Organisaatio>
}

const baseClasses = { 'oph-input': true };
type YhteystietoKentta = keyof Yhteystiedot;

export default function OrganisaatioYhteystiedot({ readOnly, alkuperaisetYhteystiedot, yhteystiedot, paivitaOrganisaatio, errors }: Props) {
    const { i18n } = useContext(LanguageContext);
    const [ kayntiOsoiteSama, asetaKayntiOsoiteSama ] = useState(false);
    const [{data: postinumerot, loading: postinumerotLoading, error: postinumerotError}]
        = useAxios<Koodi[]>('/varda-rekisterointi/api/koodisto/POSTI/koodi?onlyValid=true');
    const virheet: YhteystietoVirheet = errors.yhteystiedot ? errors.yhteystiedot as YhteystietoVirheet : {};

    useEffect(() => {
        console.log(`Rendering OrganisaatioYhteystiedot with data: ${JSON.stringify(yhteystiedot)}`);
    }, [readOnly, yhteystiedot, errors]);

    if (postinumerotLoading) {
        return <Spinner />;
    }
    if (postinumerotError) {
        return <ErrorPage>{i18n.translate('ERROR_FETCH')}</ErrorPage>;
    }

    function paivitaYhteystiedot(paivitys: Partial<Yhteystiedot>, paivitysVirheet: YhteystietoVirheet = {}) {
        paivitaOrganisaatio({ yhteystiedot: {...yhteystiedot, ...paivitys} }, { yhteystiedot: {...virheet, ...paivitysVirheet }});
    }

    function eiTyhja(yhteystieto: undefined | string | Osoite): boolean {
        if (!yhteystieto || typeof yhteystieto === 'string') {
            return hasLength(yhteystieto);
        }
        const osoite = yhteystieto as Osoite;
        return hasLength(osoite.katuosoite)
            || hasLength(osoite.postitoimipaikka)
            || hasLength(osoite.postinumeroUri);
    }

    function disabled(kentta: YhteystietoKentta): boolean {
        if (kentta === 'kayntiosoite' && kayntiOsoiteSama) {
            return true;
        }
        return readOnly || eiTyhja(alkuperaisetYhteystiedot[kentta]);
    }

    function kopioiKayntiOsoite(kopioi: boolean) {
        console.log(`Kopioi käyntiosoite: ${kopioi}`);
        asetaKayntiOsoiteSama(kopioi);
        if (kopioi) {
            const postiosoiteVirheet = virheet.postiosoite && (typeof virheet.postiosoite !== 'string') ?
                {...virheet.postiosoite} : {};
            paivitaYhteystiedot(
                { kayntiosoite: { ...yhteystiedot.postiosoite }},
                { kayntiosoite: postiosoiteVirheet }
            );
        }
    }

    return (
        <>
            <FormFieldContainer label={i18n.translate('PUHELINNUMERO')} labelFor="puhelinnumero" errorText={virheet.puhelinnumero}>
                <input className={classNames({ ...baseClasses, 'oph-input-has-error': !!virheet.puhelinnumero })}
                       type="text"
                       id="puhelinnumero"
                       defaultValue={yhteystiedot.puhelinnumero}
                       disabled={disabled('puhelinnumero')}
                       onChange={event => paivitaYhteystiedot({ puhelinnumero: event.currentTarget.value })} />
            </FormFieldContainer>
            <FormFieldContainer label={i18n.translate('ORGANISAATION_SAHKOPOSTI')} labelFor="organisaation-sahkoposti" errorText={virheet.sahkoposti}>
                <input className={classNames({ ...baseClasses, 'oph-input-has-error': !!virheet.sahkoposti })}
                       type="text"
                       id="organisaation-sahkoposti"
                       defaultValue={yhteystiedot.sahkoposti}
                       disabled={disabled('sahkoposti')}
                       onChange={event => paivitaYhteystiedot({ sahkoposti: event.currentTarget.value })} />
            </FormFieldContainer>
            <OsoiteInput postinumerot={ postinumerot }
                         alkuperainenOsoite={{ ...alkuperaisetYhteystiedot.postiosoite }}
                         osoite={yhteystiedot.postiosoite}
                         asetaOsoiteCallback={(osoite, virheet) => paivitaYhteystiedot(
                             { postiosoite: osoite }, { postiosoite: virheet })} />
            <OsoiteInput postinumerot={ postinumerot }
                         alkuperainenOsoite={{ ...alkuperaisetYhteystiedot.kayntiosoite }}
                         osoite={yhteystiedot.kayntiosoite}
                         asetaOsoiteCallback={(osoite, virheet) => paivitaYhteystiedot(
                             { kayntiosoite: osoite }, { kayntiosoite: virheet })}
                         kaannosavaimet={{
                             katuosoite: 'KAYNTIOSOITE',
                             postinumeroUri: 'KAYNTIOSOITTEEN_POSTINUMERO',
                             postitoimipaikka: 'KAYNTIOSOITTEEN_POSTITOIMIPAIKKA'
                         }}
                         onKopio={kayntiOsoiteSama}
                         asetaKopiointiCallback={ kopioiKayntiOsoite } />
        </>
    );
}
