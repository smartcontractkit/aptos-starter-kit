import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import * as dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { networkConfig } from "../../../helper-config";

dotenv.config();

const argv = yargs(hideBin(process.argv))
    .option('to', {
        type: 'string',
        description: 'Specify the Aptos Wallet address to drip the token to',
        demandOption: true,
    })
    .parseSync();

async function dripCCIPBnMToken() {
    // Set up the account with the private key
    const privateKeyHex = process.env.PRIVATE_KEY_HEX;
    if (!privateKeyHex) {
        throw new Error("Please set the environment variable PRIVATE_KEY_HEX.");
    }
    const privateKey = new Ed25519PrivateKey(privateKeyHex);
    const account = Account.fromPrivateKey({ privateKey });

    // Set up Aptos client
    const aptosConfig = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(aptosConfig);

    const ccipBnMFaucetAddress = networkConfig.aptos.ccipBnMFaucetAddress;

    try {
        const transaction = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: `${ccipBnMFaucetAddress}::faucet::drip`,
                functionArguments: [
                    argv.to, // recipient address
                ],
            }
        });

        // Simulate the transaction to check for errors
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

        console.log(`1 CCIP-BnM token is minted to ${account.accountAddress} successfully.\nPlease check the transaction at https://explorer.aptoslabs.com/txn/${executed.hash}?network=testnet`);


    } catch (error) {
        console.error("Error during token drip:", error);
    }
}

dripCCIPBnMToken();