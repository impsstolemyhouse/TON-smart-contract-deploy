import { TonClient, WalletContractV4, internal, toNano, Cell, contractAddress, StateInit, beginCell } from 'ton';
import { mnemonicToWalletKey } from 'ton-crypto';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import fs from 'fs';
import dotenv from 'dotenv';
import { Address } from '@ton/core';
dotenv.config();

async function deploySmartContract() {
    const mnemonic = process.env.MNEMONIC?.split(' ');
    if (!mnemonic) throw new Error('MNEMONIC not found in environment variables');

    const key = await mnemonicToWalletKey(mnemonic);
    const endpoint = await getHttpEndpoint();
    const client = new TonClient({ endpoint });

    const wallet = WalletContractV4.create({ workchain: 0, publicKey: key.publicKey });
    const walletContract = client.open(wallet);

    const balance = await walletContract.getBalance();
    if (balance < toNano(0.1)) {
        console.error('Not enough TON in wallet');
        return;
    }

    const contractCode = Cell.fromBoc(fs.readFileSync('./build/token.cell'))[0];
    // console.log('contractCode====>', contractCode);
    // console.log('1');
    // ✅ PROPER ADDRESS HANDLING
    const { Address } = require('ton'); // Import the Address class from the TON SDK

    const TREASURY_ADDR = Address.parse('0:dbb650b42b54d8a1da0e2be51aa63071ae6f55be6e6c3aad601a180e59732931'); // Convert to Address object
    const JETTON_MASTER_ADDR = Address.parse('0:9232fe82273224d1b31d010b6b6b9cd5db5d3b6faa3adbce02c91c7c2670597c'); // Similarly convert to Address

    const dataCell = beginCell().storeAddress(TREASURY_ADDR).storeAddress(JETTON_MASTER_ADDR).endCell();

    const stateInit: StateInit = { code: contractCode, data: dataCell };
    const contractAddr = contractAddress(0, stateInit);

    console.log('Deploying contract to:', contractAddr.toString({ bounceable: false }));

    const deployMessage = internal({
        to: contractAddr,
        value: toNano(0.03),
        bounce: false,
        init: stateInit,
    });

    await walletContract.sendTransfer({
        seqno: await walletContract.getSeqno(),
        secretKey: key.secretKey,
        messages: [deployMessage],
    });

    console.log('Deployment transaction sent! Monitor the contract address.');
}

deploySmartContract().catch(console.error);

export async function run() {
    await deploySmartContract();
}
