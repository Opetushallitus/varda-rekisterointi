import React, { useContext, useEffect, useState } from 'react';
import { LanguageContext, useModalContext } from '../../../contexts';
import Button from '@opetushallitus/virkailija-ui-components/Button';
import { Rekisterointihakemus } from '../../rekisterointihakemus';
import Box from '@opetushallitus/virkailija-ui-components/Box';
import styles from './ApprovalButtonsContainer.module.css';
import ApprovalModal from '../ApprovalModal/ApprovalModal';
import { ApprovalCallback } from '../../../types/types';

type Props = {
    chosenRekisteroinnit: Rekisterointihakemus[];
    approvalCallback: ApprovalCallback;
};

export default function ApprovalButtonsContainer({ chosenRekisteroinnit, approvalCallback }: Props) {
    const { i18n } = useContext(LanguageContext);
    const [buttonsInUse, setButtonsInUse] = useState(false);
    const { setModal } = useModalContext();

    function confirmApprovalSelection(hyvaksytty: boolean) {
        setModal(
            <ApprovalModal
                chosenRegistrations={chosenRekisteroinnit}
                approvalDecision={hyvaksytty}
                approvalCallback={approvalCallback}
            />
        );
    }

    useEffect(() => {
        setButtonsInUse(chosenRekisteroinnit && chosenRekisteroinnit.length > 0);
    }, [chosenRekisteroinnit]);

    return (
        <Box className={styles.approvalButtonsContainer}>
            <Button
                disabled={!buttonsInUse}
                onClick={() => confirmApprovalSelection(false)}
                variant="outlined"
                color="secondary"
            >
                <i className="material-icons md-18">&#xe14c;</i> {i18n.translate('REKISTEROINNIT_HYLKAA_VALITUT')}
            </Button>
            <Button disabled={!buttonsInUse} onClick={() => confirmApprovalSelection(true)}>
                <i className="material-icons md-18">&#xe5ca;</i> {i18n.translate('REKISTEROINNIT_HYVAKSY_VALITUT')}
            </Button>
        </Box>
    );
}
