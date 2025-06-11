import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network, MoveVector, Hex, MoveString } from "@aptos-labs/ts-sdk";
import  * as dotenv from 'dotenv';
dotenv.config();

// Specify which network to connect to via AptosConfig
async function sendMsgAndTokenFromAptosToEvm() {
    // Setup the client
    const config = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(config);

    // Set up the account with the private key
    const privateKeyHex = process.env.PRIVATE_KEY_HEX;
    if (!privateKeyHex) {
        throw new Error("Please set the environment variable PRIVATE_KEY.");
    }
    const privateKey = new Ed25519PrivateKey(privateKeyHex);
    const account = Account.fromPrivateKey({privateKey});
    
    // Set up the transaction parameters, use the sepolia as destination chain as default
    const destChainSelector = process.env.DESTCHAIN_SELECTOR_ETH_SEPOLIA
    const receiver = process.env.RECEIVER
    const feeToken = process.env.FEE_TOKEN
    const feeTokenStore = process.env.FEE_TOKEN_STORE 
    if (!destChainSelector || !receiver || !feeToken || !feeTokenStore) {
        throw new Error("Please set the environment variables DESTCHAIN_SELECTOR, RECEIVER, MESSAGE, FEE_TOKEN, and FEE_TOKEN_STORE.");
    }

    // Set up the CCIP sender module parameters
    const moduleAddr = process.env.STARTER_MODULE_ADDRESS
    const ccipSenderModuleName = process.env.CCIP_SENDER_MODULE_NAME
    const ccipBnMTokenAddr = process.env.CCIP_BNM_TOKEN_ADDR
    if (!moduleAddr || !ccipSenderModuleName || !ccipBnMTokenAddr) {
        throw new Error("Please set the environment variables STARTER_MODULE_ADDRESS, CCIP_SENDER_MODULE_NAME, and CCIP_BNM_TOKEN_ADDR.");
    }

    // set the bnm token config
    const SENDER_ENTRY_FUNC_NAME = "send_message_with_tokens";
    const TOKEN_AMOUNT_TO_SEND = 10000000
    const TOKEN_STORE_ADDR = "0x0"

    // Convert string to array and pad the receiver address to 32 bytes
    const receiverUint8Array = Hex.hexInputToUint8Array(receiver)
    if (receiverUint8Array.length !== 20) {
        throw new Error("EVM receiver address must be 20 bytes.");
    }
    const paddedReceiverArray = new Uint8Array(32);
    paddedReceiverArray.set(receiverUint8Array, 12); 

    // set the message to be sent
    const messageUint8Array = new TextEncoder().encode("hello");

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