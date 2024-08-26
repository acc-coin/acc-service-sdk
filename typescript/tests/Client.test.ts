import { ACCClient } from "../src";

import { Wallet } from "@ethersproject/wallet";
import { ACCNetWorkType } from "../src/modules/client/ACCClient";
import { Amount, BOACoin } from "../src/modules/utils/Amount";
import { AddressZero } from "@ethersproject/constants";

describe("Test of ACCClient", function () {
    this.timeout(1000 * 60 * 5);
    let providerClient: ACCClient;
    let providerWallet = new Wallet("0x70438bc3ed02b5e4b76d496625cb7c06d6b7bf4362295b16fdfe91a046d4586c");
    let delegatorClient: ACCClient;
    let delegatorWallet = new Wallet("0x44868157d6d3524beb64c6ae41ee6c879d03c19a357dadb038fefea30e23cbab");
    before(() => {
        providerClient = new ACCClient(ACCNetWorkType.testnet, providerWallet.privateKey);
        delegatorClient = new ACCClient(ACCNetWorkType.testnet, delegatorWallet.privateKey);
    });

    it("Test getBalanceAccount", async () => {
        const res = await providerClient.getBalanceAccount(providerWallet.address);
        console.log(new BOACoin(res.point.balance).toDisplayString(true, 4));
        console.log(new BOACoin(res.point.value).toDisplayString(true, 4));
        console.log(new BOACoin(res.token.balance).toDisplayString(true, 4));
        console.log(new BOACoin(res.token.value).toDisplayString(true, 4));
    });

    it("Test getBalancePhone", async () => {
        const res = await providerClient.getBalancePhone("+82 10-1000-2000");
        console.log(new BOACoin(res.point.balance).toDisplayString(true, 4));
        console.log(new BOACoin(res.point.value).toDisplayString(true, 4));
        console.log(new BOACoin(res.token.balance).toDisplayString(true, 4));
        console.log(new BOACoin(res.token.value).toDisplayString(true, 4));
    });

    it("Clear delegator", async () => {
        await providerClient.setTransferDelegator(AddressZero);
        console.log(await providerClient.getTransferDelegator());
    });

    it("Provider to Address", async () => {
        const isProvider = await providerClient.isProvider(providerWallet.address);
        const receiver = "0xB6f69F0e9e70034ba0578C542476cC13eF739269";
        if (isProvider) {
            const res1 = await providerClient.provideToAddress(
                providerWallet.address,
                receiver,
                Amount.make(100, 18).value
            );
            console.log(res1);

            const res2 = await providerClient.getBalanceAccount(receiver);
            console.log(new BOACoin(res2.point.balance).toDisplayString(true, 4));
            console.log(new BOACoin(res2.token.balance).toDisplayString(true, 4));
        }
    });

    it("Provider to Phone", async () => {
        const isProvider = await providerClient.isProvider(providerWallet.address);
        const phoneNumber = "+82 10-9000-5000";
        if (isProvider) {
            const res1 = await providerClient.provideToPhone(
                providerWallet.address,
                phoneNumber,
                Amount.make(100, 18).value
            );
            console.log(res1);

            const res2 = await providerClient.getBalancePhone(phoneNumber);
            console.log(new BOACoin(res2.point.balance).toDisplayString(true, 4));
            console.log(new BOACoin(res2.token.balance).toDisplayString(true, 4));
        }
    });

    it("Set delegator", async () => {
        await providerClient.setTransferDelegator(delegatorClient.getAddress());
        console.log(await providerClient.getTransferDelegator());
    });

    it("Provider to Address by delegator", async () => {
        const isProvider = await providerClient.isProvider(providerWallet.address);
        const receiver = "0xB6f69F0e9e70034ba0578C542476cC13eF739269";
        if (isProvider) {
            const res1 = await delegatorClient.provideToAddress(
                providerWallet.address,
                receiver,
                Amount.make(100, 18).value
            );
            console.log(res1);

            const res2 = await providerClient.getBalanceAccount(receiver);
            console.log(new BOACoin(res2.point.balance).toDisplayString(true, 4));
            console.log(new BOACoin(res2.token.balance).toDisplayString(true, 4));
        }
    });

    it("Provider to Phone by delegator", async () => {
        const isProvider = await providerClient.isProvider(providerWallet.address);
        const phoneNumber = "+82 10-9000-5000";
        if (isProvider) {
            const res1 = await delegatorClient.provideToPhone(
                providerWallet.address,
                phoneNumber,
                Amount.make(100, 18).value
            );
            console.log(res1);

            const res2 = await providerClient.getBalancePhone(phoneNumber);
            console.log(new BOACoin(res2.point.balance).toDisplayString(true, 4));
            console.log(new BOACoin(res2.token.balance).toDisplayString(true, 4));
        }
    });
});
