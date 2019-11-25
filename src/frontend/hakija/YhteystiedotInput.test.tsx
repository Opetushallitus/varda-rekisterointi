import React from "react";
import {render, unmountComponentAtNode} from "react-dom";
import {act, Simulate} from "react-dom/test-utils";
import YhteystiedotInput from "./YhteystiedotInput";
import {Koodi, RekisterointiVirheet, Yhteystiedot} from "../types";
import {AxiosPromise} from "axios";

let container: Element;
const noOpPaivita = (_yhteystiedot: Partial<Yhteystiedot>, _virheet: RekisterointiVirheet<Yhteystiedot>) => { /* no op */ };
async function renderInput(vainLuku: boolean, yhteystiedot: Yhteystiedot, callback = noOpPaivita) {
    await act(async() => {
        render(
            <YhteystiedotInput
                vainLuku={vainLuku}
                yhteystiedot={{...yhteystiedot}}
                paivitaYhteystiedot={callback}
            />,
            container
        );
    });
}

type UseAxiosFunction<T> = (config: string) => [{ data: T, loading: boolean}, (() => AxiosPromise)?]

jest.mock('axios-hooks', () => {
    const postinumerot: Koodi[] = [
        {
            arvo: '00950', // iistimpää => siistimpää
            nimi: {
                'fi': 'Helsinki',
                'sv': 'Helsingfors',
                'en': 'Helsinki'
            },
            uri: 'posti_00950'
        }
    ];
    const useAxios: UseAxiosFunction<Koodi[]> = (_config: string) => {
        const response = {data: postinumerot, loading: false};
        return [response];
    };
    return {
        __esModule: true,
        useAxios,
        default: useAxios
    }
});
describe('YhteystiedotInput', () => {
    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });
    afterEach(() => {
        unmountComponentAtNode(container);
        container.remove();
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('näyttää annetut yhteystiedot lukutilassa', async () => {
        const yhteystiedot: Yhteystiedot = {
            puhelinnumero: "5551234567",
            sahkoposti: "lots@of.spam"
        };
        await renderInput(true, yhteystiedot);
        const puhelinnumeroInput = container.querySelector("#yhteystiedot-puhelinnumero") as HTMLInputElement;
        const sahkopostiInput = container.querySelector("#yhteystiedot-sahkoposti") as HTMLInputElement;
        expect(puhelinnumeroInput).not.toBeNull();
        expect(sahkopostiInput).not.toBeNull();
        expect(puhelinnumeroInput.value).toEqual(yhteystiedot.puhelinnumero);
        expect(sahkopostiInput.value).toEqual(yhteystiedot.sahkoposti);
        expect(puhelinnumeroInput.disabled).toBeTruthy();
        expect(sahkopostiInput.disabled).toBeTruthy();
    });

    it('sallii muokata, kun lukutila ei asetettu', async () => {
        const yhteystiedot: Yhteystiedot = {};
        await renderInput(false, yhteystiedot);
        const puhelinnumeroInput = container.querySelector("#yhteystiedot-puhelinnumero") as HTMLInputElement;
        const sahkopostiInput = container.querySelector("#yhteystiedot-sahkoposti") as HTMLInputElement;
        expect(puhelinnumeroInput).not.toBeNull();
        expect(sahkopostiInput).not.toBeNull();
        expect(puhelinnumeroInput.disabled).toBeFalsy();
        expect(sahkopostiInput.disabled).toBeFalsy();
    });

    it('kutsuu päivitys-callbackia ja validoi', async () => {
        const yhteystiedot: Yhteystiedot = {};
        let muutos: Partial<Yhteystiedot> = {};
        let validointiVirheet: RekisterointiVirheet<Yhteystiedot> = {};
        const callback = (yhteystiedot: Partial<Yhteystiedot>, virheet: RekisterointiVirheet<Yhteystiedot>) => {
            muutos = yhteystiedot;
            validointiVirheet = virheet;
        };
        await renderInput(false, yhteystiedot, callback);
        const puhelinnumeroInput = container.querySelector("#yhteystiedot-puhelinnumero") as HTMLInputElement;
        expect(puhelinnumeroInput).not.toBeNull();
        const puhelinnumero = "010234567";
        puhelinnumeroInput.value = puhelinnumero;
        Simulate.blur(puhelinnumeroInput);
        expect(puhelinnumeroInput.value).toEqual(puhelinnumero);
        expect(muutos.puhelinnumero).toEqual(puhelinnumero);
        expect(validointiVirheet.puhelinnumero).toBeUndefined();
    });

    it('asettaa virheet päivittäessä', async () => {
        const yhteystiedot: Yhteystiedot = {};
        let validointiVirheet: RekisterointiVirheet<Yhteystiedot> = {};
        const callback = (yhteystiedot: Partial<Yhteystiedot>, virheet: RekisterointiVirheet<Yhteystiedot>) => {
            validointiVirheet = virheet;
        };
        await renderInput(false, yhteystiedot, callback);
        const puhelinnumeroInput = container.querySelector("#yhteystiedot-puhelinnumero") as HTMLInputElement;
        expect(puhelinnumeroInput).not.toBeNull();
        puhelinnumeroInput.value = "";
        Simulate.blur(puhelinnumeroInput);
        expect(validointiVirheet.puhelinnumero).toBeDefined();
    });

    it('poistaa virheen sen korjatessa', async () => {
        const yhteystiedot: Yhteystiedot = {};
        let validointiVirheet: RekisterointiVirheet<Yhteystiedot> = {};
        const callback = (yhteystiedot: Partial<Yhteystiedot>, virheet: RekisterointiVirheet<Yhteystiedot>) => {
            validointiVirheet = virheet;
        };
        await renderInput(false, yhteystiedot, callback);
        const puhelinnumeroInput = container.querySelector("#yhteystiedot-puhelinnumero") as HTMLInputElement;
        expect(puhelinnumeroInput).not.toBeNull();
        puhelinnumeroInput.value = "";
        Simulate.blur(puhelinnumeroInput);
        expect(validointiVirheet.puhelinnumero).toBeDefined();
        puhelinnumeroInput.value = "123";
        Simulate.blur(puhelinnumeroInput);
        expect(validointiVirheet.puhelinnumero).not.toBeDefined();
    });
});
