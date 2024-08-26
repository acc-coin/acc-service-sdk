import { Wallet } from "@ethersproject/wallet";
import { HTTPClient } from "../network/HTTPClient";
import { BigNumber } from "@ethersproject/bignumber";
import { ContractUtils } from "../utils/ContractUtils";

import { PhoneNumberFormat, PhoneNumberUtil } from "google-libphonenumber";

import URI from "urijs";

export enum ACCNetWorkType {
    testnet,
    mainnet,
}

export interface IACCEndpoints {
    relay: string;
    save: string;
}

export interface IBalance {
    balance: BigNumber;
    value: BigNumber;
}

export interface IUserBalance {
    point: IBalance;
    token: IBalance;
}

export class ACCClient {
    private endpoints: IACCEndpoints;
    private readonly wallet: Wallet;
    private phoneUtil: PhoneNumberUtil;
    private chainId: number = 0;

    constructor(network: ACCNetWorkType, key: string) {
        this.phoneUtil = PhoneNumberUtil.getInstance();
        if (network === ACCNetWorkType.mainnet) {
            this.endpoints = {
                relay: "https://relay.main.acccoin.io",
                save: "https://save.main.acccoin.io",
            };
        } else {
            this.endpoints = {
                relay: "https://relay.test.acccoin.io",
                save: "https://save.test.acccoin.io",
            };
        }
        this.wallet = new Wallet(key);
    }

    public getAddress(): string {
        return this.wallet.address;
    }

    /**
     * Provide the user's points and token balance information
     * @param account User's wallet address
     */
    public async getBalanceAccount(account: string): Promise<IUserBalance> {
        const agent = new HTTPClient({});
        const response = await agent.get(
            URI(this.endpoints.relay).directory("/v1/ledger/balance/account/").filename(account).toString()
        );

        if (response.data.code !== 0) {
            throw new Error(response.data.error?.message);
        }

        return {
            point: {
                balance: BigNumber.from(response.data.data.point.balance),
                value: BigNumber.from(response.data.data.point.value),
            },
            token: {
                balance: BigNumber.from(response.data.data.token.balance),
                value: BigNumber.from(response.data.data.token.value),
            },
        };
    }

    /**
     * Provide the user's points and token balance information
     * @param phoneNumber User's phone number
     */
    public async getBalancePhone(phoneNumber: string): Promise<IUserBalance> {
        const agent = new HTTPClient({});
        const response = await agent.get(
            URI(this.endpoints.relay).directory("/v1/ledger/balance/phone/").filename(phoneNumber).toString()
        );

        if (response.data.code !== 0) {
            throw new Error(response.data.error?.message);
        }

        return {
            point: {
                balance: BigNumber.from(response.data.data.point.balance),
                value: BigNumber.from(response.data.data.point.value),
            },
            token: {
                balance: BigNumber.from(response.data.data.token.balance),
                value: BigNumber.from(response.data.data.token.value),
            },
        };
    }

    /**
     * Provide a nonce corresponding to the user's wallet address. It provides a nonce corresponding to the user's wallet address.
     * This ensures that the same signature is not repeated. And this value is recorded in Contract and automatically increases by 1.
     * @param account User's wallet address
     */
    public async getLedgerNonceOf(account: string): Promise<number> {
        const agent = new HTTPClient({});
        const response = await agent.get(
            URI(this.endpoints.relay).directory("/v1/ledger/nonce/").filename(account).toString()
        );

        if (response.data.code !== 0) {
            throw new Error(response.data.error?.message);
        }

        return Number(response.data.data.nonce);
    }

    /**
     * Provide the ID of the chain
     */
    public async getChainId(): Promise<number> {
        if (this.chainId === 0) {
            const agent = new HTTPClient({});
            const response = await agent.get(URI(this.endpoints.relay).directory("/v1/chain/side/id").toString());

            if (response.data.code !== 0) {
                throw new Error(response.data.error?.message);
            }

            this.chainId = Number(response.data.data.chainId);
        }
        return this.chainId;
    }

    /**
     * Check if the `account` can provide points
     */
    public async isProvider(account: string): Promise<boolean> {
        const agent = new HTTPClient({});
        const response = await agent.get(
            URI(this.endpoints.relay).directory("/v1/provider/status/").filename(account).toString()
        );
        if (response.data.code !== 0) {
            throw new Error(response.data.error?.message);
        }

        return response.data.data.enable;
    }

