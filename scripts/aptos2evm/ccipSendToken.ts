import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network, MoveVector, Hex } from "@aptos-labs/ts-sdk";
import * as dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { networkConfig } from "../../helper-config";
import { parseAmountToU64Decimals, fetchEventsByTxHash } from "./utils";

dotenv.config();

const argv = yargs(hideBin(process.argv))
    .option('feeToken', {
        type: 'string',
        description: 'Specify the fee token (link or native)',
        demandOption: true,
        choices: [
            networkConfig.aptos.feeTokenNameLink,
            networkConfig.aptos.feeTokenNameNative
        ],
    }).option("destChain", {
        type: 'string',
        description: 'Specify the destination chain where the token will be sent',
        demandOption: true,
        choices: [
            networkConfig.aptos.destChains.ethereumSepolia,
            networkConfig.aptos.destChains.avalancheFuji
        ]
    }).option('amount', {
        type: 'number',
        description: 'Amount of token to send',
        demandOption: true,
    }).option('aptosSender', {
        type: 'string',
        description: 'Specify the object address at which the ccip_message_sender module is published',
        demandOption: true
    }).option('evmReceiver', {
        type: 'string',
        description: 'Specify the EVM Receiver Address',
        demandOption: true
    })
    .parseSync();

// Specify which network to connect to via AptosConfig
async function sendTokenFromAptosToEvm(tokenAmount: number) {
    // Set up the account with the private key
    const privateKeyHex = process.env.PRIVATE_KEY_HEX;
    if (!privateKeyHex) {
        throw new Error("Please set the environment variable PRIVATE_KEY_HEX.");
    }
    const privateKey = new Ed25519PrivateKey(privateKeyHex);
    const account = Account.fromPrivateKey({ privateKey });

    // prepare `${moduleAddr}::${ccipSenderModuleName}::${SENDER_ENTRY_FUNC_NAME}`
    const moduleAddr = argv.aptosSender;
    const ccipSenderModuleName = networkConfig.aptos.ccipSenderModuleName;
    const SENDER_ENTRY_FUNC_NAME = "send_tokens";

    // Prepare the parameters for entry function

    // Chain selector
    let destChainSelector: string | undefined;
    if (argv.destChain === networkConfig.aptos.destChains.ethereumSepolia) {
        destChainSelector = networkConfig.sepolia.chainSelector
    } else if (argv.destChain === networkConfig.aptos.destChains.avalancheFuji) {
        destChainSelector = networkConfig.avalancheFuji.chainSelector
    } else {
        destChainSelector = undefined
        throw new Error("Invalid destination chain specified. Please specify --destChain sepolia or --destChain fuji.");
    }

    // Fetch the receiver address and pad it to 32 bytes
    const receiver = argv.evmReceiver;
    const receiverUint8Array = Hex.hexInputToUint8Array(receiver)
    if (receiverUint8Array.length !== 20) {
        throw new Error("EVM receiver address must be 20 bytes.");
    }
    const paddedReceiverArray = new Uint8Array(32);
    paddedReceiverArray.set(receiverUint8Array, 12);

    // BnM token address, store address and amount to send
    // TODO: move token store to config file. Is the token store address always 0x0?
    const ccipBnMTokenAddr = networkConfig.aptos.ccipBnMTokenAddress;
    const TOKEN_AMOUNT_TO_SEND = parseAmountToU64Decimals(tokenAmount, 8); // 8 decimals for BnM token
    const TOKEN_STORE_ADDR = "0x0"

    // set fee token address as user input
    let feeToken = argv.feeToken === networkConfig.aptos.feeTokenNameLink
        ? networkConfig.aptos.linkTokenAddress
        : argv.feeToken === networkConfig.aptos.feeTokenNameNative
            ? networkConfig.aptos.nativeTokenAddress
            : (() => {
                throw new Error("Invalid fee token specified. Please specify fee token use --feeToken link or --feeToken native.");
            })();

    if (!feeToken) {
        throw new Error("Please set the environment variable APTOS_FEE_TOKEN_LINK or APTOS_FEE_TOKEN_NATIVE.");
    }

    // Setup the client
    const config = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(config);

    // construct the transaction for entry function
    const transaction = await aptos.transaction.build.simple({
        sender: account.accountAddress,
        data: {
            function: `${moduleAddr}::${ccipSenderModuleName}::${SENDER_ENTRY_FUNC_NAME}`,
            functionArguments: [
                destChainSelector,
                MoveVector.U8(Hex.hexInputToUint8Array(paddedReceiverArray)),
                [ccipBnMTokenAddr],
                MoveVector.U64([TOKEN_AMOUNT_TO_SEND]),
                [TOKEN_STORE_ADDR],
                feeToken,
                networkConfig.aptos.feeTokenStoreAddress, // fee token store address
            ],
        }
    });

    // simulate the transaction to check for errors
    const [userTransactionResponse] = await aptos.transaction.simulate.simple({
        signerPublicKey: account.publicKey,
        transaction,
    });

    if (!userTransactionResponse.success) {
        throw new Error(`Transaction simulation failed: ${userTransactionResponse.vm_status}`);
    }

    // Sign the transaction if the simulation was successful
    const senderAuthenticator = aptos.transaction.sign({
        signer: account,
        transaction,
    })

    // Submit the transaction
    const committedTransaction = await aptos.transaction.submit.simple({
        transaction,
        senderAuthenticator,
    })

    // Wait for the transaction to be confirmed and return the hash
    const executed = await aptos.transaction.waitForTransaction({
        transactionHash: committedTransaction.hash,
    })

    if (executed.success === false) {
        throw new Error(`Transaction execution failed: ${executed.vm_status}`);
    }

    const messageId = await fetchEventsByTxHash(executed.hash, aptos);
    console.log(`✅ Transaction successful: https://explorer.aptoslabs.com/txn/${executed.hash}?network=testnet`);
    console.log(`🆔 CCIP Message ID: ${messageId}`);
    console.log(`🔗 CCIP Explorer URL: https://ccip.chain.link/#/side-drawer/msg/${messageId}`);
}

sendTokenFromAptosToEvm(argv.amount);