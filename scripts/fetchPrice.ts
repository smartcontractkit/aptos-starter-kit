import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network, Hex, MoveVector } from "@aptos-labs/ts-sdk";
import  * as dotenv from 'dotenv';
dotenv.config();
import { networkConfig } from "../helper-config";
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
    .option('priceFeedDemo', {
        type: 'string',
        description: 'Specify object address of the price feed demo module address',
        demandOption: true,
    })
    .parseSync();

// Function to call the fetch_price entry function
async function fetchPrice(): Promise<string> {
    try {
        // Setup the client
        const config = new AptosConfig({ network: Network.TESTNET });
        const aptos = new Aptos(config);

        // Define the module and function details
        const moduleAddr = argv.priceFeedDemo;
        const dataFeedId = networkConfig.aptos.dataFeedId;
        const moduleName = networkConfig.aptos.dataFeedDemoModuleName;
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
                function: `${moduleAddr}::${moduleName}::${functionName}`,
                functionArguments: [MoveVector.U8(Hex.hexInputToUint8Array(dataFeedId))],
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