import React, {useContext, useState} from "react";
import Axios from "axios";
import {KuntaKoodistoContext, LanguageContext, MaatJaValtiotKoodistoContext} from '../contexts';
import Box from "@opetushallitus/virkailija-ui-components/Box";
import Button from "@opetushallitus/virkailija-ui-components/Button";
import Modal from "@opetushallitus/virkailija-ui-components/Modal"
import ModalBody from "@opetushallitus/virkailija-ui-components/ModalBody"
import ModalFooter from "@opetushallitus/virkailija-ui-components/ModalFooter"
import ModalHeader from "@opetushallitus/virkailija-ui-components/ModalHeader"
import {Rekisterointihakemus} from "./rekisterointihakemus";
import {hasLength} from "../StringUtils";
import {Organisaatio} from "../types";

const paatoksetBatchUrl = "/varda-rekisterointi/virkailija/api/paatokset/batch";

type PaatosBatch = {
    hyvaksytty: boolean
    hakemukset: number[],
    perustelu?: string
}

type Props = {
    valitut: Rekisterointihakemus[]
    hyvaksytty: boolean
    nayta: boolean
    valitutKasiteltyCallback: () => void
    suljeCallback: () => void
}

class PaatosRivi {

    constructor(readonly hakemus: Rekisterointihakemus, readonly kotipaikka: string) {}

    get organisaatio(): string {
        return this.hakemus.organisaatio.ytjNimi.nimi;
    }

    get sahkoposti(): string {
        return this.hakemus.sahkopostit[0];
    }

    get ytunnus(): string {
        return this.hakemus.organisaatio.ytunnus;
    }

}

export default function PaatosVahvistus({ valitut, hyvaksytty, nayta, valitutKasiteltyCallback, suljeCallback }: Props) {
    const { i18n } = useContext(LanguageContext);
    const { koodisto: kuntaKoodisto } = useContext(KuntaKoodistoContext);
    const { koodisto: maatJaValtiotKoodisto } = useContext(MaatJaValtiotKoodistoContext);
    const [ perustelu, asetaPerustelu ] = useState("");

    async function laheta() {
        const paatokset: PaatosBatch = {
            hyvaksytty,
            hakemukset: valitut.map(h => h.id)
        };
        if (hasLength(perustelu)) {
            paatokset.perustelu = perustelu;
        }
        try {
            await Axios.post(paatoksetBatchUrl, paatokset);
            valitutKasiteltyCallback();
            suljeCallback();
        } catch (e) {
            // TODO: virheenkäsittely
            console.log(e);
        }
    }

    function kotipaikka(organisaatio: Organisaatio): string {
        const osat: string[] = [];
        const kunta = kuntaKoodisto.uri2Nimi(organisaatio.kotipaikkaUri);
        const maa = maatJaValtiotKoodisto.uri2Nimi(organisaatio.maaUri);
        if (kunta) osat.push(kunta);
        if (maa) osat.push(maa);
        return osat.join(", ");
    }

    return (
        <Modal open={nayta} onClose={suljeCallback}>
            <ModalHeader onClose={suljeCallback}>{i18n.translate(hyvaksytty ? 'REKISTEROINNIT_HYVAKSYTTAVAT' : 'REKISTEROINNIT_HYLATTAVAT')}</ModalHeader>
            <ModalBody>
                <table>
                    <thead>
                        <tr key="otsikot">
                            <th>{i18n.translate('ORGANISAATION_NIMI')}</th>
                            <th>{i18n.translate('SAHKOPOSTI')}</th>
                            <th>{i18n.translate('YTUNNUS')}</th>
                            <th>{i18n.translate('ORGANISAATION_KOTIPAIKKA')}</th>
                        </tr>
                    </thead>
                    <tbody>
                    {
                        valitut.map(hakemus => new PaatosRivi(
                            hakemus,
                            `${kotipaikka(hakemus.organisaatio)}`
                        )).map(rivi =>
                        <tr key={rivi.hakemus.id}>
                            <td>{rivi.organisaatio}</td>
                            <td>{rivi.sahkoposti}</td>
                            <td>{rivi.ytunnus}</td>
                            <td>{rivi.kotipaikka}</td>
                        </tr>
                        )
                    }
                    </tbody>
                </table>
            { hyvaksytty ? null :
                <textarea value={perustelu}
                          onBlur={(event) => asetaPerustelu(event.currentTarget.value)} />
            }
            </ModalBody>
            <ModalFooter>
                <Box display="flex" justifyContent="flex-end">
                    <Button variant="text" onClick={suljeCallback}>{i18n.translate('REKISTEROINTI_PERUUTA')}</Button>
                    <Button onClick={laheta}>{i18n.translate('REKISTEROINTI_LAHETA')}</Button>
                </Box>
            </ModalFooter>
        </Modal>
    );
}
