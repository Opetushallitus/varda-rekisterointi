import React, {useContext} from 'react';
import {useUIDSeed} from "react-uid";
import classNames from "classnames/bind";
import FormFieldContainer from "../FormFieldContainer";
import { LanguageContext } from '../contexts';
import {Koodi, Osoite, tyhjaOsoite, RekisterointiVirheet} from "../types";
import {koodiByArvoToLocalizedText} from "../LocalizableTextUtils";
import {hasLength} from "../StringUtils";

type Props = {
    postinumerot: Koodi[]
    vainLuku?: boolean
    osoite?: Osoite
    virheet?: RekisterointiVirheet<Osoite>
    asetaOsoiteCallback: (osoite: Osoite, virheet: RekisterointiVirheet<Osoite>) => void
    kaannosavaimet?: Record<keyof Osoite, string>
    onKopio?: boolean
    asetaKopiointiCallback?: (kopioi: boolean) => void
}

const oletusKaannosavaimet = {
    katuosoite: 'POSTIOSOITE',
    postinumeroUri: 'POSTINUMERO',
    postitoimipaikka: 'POSTITOIMIPAIKKA'
};

const tyhjatVirheet: RekisterointiVirheet<Osoite> = {};
const baseClasses = { 'oph-input': true };

export default function OsoiteInput({ postinumerot, vainLuku = false, osoite = tyhjaOsoite,
                                      virheet = tyhjatVirheet, asetaOsoiteCallback,
                                      kaannosavaimet = oletusKaannosavaimet, onKopio = false,
                                      asetaKopiointiCallback }: Props) {
    const seed = useUIDSeed();
    const { language, i18n } = useContext(LanguageContext);

    function validoiOsoite(paivitys: Partial<Osoite>): RekisterointiVirheet<Osoite> {
        const uudetVirheet: RekisterointiVirheet<Osoite> = {};
        for (let kentta in paivitys) {
            const avain = kentta as keyof Osoite;
            const arvo = paivitys[avain];
            if (kentta !== 'postinumeroUri') {
                if (!hasLength(arvo)) {
                    uudetVirheet[avain] = i18n.translate('PAKOLLINEN_TIETO');
                }
            } else if (!paivitys.postitoimipaikka || paivitys.postitoimipaikka.length === 0) {
                    uudetVirheet.postinumeroUri = i18n.translate('VIRHEELLINEN_POSTINUMERO');
            }
            if (!uudetVirheet[avain]) uudetVirheet[avain] = undefined;
        }
        return uudetVirheet;
    }

    function paivitaOsoite(paivitys: Partial<Osoite>) {
        let muutoksia = false;
        for (let property in paivitys) {
            const kentta = property as keyof Osoite;
            const arvo = paivitys[kentta];
            if (arvo && arvo !== osoite[kentta]) {
                muutoksia = true;
                break;
            }
        }
        if (muutoksia) {
            const uudetVirheet = validoiOsoite(paivitys);
            const paivitetytVirheet = { ...virheet, ...uudetVirheet };
            asetaOsoiteCallback({ ...osoite, ...paivitys }, paivitetytVirheet );
        }
    }

    function poistaUriEtuliite(postinumeroUri: string | undefined) {
        return (postinumeroUri ? postinumeroUri : '').replace('posti_', '');
    }

    function lisaaUriEtuliite(postinumero: string | undefined) {
        return postinumero ? `posti_${postinumero}` : '';
    }

    return (
        <>
        <FormFieldContainer label={i18n.translate(kaannosavaimet.katuosoite)} labelFor={seed('katuosoite')} errorText={virheet.katuosoite}>
            <div className="oph-input-container">
            <input className={classNames({ ...baseClasses, 'oph-input-has-error': !!virheet.katuosoite })}
                   type="text"
                   id={seed('katuosoite')}
                   defaultValue={osoite.katuosoite}
                   disabled={onKopio || vainLuku}
                   onBlur={event => paivitaOsoite({ katuosoite: event.target.value })}
            />
            { asetaKopiointiCallback && !vainLuku ?
            <label>
                <input type="checkbox"
                       className="oph-checkable-input"
                       defaultChecked={onKopio}
                       onClick={() => asetaKopiointiCallback(!onKopio)}
                />
                <span className="oph-checkable-text">{ i18n.translate('SAMA_KUIN_POSTIOSOITE') }</span>
            </label> : null
            }
            </div>
        </FormFieldContainer>
        <FormFieldContainer label={i18n.translate(kaannosavaimet.postinumeroUri)} labelFor={seed('postinumeroUri')} errorText={virheet.postinumeroUri}>
            <input className={classNames({ ...baseClasses, 'oph-input-has-error': !!virheet.postinumeroUri })}
                   type="text"
                   id={seed('postinumeroUri')}
                   defaultValue={poistaUriEtuliite(osoite.postinumeroUri)}
                   disabled={onKopio || vainLuku}
                   onBlur={event => {
                       const postinumeroUri = lisaaUriEtuliite(event.currentTarget.value);
                       paivitaOsoite({
                           postinumeroUri,
                           postitoimipaikka: event.currentTarget.value.length === 5 ? koodiByArvoToLocalizedText(postinumerot, language, event.currentTarget.value) : ''
                       })
                   }}
            />
        </FormFieldContainer>
        <FormFieldContainer label={i18n.translate(kaannosavaimet.postitoimipaikka)}>
            <div id={seed('postitoimipaikka')} className="oph-input-container">{osoite.postitoimipaikka}</div>
        </FormFieldContainer>
        </>
    );
}
