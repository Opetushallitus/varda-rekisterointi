import React, {useContext, useEffect, useState} from 'react';
import useAxios from 'axios-hooks';
import FormFieldContainer from '../FormFieldContainer';
import {Koodi, Yhteystiedot, Organisaatio, RekisterointiVirheet} from '../types';
import Spinner from '../Spinner';
import { LanguageContext } from '../contexts';
import classNames from 'classnames/bind';
import ErrorPage from '../ErrorPage';
import OsoiteInput from "./OsoiteInput";
import {hasLength} from "../StringUtils";

export type YhteystietoVirheet = RekisterointiVirheet<Yhteystiedot>
const tyhjatVirheet: YhteystietoVirheet = {};

type Props = {
    readOnly?: boolean,
    yhteystiedot: Yhteystiedot,
    paivitaOrganisaatio: (paivitys: Partial<Organisaatio>, virheet: Partial<RekisterointiVirheet<Organisaatio>>) => void
    errors?: RekisterointiVirheet<Organisaatio>
}

const baseClasses = { 'oph-input': true };
type YhteystietoKentta = keyof Yhteystiedot;

export default function OrganisaatioYhteystiedot({ readOnly = false, yhteystiedot,
                                                   paivitaOrganisaatio, errors = {} }: Props) {
    const { i18n } = useContext(LanguageContext);
    const [ kayntiOsoiteSama, asetaKayntiOsoiteSama ] = useState(false);
    const [{data: postinumerot, loading: postinumerotLoading, error: postinumerotError}]
        = useAxios<Koodi[]>('/varda-rekisterointi/api/koodisto/POSTI/koodi?onlyValid=true');
    const [ virheet, asetaVirheet ] = useState(tyhjatVirheet);

    useEffect(() => {
        asetaVirheet(errors.yhteystiedot || tyhjatVirheet as YhteystietoVirheet);
    }, [yhteystiedot, errors]);

    if (postinumerotLoading) {
        return <Spinner />;
    }
    if (postinumerotError) {
        return <ErrorPage>{i18n.translate('ERROR_FETCH')}</ErrorPage>;
    }

    function validoiKentta(kentta: YhteystietoKentta, arvo: string): YhteystietoVirheet {
        let virheet: YhteystietoVirheet = {};
        if (kentta === 'puhelinnumero' || kentta === 'sahkoposti') { // OsoiteInput validoi itsensä
            if (!hasLength(arvo)) {
                virheet[kentta] = i18n.translate('PAKOLLINEN_TIETO');
            }
        }
        return virheet;
    }

    function paivitaYhteystiedot(paivitys: Partial<Yhteystiedot>, paivitysVirheet: YhteystietoVirheet = {}) {
        asetaVirheet((vanhatVirheet) => { return { ...vanhatVirheet, ...paivitysVirheet } });
        paivitaOrganisaatio(
            { yhteystiedot: {...yhteystiedot, ...paivitys} },
            { yhteystiedot: { ...errors.yhteystiedot, ...virheet }});
    }

    function disabled(kentta: YhteystietoKentta): boolean {
        if (kentta === 'kayntiosoite' && kayntiOsoiteSama) {
            return true;
        }
        return readOnly;
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
                       onBlur={event => paivitaYhteystiedot(
                           { puhelinnumero: event.currentTarget.value },
                           validoiKentta('puhelinnumero', event.currentTarget.value))} />
            </FormFieldContainer>
            <FormFieldContainer label={i18n.translate('ORGANISAATION_SAHKOPOSTI')} labelFor="organisaation-sahkoposti" errorText={virheet.sahkoposti}>
                <input className={classNames({ ...baseClasses, 'oph-input-has-error': !!virheet.sahkoposti })}
                       type="text"
                       id="organisaation-sahkoposti"
                       defaultValue={yhteystiedot.sahkoposti}
                       disabled={disabled('sahkoposti')}
                       onBlur={event => paivitaYhteystiedot(
                           { sahkoposti: event.currentTarget.value },
                           validoiKentta('sahkoposti', event.currentTarget.value))} />
            </FormFieldContainer>
            <OsoiteInput postinumerot={ postinumerot }
                         vainLuku={readOnly}
                         osoite={yhteystiedot.postiosoite}
                         asetaOsoiteCallback={(osoite, virheet) => paivitaYhteystiedot(
                             { postiosoite: osoite }, { postiosoite: virheet })} />
            <OsoiteInput postinumerot={ postinumerot }
                         vainLuku={readOnly}
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