    /**
     * Register the address of the assistant who directly delivers points for the registered wallet(this.wallet).
     * The assistant's wallet can be registered and used on the server.
     * The assistant does not have the authority to deposit and withdraw, only has the authority to provide points.
     * @param delegator
     */
    public async setTransferDelegator(delegator: string): Promise<string> {
        const agent = new HTTPClient({});
        const nonce = await this.getLedgerNonceOf(this.wallet.address);
        const message = ContractUtils.getRegisterAssistanceMessage(
            this.wallet.address,
            delegator,
            nonce,
            await this.getChainId()
        );
        const signature = await ContractUtils.signMessage(this.wallet, message);
        const response = await agent.post(
            URI(this.endpoints.relay).directory("/v1/provider/assistant/register").toString(),
            {
                provider: this.wallet.address,
                assistant: delegator,
                signature,
            }
        );
        if (response.data.code !== 0) {
            throw new Error(response.data.error?.message);
        }

        return response.data.data.txHash;
    }

    /**
     * Provide the helper's address for the registered wallet(this.wallet)
     */
    public async getTransferDelegator(): Promise<string> {
        const agent = new HTTPClient({});
        const response = await agent.get(
            URI(this.endpoints.relay).directory("/v1/provider/assistant/").filename(this.wallet.address).toString()
        );
        if (response.data.code !== 0) {
            throw new Error(response.data.error?.message);
        }

        return response.data.data.assistant;
    }

    /**
     * Points are provided to the specified address.
     * Registered wallets are used for signatures. Registered wallet(this.wallet) may be providers or helpers.
     * @param provider - wallet address of the resource provider
     * @param receiver - wallet address of the person who will receive the points
     * @param amount - amount of points
     */
    public async provideToAddress(provider: string, receiver: string, amount: BigNumber): Promise<string> {
        const agent = new HTTPClient({});
        const nonce = await this.getLedgerNonceOf(this.wallet.address);
        const chainId = await this.getChainId();
        const message = ContractUtils.getProvidePointToAddressMessage(provider, receiver, amount, nonce, chainId);
        const signature = await ContractUtils.signMessage(this.wallet, message);
        const response = await agent.post(URI(this.endpoints.relay).directory("/v1/provider/send/account").toString(), {
            provider: provider,
            receiver: receiver,
            amount: amount.toString(),
            signature,
        });
        if (response.data.code !== 0) {
            throw new Error(response.data.error?.message);
        }

        return response.data.data.txHash;
    }

    private getInternationalPhoneNumber(phoneNumber: string): string {
        const number = this.phoneUtil.parseAndKeepRawInput(phoneNumber, "ZZ");
        if (!this.phoneUtil.isValidNumber(number)) {
            throw new Error("Invalid Phone Number");
        }
        return this.phoneUtil.format(number, PhoneNumberFormat.INTERNATIONAL);
    }

    /**
     * Points are provided to the specified phone number.
     * Registered wallets are used for signatures. Registered wallet(this.wallet) may be providers or helpers.
     * @param provider - wallet address of the resource provider
     * @param receiver - phone number of the person who will receive the points
     * @param amount - amount of points
     */
    public async provideToPhone(provider: string, receiver: string, amount: BigNumber): Promise<string> {
        const agent = new HTTPClient({});
        const nonce = await this.getLedgerNonceOf(this.wallet.address);
        const chainId = await this.getChainId();
        const phoneHash = ContractUtils.getPhoneHash(this.getInternationalPhoneNumber(receiver));
        const message = ContractUtils.getProvidePointToPhoneMessage(provider, phoneHash, amount, nonce, chainId);
        const signature = await ContractUtils.signMessage(this.wallet, message);
        const response = await agent.post(
            URI(this.endpoints.relay).directory("/v1/provider/send/phoneHash").toString(),
            {
                provider: provider,
                receiver: phoneHash,
                amount: amount.toString(),
                signature,
            }
        );
        if (response.data.code !== 0) {
            throw new Error(response.data.error?.message);
        }

        return response.data.data.txHash;
    }
}
