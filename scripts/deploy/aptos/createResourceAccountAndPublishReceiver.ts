import {
  Aptos,
  AptosConfig,
  Network,
  Account,
  Ed25519PrivateKey,
  AuthenticationKey,
  DeriveScheme,
} from '@aptos-labs/ts-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { TextEncoder } from 'util';
import { compilePackage } from './compilePackage';
import * as dotenv from 'dotenv';

dotenv.config();

// --- Configuration ---
// 1. Set up your Aptos client
const network = Network.TESTNET;
const aptosConfig = new AptosConfig({ network });
const aptos = new Aptos(aptosConfig);

// 2. Load your deployer account
// This account will create the new resource account.
const privateKeyHex = process.env.PRIVATE_KEY_HEX;
if (!privateKeyHex) {
  throw new Error('Please set the environment variable PRIVATE_KEY_HEX.');
}
const deployerPrivateKey = new Ed25519PrivateKey(privateKeyHex);
const deployerAccount = Account.fromPrivateKey({
  privateKey: deployerPrivateKey,
});

// 3. Define the package to be deployed
const PACKAGE_PATH = 'modules/ccip_message_receiver'; // The path to the package you want to deploy
const SEED_PREFIX = 'resource_account_seed_'; // Prefix for the dynamic seed

/**
 * Main function to create a resource account and publish a package to it.
 */
async function createResourceAccountAndPublish() {
  console.log(
    '--- Starting Resource Account Creation & Package Publish Process ---'
  );
  console.log(`Deployer Account: ${deployerAccount.accountAddress}`);
  console.log(`Package Path:     ${PACKAGE_PATH}`);

  try {
    // 1. Generate a dynamic seed
    const seedString = SEED_PREFIX + Date.now().toString();
    const seed = new TextEncoder().encode(seedString);
    console.log(`\nGenerated Seed: "${seedString}"`);

    // 2. Derive the resource account address to know where the package will be published.

    const sourceAddressBytes = deployerAccount.accountAddress.toUint8Array();
    const derivationInput = new Uint8Array([...sourceAddressBytes, ...seed]);
    const resourceAuthKey = AuthenticationKey.fromSchemeAndBytes({
      scheme: DeriveScheme.DeriveResourceAccountAddress,
      input: derivationInput,
    });
    const resourceAccountAddress = resourceAuthKey.derivedAddress();
    console.log(
      `Derived Resource Account Address: ${resourceAccountAddress.toString()}`
    );

    // 3. Compile the package with the correct addresses
    await compilePackage(PACKAGE_PATH, {
      deployer: deployerAccount.accountAddress.toString(),
      receiver: resourceAccountAddress.toString(),
    });

    // 4. Read the compiled package metadata and module bytecodes
    const packageName = path.basename(PACKAGE_PATH);
    const buildPath = path.join(PACKAGE_PATH, 'build', packageName);
    const metadataPath = path.join(buildPath, 'package-metadata.bcs');
    const modulesPath = path.join(buildPath, 'bytecode_modules');

    const packageMetadata = fs.readFileSync(metadataPath);
    const moduleFileNames = fs
      .readdirSync(modulesPath)
      .filter((file) => file.endsWith('.mv'));

    if (moduleFileNames.length === 0) {
      throw new Error(`No .mv module files found in ${modulesPath}`);
    }

    const modules = moduleFileNames.map((file) =>
      fs.readFileSync(path.join(modulesPath, file))
    );
    console.log(
      `\nFound and read ${modules.length} module(s) from ${PACKAGE_PATH}.`
    );

    // 5. Build the transaction to call the all-in-one function.
    // The deployer account is the signer and sender of this transaction.
    console.log(
      '\nBuilding create_resource_account_and_publish_package transaction...'
    );
    const transaction = await aptos.transaction.build.simple({
      sender: deployerAccount.accountAddress,
      data: {
        function:
          '0x1::resource_account::create_resource_account_and_publish_package',
        functionArguments: [seed, packageMetadata, modules],
      },
    });

    // 6. Simulate the transaction.
    // This is now straightforward because the sender and signer are the same.
    console.log('Transaction built. Simulating...');
    const [userTransactionResponse] = await aptos.transaction.simulate.simple({
      signerPublicKey: deployerAccount.publicKey,
      transaction,
    });

    if (!userTransactionResponse.success) {
      throw new Error(
        `Transaction simulation failed: ${userTransactionResponse.vm_status}`
      );
    }
    console.log('✅ Simulation successful!');

    // 7. Sign and submit the transaction
    console.log('\nSigning and submitting transaction...');
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: deployerAccount,
      transaction,
    });

    console.log(`Transaction submitted with hash: ${committedTxn.hash}`);
    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

    console.log(
      '\n✅ Resource account created and package published successfully!'
    );
    console.log(
      `Resource Account Address: ${resourceAccountAddress.toString()}`
    );
  } catch (error) {
    console.error('\n❌ Operation failed:', error);
    process.exit(1);
  }
}

// Run the main function
createResourceAccountAndPublish();
