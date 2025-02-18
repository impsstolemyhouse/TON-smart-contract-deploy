import { TonClient, WalletContractV4, internal, beginCell, contractAddress, toNano } from '@ton/ton';
import { mnemonicToWalletKey } from '@ton/crypto';
import { Cell } from '@ton/ton';
export async function deployContract(
    client: TonClient,
    wallet: WalletContractV4,
    secretKey: Buffer,
    contractCode: Cell,
    initData: Cell,
) {
    const contract = contractAddress(0, { code: contractCode, data: initData });
    const walletContract = client.open(wallet);
    const seqno = await walletContract.getSeqno();

    await walletContract.sendTransfer({
        secretKey,
        seqno,
        messages: [
            internal({
                to: contract,
                value: toNano('0.1'), // Initial deployment fee
                init: { code: contractCode, data: initData },
                body: beginCell().endCell(),
            }),
        ],
    });
    // address: tokensmartcontract,
    // amount: tonamount,
    // payload: mintCell.toBoc().toString("base64")

    return contract;
}
