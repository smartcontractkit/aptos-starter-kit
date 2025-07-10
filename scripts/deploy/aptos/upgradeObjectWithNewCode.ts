import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import * as fs from "fs";
import * as path from "path";
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { networkConfig } from "../../../helper-config";
import { compilePackage } from "./compilePackage";
import * as dotenv from 'dotenv';

dotenv.config();

const argv = yargs(hideBin(process.argv))
    .option('objectAddress', {
        type: 'string',
        description: 'Specify the address of the object to upgrade',
        demandOption: true,
    })
    .option('packageName', {
        type: 'string',
        description: 'Specify the package name to upgrade',
        demandOption: true,
        choices: [
            networkConfig.aptos.dataFeedDemoModuleName,
            networkConfig.aptos.ccipSenderModuleName
        ],
    }).option("addressName", {
        type: 'string',
        description: 'Specify the address name at which the upgraded package will be published',
        demandOption: true,
        choices: [
            networkConfig.aptos.dataFeedDemoAddressName,
            networkConfig.aptos.ccipSenderAddressName
        ]
    })
    .parseSync();


// --- Configuration ---
// 1. Set up your Aptos client
const network = Network.TESTNET;
const aptosConfig = new AptosConfig({ network });
const aptos = new Aptos(aptosConfig);

// 2. Load your deployer account
const privateKeyHex = process.env.PRIVATE_KEY_HEX;
if (!privateKeyHex) {
    throw new Error("Please set the environment variable PRIVATE_KEY_HEX.");
}
const deployerPrivateKey = new Ed25519PrivateKey(privateKeyHex);
const deployerAccount = Account.fromPrivateKey({ privateKey: deployerPrivateKey });

const OBJECT_TO_UPGRADE = argv.objectAddress; // The address of the object to upgrade

// 3. Define the path to your Move package and the named address
const PACKAGE_PATH = `contracts/${argv.packageName}`; // The path to the package with updated code or the new package you want to publish to the object
const NAMED_ADDRESS = argv.addressName; // The key for the named address in your Move.toml

/**
 * Main function to automate the compilation and upgrade of an Aptos object.
 */
async function upgradeObject() {

    console.log(`--- Starting Object Upgrade Process ---`);
    console.log(`Publisher: ${deployerAccount.accountAddress}`);
    console.log(`Object:    ${OBJECT_TO_UPGRADE}`);
    console.log(`Package:   ${PACKAGE_PATH}`);

    try {

        // 1. Compile the new package with the object's address
        await compilePackage(PACKAGE_PATH, {
            [NAMED_ADDRESS]: OBJECT_TO_UPGRADE,
        });

        // 2. Read the compiled package metadata and all module bytecodes
        const packageName = path.basename(PACKAGE_PATH);
        const buildPath = path.join(PACKAGE_PATH, "build", packageName);
        const metadataPath = path.join(buildPath, "package-metadata.bcs");
        const modulesPath = path.join(buildPath, "bytecode_modules");

        const packageMetadata = fs.readFileSync(metadataPath);
        const moduleFileNames = fs.readdirSync(modulesPath).filter(file => file.endsWith(".mv"));

        if (moduleFileNames.length === 0) {
            throw new Error(`No .mv module files found in ${modulesPath}`);
        }

        const modules = moduleFileNames.map(file => fs.readFileSync(path.join(modulesPath, file)));
        console.log(`\nFound and read ${modules.length} module(s) from ${PACKAGE_PATH}.`);

        // 3. Build the upgrade transaction
        const transaction = await aptos.transaction.build.simple({
            sender: deployerAccount.accountAddress,
            data: {
                function: "0x1::object_code_deployment::upgrade",
                typeArguments: [],
                functionArguments: [
                    packageMetadata,
                    modules,
                    OBJECT_TO_UPGRADE,
                ],
            },
        });
        console.log("\nTransaction built. Simulating...");

        // 4. Simulate the transaction to check for on-chain errors
        const [userTransactionResponse] = await aptos.transaction.simulate.simple({
            signerPublicKey: deployerAccount.publicKey,
            transaction,
        });

        if (!userTransactionResponse.success) {
            throw new Error(`Transaction simulation failed: ${userTransactionResponse.vm_status}`);
        }
        console.log("✅ Simulation successful!");

        // 5. Sign and submit the transaction
        console.log("\nSigning transaction...");
        const senderAuthenticator = aptos.transaction.sign({
            signer: deployerAccount,
            transaction,
        });

        console.log("Submitting transaction...");
        const committedTxn = await aptos.transaction.submit.simple({
            transaction,
            senderAuthenticator,
        });

        console.log("Transaction submitted with hash:", committedTxn.hash);
        await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

        console.log("\n✅ Object successfully upgraded with the new package!");

    } catch (error) {
        console.error("\n❌ Failed to upgrade object:", error);
        process.exit(1);
    }
}

// Run the main function
upgradeObject();