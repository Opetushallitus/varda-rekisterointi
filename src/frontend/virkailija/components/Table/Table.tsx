import React, { useContext, useState } from 'react';
import SearchIcon from '@material-ui/icons/Search';
import { parseISO, format } from 'date-fns';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    Row,
    useReactTable,
} from '@tanstack/react-table';
import Input from '@opetushallitus/virkailija-ui-components/Input';
import Button from '@opetushallitus/virkailija-ui-components/Button';

import { KuntaKoodistoContext, LanguageContext } from '../../../contexts';
import ApprovalButtonsContainer from '../ApprovalButtonsContainer/ApprovalButtonsContainer';
import { Rekisterointihakemus, Tila, TILAT } from '../../rekisterointihakemus';
import { ButtonGroup } from '../../ButtonGroup';
import { Pagination } from './Pagination';

import styles from './Table.module.css';

type TableProps = {
    columns: ColumnDef<Rekisterointihakemus>[];
    data: Rekisterointihakemus[];
};

const filterOnlyKasittelyssa = (rows: Row<Rekisterointihakemus>[]) => {
    return rows.filter((rh: Row<Rekisterointihakemus>) => rh.original.tila === 'KASITTELYSSA').map((r) => r.original);
};

export const Table = ({ columns, data }: TableProps) => {
    const { i18n } = useContext(LanguageContext);
    const { koodisto: kunnat } = useContext(KuntaKoodistoContext);
    const [rowSelection, setRowSelection] = useState({});
    const [globalFilter, setGlobalFilter] = useState('');
    const [tilaFilter, setTilaFilter] = useState<Tila>('KASITTELYSSA');
    const kasittelyssa = data.filter((r) => r.tila === 'KASITTELYSSA');
    const pageSize = 20;
    const [pageIndex, setPageIndex] = useState(0);

    const renderOrganizationDetails = React.useCallback(
        (row: Row<Rekisterointihakemus>) => (
            <div className={styles.infoContainer}>
                <h4 className={styles.infoHeader}>{i18n.translate('ORGANISAATION_TIEDOT')}</h4>
                <h5 className={styles.infoLabel}>{i18n.translate('YRITYSMUOTO')}</h5>
                <span>{row.original.organisaatio.yritysmuoto}</span>
                {row.original.toimintamuoto && (
                    <>
                        <h5 className={styles.infoLabel}>{i18n.translate('TOIMINTAMUOTO')}</h5>
                        <span>{row.original.toimintamuoto}</span>
                    </>
                )}
                <h5 className={styles.infoLabel}>{i18n.translate('KOTIPAIKKA')}</h5>
                <span>{kunnat.uri2Nimi(row.original.organisaatio.kotipaikkaUri)}</span>
                {row.original.organisaatio.alkuPvm && (
                    <>
                        <h5 className={styles.infoLabel}>{i18n.translate('TOIMINNAN_ALKAMISAIKA')}</h5>
                        <span>{format(parseISO(row.original.organisaatio.alkuPvm), 'dd.MM.yyyy')}</span>
                    </>
                )}
            </div>
        ),
        [i18n, kunnat]
    );

    const renderOrganizationAddress = React.useCallback(
        (row: Row<Rekisterointihakemus>) => (
            <div className={styles.infoContainer}>
                <h4 className={styles.infoHeader}>{i18n.translate('ORGANISAATION_YHTEYSTIEDOT')}</h4>
                <h5 className={styles.infoLabel}>{i18n.translate('PUHELINNUMERO')}</h5>
                <span>{row.original.organisaatio.yhteystiedot.puhelinnumero}</span>
                <h5 className={styles.infoLabel}>{i18n.translate('TOIMINTAMUOTO')}</h5>
                <span>{row.original.organisaatio.yhteystiedot.puhelinnumero}</span>
            </div>
        ),
        [i18n]
    );

    const renderHylatty = React.useCallback(
        (row: Row<Rekisterointihakemus>) => (
            <div className={styles.infoContainer}>
                <h5 className={styles.infoHeader}>{i18n.translate('HYLKAYKSEN_PERUSTELU')}</h5>
                <span>{row.original.paatos?.perustelu ?? '-'}</span>
            </div>
        ),
        [i18n]
    );

    const table = useReactTable({
        data,
        columns,
        state: {
            rowSelection,
            globalFilter,
            columnFilters: [{ id: 'tila', value: tilaFilter }],
            columnVisibility: {
                tila: false,
                select: tilaFilter === 'KASITTELYSSA',
                hyvaksynta: tilaFilter === 'KASITTELYSSA',
                hylatty: tilaFilter === 'HYLATTY',
                hyvaksytty: tilaFilter === 'HYVAKSYTTY',
            },
            pagination: {
                pageIndex,
                pageSize,
            },
        },
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const pages = Math.ceil(table.getFilteredRowModel().rows.length / pageSize);
    const selectedRows = filterOnlyKasittelyssa(table.getSelectedRowModel().rows);

    return (
        <div className={styles.tableContainer}>
            <div className={styles.headerRow}>
                <div className={styles.filterInputContainer}>
                    <Input
                        value={globalFilter}
                        placeholder={i18n.translate('HAKU_PLACEHOLDER')}
                        suffix={<SearchIcon color="disabled" />}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGlobalFilter(e.target.value)}
                        className={styles.filterInput}
                    />
                </div>
                <ButtonGroup>
                    {TILAT.map((key) => (
                        <Button
                            className={tilaFilter === key ? styles.selectedTila : ''}
                            key={key}
                            variant={tilaFilter === key ? 'contained' : 'outlined'}
                            onClick={() => {
                                tilaFilter !== key && setTilaFilter(key);
                            }}
                        >
                            {i18n.translate(`TAULUKKO_TILA_${key}`)}
                            {key === 'KASITTELYSSA' && kasittelyssa.length > 0 ? ` (${kasittelyssa.length})` : ''}
                        </Button>
                    ))}
                </ButtonGroup>
            </div>
            <table className={styles.tableElement}>
                <thead className={styles.tHead}>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    colSpan={header.colSpan}
                                    className={styles.tHeadCell}
                                    style={{
                                        width: header.column.getSize() ?? 'auto',
                                    }}
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row, idx: number) => {
                        return (
                            <React.Fragment key={row.id}>
                                <tr
                                    className={idx % 2 === 1 ? styles.evenRow : ''}
                                    onClick={(e) =>
                                        e.target instanceof HTMLButtonElement ||
                                        e.target instanceof HTMLInputElement ||
                                        row.toggleExpanded()
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => {
                                        return (
                                            <td
                                                key={cell.id}
                                                className={styles.tBodyCell}
                                                style={{
                                                    width: cell.column.getSize() ?? 'auto',
                                                }}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        );
                                    })}
                                </tr>
                                {row.getIsExpanded() ? (
                                    <>
                                        {tilaFilter === 'HYLATTY' ? (
                                            <tr>
                                                <td
                                                    className={styles.expandedCell}
                                                    colSpan={row.getVisibleCells().length}
                                                >
                                                    {renderHylatty(row)}
                                                </td>
                                            </tr>
                                        ) : undefined}
                                        <tr className={styles.expandedRow}>
                                            {tilaFilter === 'KASITTELYSSA' ? (
                                                <td className={styles.expandedCell}></td>
                                            ) : undefined}
                                            <td className={styles.expandedCell} colSpan={2}>
                                                {renderOrganizationDetails(row)}
                                            </td>
                                            <td
                                                className={styles.expandedCell}
                                                colSpan={data[0]?.tyyppi === 'varda' ? 3 : 2}
                                            >
                                                {renderOrganizationAddress(row)}
                                            </td>
                                        </tr>
                                    </>
                                ) : undefined}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
            {pages > 1 && <Pagination pageIndex={pageIndex} setPageIndex={setPageIndex} pages={pages} />}
            {(tilaFilter === 'KASITTELYSSA' || selectedRows.length > 0) && (
                <ApprovalButtonsContainer chosenRekisteroinnit={selectedRows} valitutKasiteltyCallback={() => {}} />
            )}
        </div>
    );
};
