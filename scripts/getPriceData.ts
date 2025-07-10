import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
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

// Interfaces for the PriceData optional type and the PriceData structure
interface PriceData {
  price: string;
  timestamp: string;
}

interface OptionPriceData {
    vec: PriceData[];
}

// Function to call the get_price_data view function
async function getPriceData(): Promise<PriceData | null> {
  try {
    // setup the client
    const config = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(config);

    // Define the module and function details
    const moduleAddr = argv.priceFeedDemo
    const moduleName = networkConfig.aptos.dataFeedDemoModuleName;
    const FUNCTION_NAME = "get_price_data";

    // Account address for which we want to fetch price data
    const PRIVATE_KEY_HEX = process.env.PRIVATE_KEY_HEX;
    if (PRIVATE_KEY_HEX === undefined) {
        throw new Error("PRIVATE_KEY_HEX environment variable is not set.");
    }
    const privateKey = new Ed25519PrivateKey(PRIVATE_KEY_HEX);
    const account = Account.fromPrivateKey({privateKey});

    // Call the view function
    const result = await aptos.view({ 
        payload: {
            function: `${moduleAddr}::${moduleName}::${FUNCTION_NAME}`,
            functionArguments: [account.accountAddress],
            typeArguments: [],
        } 
    });

    // Check if the result is non-empty (i.e., Option<PriceData> is Some)
    if (result.length > 0) {
        const optionData = result[0] as OptionPriceData;
        if(optionData?.vec?.length > 0) {
            const priceData = optionData.vec[0];
            return {
                price: priceData.price,
                timestamp: priceData.timestamp,
            }
        }
    }
    return null; // Return null if Option<PriceData> is None or vec is empty
  } catch (error) {
    console.error("Error calling get_price_data:", error);
    throw error;
  }
}

async function main() {
  try {
    const priceData = await getPriceData();
    if (priceData) {
      console.log(`Price: ${priceData.price}`);
      console.log(`Timestamp: ${priceData.timestamp}`);
    } else {
      console.log("No PriceData found for the given address.");
    }
  } catch (error) {
    console.error("Failed to fetch price data:", error);
  }
}

main();