import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network, MoveVector, Hex, MoveString } from "@aptos-labs/ts-sdk";
import  * as dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { networkConfig } from "../helper-config";
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
  })
  .parseSync();


// Specify which network to connect to via AptosConfig
async function sendMsgAndTokenFromAptosToEvm() {
    // Set up the account with the private key
    const privateKeyHex = process.env.PRIVATE_KEY_HEX;
    if (!privateKeyHex) {
        throw new Error("Please set the environment variable PRIVATE_KEY.");
    }
    const privateKey = new Ed25519PrivateKey(privateKeyHex);
    const account = Account.fromPrivateKey({privateKey});

    // prepare `${moduleAddr}::${ccipSenderModuleName}::${SENDER_ENTRY_FUNC_NAME}`
    const moduleAddr = process.env.STARTER_MODULE_ADDRESS
    if (!moduleAddr) {
        throw new Error("Please set the STARTER_MODULE_ADDRESS in file .env");
    }
    const ccipSenderModuleName = networkConfig.aptos.ccipSenderModuleName;
    const SENDER_ENTRY_FUNC_NAME = "send_message_with_tokens";

    // Prepare the parameters for entry function
    // Chain selector
    // TODO: make this dynamic based on user's input
    const destChainSelector = networkConfig.sepolia.chainSelector

    // Fetch the receiver address and pad it to 32 bytes
    const receiver = process.env.RECEIVER
    if (!receiver) {
        throw new Error("Please set the environment variable: RECEIVER");
    }
    const receiverUint8Array = Hex.hexInputToUint8Array(receiver)
    if (receiverUint8Array.length !== 20) {
        throw new Error("EVM receiver address must be 20 bytes.");
    }
    const paddedReceiverArray = new Uint8Array(32);
    paddedReceiverArray.set(receiverUint8Array, 12);

    // BnM token address, store address and amount to send
    // TODO: move token store to config file. Is the token store address always 0x0?
    const ccipBnMTokenAddr = networkConfig.aptos.ccipBnMTokenAddress;
    const TOKEN_AMOUNT_TO_SEND = 10000000
    const TOKEN_STORE_ADDR = "0x0"

    // set the message to be sent
    const messageUint8Array = new TextEncoder().encode("hello");

    // fee token address and store address
    // fee token is decided by user input
    // TODO: move token store addr to config file, Is the token store address always 0x0?
    let feeToken: string | undefined;
    if (argv.feeToken === networkConfig.aptos.feeTokenNameLink) {
        feeToken = networkConfig.aptos.linkTokenAddress;
    } else if (argv.feeToken === networkConfig.aptos.feeTokenNameNative) {
        feeToken = networkConfig.aptos.nativeTokenAddress;
    } else {
        feeToken = undefined
        throw new Error("Invalid fee token specified. Please specify fee token use --feeToken link or --feeToken native.");
    }
    if (!feeToken) {
        throw new Error("Please set the environment variable APTOS_FEE_TOKEN_LINK or APTOS_FEE_TOKEN_NATIVE.");
    }    

    const feeTokenStore = process.env.FEE_TOKEN_STORE 
    if (!feeTokenStore) {
        throw new Error("Please set the environment variables, FEE_TOKEN_STORE.");
    }
    
    // Setup the client
    const config = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(config);

    // construct the transaction to send a CCIP message
    const transaction = await aptos.transaction.build.simple({
        sender: account.accountAddress,
        data: {
            function: `${moduleAddr}::${ccipSenderModuleName}::${SENDER_ENTRY_FUNC_NAME}`,
            functionArguments: [
                destChainSelector,
                MoveVector.U8(Hex.hexInputToUint8Array(paddedReceiverArray)),
                MoveVector.U8(Hex.hexInputToUint8Array(messageUint8Array)),
                [ccipBnMTokenAddr],
                MoveVector.U64([TOKEN_AMOUNT_TO_SEND]),
                [TOKEN_STORE_ADDR],
                feeToken,
                feeTokenStore
            ],
        }
    });

    // simulate the transaction to check for errors
    const [userTransactionResponse] = await aptos.transaction.simulate.simple({
        signerPublicKey: account.publicKey,
        transaction,
    });
    
    if(!userTransactionResponse.success) {
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

    console.log(executed);

    if(executed.success === false) {
        throw new Error(`Transaction execution failed: ${executed.vm_status}`);
    }

    console.log("Transaction submitted successfully. Transaction Hash:", executed.hash);
}
 
sendMsgAndTokenFromAptosToEvm()