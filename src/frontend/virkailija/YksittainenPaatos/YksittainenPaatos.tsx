import React, {useContext} from "react";
import Axios from "axios";
import { LanguageContext } from '../../contexts';
import Box from "@opetushallitus/virkailija-ui-components/Box";
import Button from "@opetushallitus/virkailija-ui-components/Button";
import Modal from "@opetushallitus/virkailija-ui-components/Modal"
import ModalBody from "@opetushallitus/virkailija-ui-components/ModalBody"
import ModalFooter from "@opetushallitus/virkailija-ui-components/ModalFooter"

import {Rekisterointi} from "../../types";
import Fieldset from "../../Fieldset";
import OrganisaationTiedot from "./OrganisaationTiedot";
import PaakayttajanTiedot from './PaakayttajanTiedot';
import OrgYhteystiedot from './OrgYhteystiedot'

const PAATOKSET_URL = "/varda-rekisterointi/virkailija/api/paatokset";

type Props = {
    valittu: Rekisterointi
    yksiKasiteltyCallback: (rekisterointiId: number) => void
    suljeCallback: () => void
}

export default function YksittainenPaatos({ valittu, yksiKasiteltyCallback, suljeCallback }: Props) {
    const { i18n } = useContext(LanguageContext);

    const laheta = async (hyvaksytty: boolean) => {
        const paatos = {
            rekisterointi: valittu.id,
            hyvaksytty,
            perustelu: '', // TODO add perustelu if needed
        }
        try {
            await Axios.post(PAATOKSET_URL, paatos);
            yksiKasiteltyCallback(valittu.id);
        } catch (e) {
            throw e; // TODO Error handling
        }
    }
    return (
        <Modal maxWidth={"80%"} open onClose={suljeCallback}>
            <ModalBody>
                <div className="varda-rekisterointi-hakija">
                    <Fieldset title={i18n.translate('ORGANISAATION_TIEDOT')}>
                        <OrganisaationTiedot organisaatio={valittu.organisaatio}/>
                    </Fieldset>
                    <Fieldset title={i18n.translate('PÄÄKÄYTTÄJÄN_YHTEYSTIEDOT')}>
                        <PaakayttajanTiedot kayttaja={valittu.kayttaja}/>
                    </Fieldset>
                    <Fieldset title={i18n.translate('ORGANISAATION_YHTEYSTIEDOT')}>
                        <OrgYhteystiedot yhteystiedot={valittu.organisaatio.yhteystiedot}/>
                    </Fieldset>
                </div>
            </ModalBody>
            <ModalFooter>
                <Box display="flex" justifyContent="flex-end">
                    <Button
                        style={{ marginRight: '.5rem' }}
                        color={"danger"}
                        onClick={() => laheta(false)}
                    >
                        {i18n.translate('HYLKAA')}
                    </Button>
                    <Button color={'success'} onClick={() => laheta(true)}>{i18n.translate('HYVAKSY')}</Button>
                </Box>
            </ModalFooter>
        </Modal>
    );
}