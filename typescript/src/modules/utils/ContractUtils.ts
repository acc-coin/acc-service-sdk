// tslint:disable-next-line:no-implicit-dependencies
import { defaultAbiCoder, Interface } from "@ethersproject/abi";
// tslint:disable-next-line:no-implicit-dependencies
import { Signer } from "@ethersproject/abstract-signer";
// tslint:disable-next-line:no-implicit-dependencies
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
// tslint:disable-next-line:no-implicit-dependencies
import { arrayify, BytesLike } from "@ethersproject/bytes";
// tslint:disable-next-line:no-implicit-dependencies
import { keccak256 } from "@ethersproject/keccak256";

export enum LoyaltyNetworkID {
    ACC_TESTNET = 1,
    ACC_MAINNET,
}

export class ContractUtils {
    // region Phone Link
    public static getPhoneHash(phone: string): string {
        const encodedResult = defaultAbiCoder.encode(["string", "string"], ["BOSagora Phone Number", phone]);
        return keccak256(encodedResult);
    }

    public static getProvidePointToAddressMessage(
        provider: string,
        receiver: string,
        amount: BigNumberish,
        nonce: BigNumberish,
        chainId: BigNumberish
    ): Uint8Array {
        const encodedResult = defaultAbiCoder.encode(
            ["address", "address", "uint256", "uint256", "uint256"],
            [provider, receiver, amount, chainId, nonce]
        );
        return arrayify(keccak256(encodedResult));
    }

    public static getProvidePointToPhoneMessage(
        provider: string,
        receiver: BytesLike,
        amount: BigNumberish,
        nonce: BigNumberish,
        chainId: BigNumberish
    ): Uint8Array {
        const encodedResult = defaultAbiCoder.encode(
            ["address", "bytes32", "uint256", "uint256", "uint256"],
            [provider, receiver, amount, chainId, nonce]
        );
        return arrayify(keccak256(encodedResult));
    }

    public static getRegisterAssistanceMessage(
        provider: string,
        assistance: string,
        nonce: BigNumberish,
        chainId: BigNumberish
    ): Uint8Array {
        const encodedResult = defaultAbiCoder.encode(
            ["address", "address", "uint256", "uint256"],
            [provider, assistance, chainId, nonce]
        );
        return arrayify(keccak256(encodedResult));
    }

    public static async signMessage(signer: Signer, message: Uint8Array): Promise<string> {
        return signer.signMessage(message);
    }
}
