import React, { useMemo, useContext, HTMLProps } from 'react';
import { format, parseISO } from 'date-fns';
import { ColumnDef, Row, Table as TableType } from '@tanstack/react-table';
import Button from '@opetushallitus/virkailija-ui-components/Button';
import Checkbox from '@opetushallitus/virkailija-ui-components/Checkbox';

import { Table } from '../Table/Table';
import { LanguageContext, useKoodistoContext, useModalContext } from '../../../contexts';
import { Rekisterointihakemus } from '../../rekisterointihakemus';
import ApprovalModal from '../ApprovalModal/ApprovalModal';
import { ApprovalCallback, Rekisterointityyppi } from '../../../types/types';

import styles from './RekisteroinnitTable.module.css';

type RekisteroinnitTableProps = {
    rekisteroinnit: Rekisterointihakemus[];
    rekisterointityyppi: Rekisterointityyppi;
    approvalCallback: ApprovalCallback;
};

const saapumisAikaFormat = 'd.M.y HH:mm';

function IndeterminateCheckbox({ indeterminate, ...rest }: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
    const ref = React.useRef<HTMLInputElement | null>(null);

    React.useEffect(() => {
        if (typeof indeterminate === 'boolean' && ref.current) {
            ref.current.indeterminate = !rest.checked && indeterminate;
        }
    }, [ref, indeterminate, rest.checked]);

    return (
        <Checkbox
            // @ts-expect-error ref
            ref={ref}
            className="checkbox"
            {...rest}
            indeterminate={indeterminate}
        />
    );
}

export default function RekisteroinnitTable({
    rekisteroinnit,
    rekisterointityyppi,
    approvalCallback,
}: RekisteroinnitTableProps) {
    const { i18n } = useContext(LanguageContext);
    const { kunnat } = useKoodistoContext();
    const { setModal } = useModalContext();
    const data = useMemo<Rekisterointihakemus[]>(() => {
        rekisteroinnit.sort((a, b) => a.organisaatio.ytjNimi.nimi.localeCompare(b.organisaatio.ytjNimi.nimi));
        return [...rekisteroinnit];
    }, [rekisteroinnit]);

    const columns = useMemo<ColumnDef<Rekisterointihakemus>[]>(() => {
        const openApprovalModal = (row: Row<Rekisterointihakemus>, hyvaksytty: boolean) => {
            setModal(
                <ApprovalModal
                    chosenRegistrations={[row.original]}
                    approvalDecision={hyvaksytty}
                    approvalCallback={approvalCallback}
                />
            );
        };

        return [
            {
                id: 'select',
                header: ({ table }: { table: TableType<Rekisterointihakemus> }) => (
                    <IndeterminateCheckbox
                        {...{
                            checked: table.getIsAllRowsSelected(),
                            indeterminate: table.getIsSomeRowsSelected(),
                            onChange: table.getToggleAllRowsSelectedHandler(),
                        }}
                    />
                ),
                cell: ({ row }: { row: Row<Rekisterointihakemus> }) => (
                    <IndeterminateCheckbox
                        {...{
                            disabled: row.original.tila !== 'KASITTELYSSA' && true,
                            checked: row.original.tila !== 'KASITTELYSSA' ? false : row.getIsSelected(),
                            indeterminate: row.getIsSomeSelected(),
                            onChange: row.getToggleSelectedHandler(),
                        }}
                    />
                ),
                size: 20,
            },
            {
                header: i18n.translate('TAULUKKO_ORGANISAATIO_NIMI_OTSIKKO'),
                id: 'organisaationimi',
                accessorFn: (values: Rekisterointihakemus) =>
                    values.organisaatio?.ytjNimi?.nimi || i18n.translate('TAULUKKO_NIMI_PUUTTUU_ORGANISAATIOLTA'),
                size: 250,
            },
            {
                header: i18n.translate('TAULUKKO_ORGANISAATIO_PUHELINNUMERO_OTSIKKO'),
                accessorFn: (values: Rekisterointihakemus) =>
                    values.organisaatio?.yhteystiedot?.puhelinnumero ||
                    i18n.translate('TAULUKKO_PUHELINNUMERO_PUUTTUU_ORGANISAATIOLTA'),
            },
            {
                header: i18n.translate('TAULUKKO_ORGANISAATIO_YTUNNUS_OTSIKKO'),
                id: 'ytunnus',
                accessorFn: (values: Rekisterointihakemus) =>
                    values.organisaatio?.ytunnus || i18n.translate('TAULUKKO_YTUNNUS_PUUTTUU_ORGANISAATIOLTA'),
            },
            rekisterointityyppi === 'varda'
                ? {
                      header: i18n.translate('TAULUKKO_KUNNAT_OTSIKKO'),
                      id: 'kunnat',
                      accessorFn: (values: Rekisterointihakemus) =>
                          values.kunnat.map((k) => kunnat.uri2Nimi(k)).join(', '),
                  }
                : (undefined as unknown as ColumnDef<Rekisterointihakemus>),
            {
                header: i18n.translate('TAULUKKO_VASTAANOTETTU_OTSIKKO'),
                id: 'vastaanotettu',
                accessorFn: (values: Rekisterointihakemus) =>
                    format(parseISO(values.vastaanotettu), saapumisAikaFormat),
            },
            {
                id: 'hyvaksynta',
                cell: ({ row }: { row: Row<Rekisterointihakemus> }) => (
                    <div className={styles.hyvaksyntaButtonsContainer}>
                        <Button variant={'outlined'} onClick={() => openApprovalModal(row, false)}>
                            {i18n.translate('TAULUKKO_HYLKAA_HAKEMUS')}
                        </Button>
                        <Button onClick={() => openApprovalModal(row, true)}>
                            {i18n.translate('TAULUKKO_HYVAKSY_HAKEMUS')}
                        </Button>
                    </div>
                ),
            },
            {
                header: i18n.translate('TAULUKKO_HYLATTY_OTSIKKO'),
                id: 'hylatty',
                accessorFn: (values: Rekisterointihakemus) =>
                    values.paatos?.paatetty && format(parseISO(values.paatos?.paatetty), saapumisAikaFormat),
            },
            {
                header: i18n.translate('TAULUKKO_HYVAKSYTTY_OTSIKKO'),
                id: 'hyvaksytty',
                accessorFn: (values: Rekisterointihakemus) =>
                    values.paatos?.paatetty && format(parseISO(values.paatos?.paatetty), saapumisAikaFormat),
            },
            {
                enableColumnFilter: true,
                accessorKey: 'tila',
            },
        ].filter((c) => !!c);
    }, [i18n, kunnat, rekisterointityyppi, setModal, approvalCallback]);

    return (
        <Table
            columns={columns}
            data={data}
            rekisterointityyppi={rekisterointityyppi}
            approvalCallback={approvalCallback}
        />
    );
}
