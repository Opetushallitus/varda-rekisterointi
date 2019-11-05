import React from "react";
import {render, unmountComponentAtNode} from "react-dom";
import {act,Simulate} from "react-dom/test-utils";
import {Koodi, Osoite, tyhjaOsoite, Virheet} from "../types";
import OsoiteInput from "./OsoiteInput";

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
const noOpCallback = (osoite: Osoite, virheet: Virheet<Osoite>) => { /* */ };

jest.mock('react-uid', () => {
    return {
        useUIDSeed: () => (id: any) => id as string
    }
});

let container: Element;
describe('OsoiteInput', () => {
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

    it('on muokattavissa', async () => {
        await act(async() => {
            render(
                <OsoiteInput postinumerot={postinumerot}
                             alkuperainenOsoite={tyhjaOsoite}
                             osoite={tyhjaOsoite}
                             asetaOsoiteCallback={noOpCallback} />,
                container);
        });
        const disabledInputs = container.querySelectorAll('input[disabled]');
        expect(disabledInputs.length).toEqual(0);
    });

    it('ei ole muokattavissa', async () => {
        const alkuperainenOsoite = {
            katuosoite: 'Humikkalanrinne 1',
            postinumeroUri: '00940',
            postitoimipaikka: 'Helsinki'
        };
        await act(async() => {
            render(
                <OsoiteInput postinumerot={postinumerot}
                             alkuperainenOsoite={alkuperainenOsoite}
                             osoite={alkuperainenOsoite}
                             onKopio={true}
                             asetaOsoiteCallback={noOpCallback} />,
                container);
        });
        const disabledInputs = container.querySelectorAll('input[disabled]');
        expect(disabledInputs.length).toEqual(2);
    });

    it('päivittää postitoimipaikan postinumeron perusteella', async() => {
        let osoitePaivitys: Partial<Osoite> = {};
        await act(async() => {
            render(
                <OsoiteInput postinumerot={postinumerot}
                             alkuperainenOsoite={tyhjaOsoite}
                             osoite={tyhjaOsoite}
                             asetaOsoiteCallback={(paivitys, _) => osoitePaivitys = paivitys} />,
                container);
        });
        const postinumeroInput = container.querySelector('input#postinumeroUri') as HTMLInputElement;
        expect(postinumeroInput).not.toBeNull();
        postinumeroInput.value = '00950';
        Simulate.blur(postinumeroInput);
        expect(osoitePaivitys.postitoimipaikka).toEqual('Helsinki');
    });

    it('merkitsee virheelliseksi validoinnin epäonnistuessa', async () => {
        let osoiteVirheet: Virheet<Osoite> = {};
        await act(async() => {
            render(
                <OsoiteInput postinumerot={postinumerot}
                             alkuperainenOsoite={tyhjaOsoite}
                             osoite={tyhjaOsoite}
                             asetaOsoiteCallback={(_, virheet) => osoiteVirheet = virheet} />,
                container);
        });
        const postinumeroInput = container.querySelector('input#postinumeroUri') as HTMLInputElement;
        expect(postinumeroInput).not.toBeNull();
        postinumeroInput.value = '0095';
        Simulate.blur(postinumeroInput);
        expect(osoiteVirheet.postinumeroUri).not.toBeUndefined();

    });

    it('ei merkitse virheelliseksi validoinnin onnistuessa', async () => {
        let osoiteVirheet: Virheet<Osoite> = {};
        await act(async() => {
            render(
                <OsoiteInput postinumerot={postinumerot}
                             alkuperainenOsoite={tyhjaOsoite}
                             osoite={tyhjaOsoite}
                             asetaOsoiteCallback={(_, virheet) => osoiteVirheet = virheet} />,
                container);
        });
        const postinumeroInput = container.querySelector('input#postinumeroUri') as HTMLInputElement;
        expect(postinumeroInput).not.toBeNull();
        postinumeroInput.value = '00950';
        Simulate.blur(postinumeroInput);
        expect(osoiteVirheet.postinumeroUri).toBeUndefined();
    });

    it('ei näytä osoitteen kopiointi -checkboxia', async () => {
        await act(async() => {
            render(
                <OsoiteInput postinumerot={postinumerot}
                             alkuperainenOsoite={tyhjaOsoite}
                             osoite={tyhjaOsoite}
                             asetaOsoiteCallback={noOpCallback} />,
                container);
        });
        const kopioiInput = container.querySelector('input.oph-checkable-input');
        expect(kopioiInput).toBeNull();
    });

    it('näyttää osoitteen kopiointi -checkboxin', async () => {
        await act(async() => {
            render(
                <OsoiteInput postinumerot={postinumerot}
                             alkuperainenOsoite={tyhjaOsoite}
                             osoite={tyhjaOsoite}
                             asetaOsoiteCallback={noOpCallback}
                             asetaKopiointiCallback={_ => {}} />,
                container);
        });
        const kopioiInput = container.querySelector('input.oph-checkable-input');
        expect(kopioiInput).not.toBeNull();
    });

    it('kutsuu osoitteen kopiointi -callbackia', async () => {
        let callbackKutsuttu = false;
        await act(async() => {
            render(
                <OsoiteInput postinumerot={postinumerot}
                             alkuperainenOsoite={tyhjaOsoite}
                             osoite={tyhjaOsoite}
                             asetaOsoiteCallback={noOpCallback}
                             asetaKopiointiCallback={_ => callbackKutsuttu = true} />,
                container);
        });
        const kopioiInput = container.querySelector('input.oph-checkable-input') as HTMLInputElement;
        expect(kopioiInput).not.toBeNull();
        kopioiInput.checked = true;
        Simulate.click(kopioiInput);
        expect(callbackKutsuttu).toBeTruthy();
    });
});
