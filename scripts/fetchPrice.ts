import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network, Hex, MoveVector } from "@aptos-labs/ts-sdk";
import  * as dotenv from 'dotenv';
dotenv.config();

// Function to call the fetch_price entry function
async function fetchPrice(): Promise<string> {
    try {
        // Setup the client
        const config = new AptosConfig({ network: Network.TESTNET });
        const aptos = new Aptos(config);

        // Define the module and function details
        const MODULE_ADDRESS = process.env.DATA_FEED_DEMO_MODULE_ADDRESS;
        const DATA_FEED_ID = process.env.DATA_FEED_ID;
        if(MODULE_ADDRESS === undefined || DATA_FEED_ID === undefined) {
            throw new Error("DATA_FEED_DEMO_MODULE_ADDRESS or DATA_FEED_BTC environment variables are not set.");
        }
        const moduleName = "price_feed_demo";
        const functionName = "fetch_price";

        // Account address for which we want to fetch price data
        const PRIVATE_KEY_HEX = process.env.PRIVATE_KEY_HEX;
        if (!PRIVATE_KEY_HEX) {
            throw new Error("PRIVATE_KEY_HEX environment variable is not set.");
        }
        const privateKey = new Ed25519PrivateKey(PRIVATE_KEY_HEX);
        const account = Account.fromPrivateKey({privateKey});

        // Construct the transaction to call the fetch_price entry function
        const transaction = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: `${MODULE_ADDRESS}::${moduleName}::${functionName}`,
                functionArguments: [MoveVector.U8(Hex.hexInputToUint8Array(DATA_FEED_ID))],
            }
        });

        // // simulate the transaction to get the user transaction response
        // const [userTransactionResponse] = await aptos.transaction.simulate.simple({
        //     signerPublicKey: account.publicKey,
        //     transaction,
        // });

        // Sign the transaction
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

        return committedTransaction.hash;
    } catch (error) {
        throw error instanceof Error ? error : new Error(String(error));
    }
}

async function main() {
    try {
        const txHash = await fetchPrice();
        console.log("Transaction submitted successfully. Transaction Hash:", txHash);
    } catch (error) {
        console.error("Error fetching price:", error);
    }
}

main()