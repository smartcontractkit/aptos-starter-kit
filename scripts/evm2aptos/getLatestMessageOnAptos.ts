import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { networkConfig } from "../../helper-config";

const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

const argv = yargs(hideBin(process.argv))
    .option('aptosReceiver', {
        type: 'string',
        description: 'Specify the Aptos Receiver Address',
        demandOption: true,
    })
    .parseSync();


async function getModuleEvents() {

    try {

        const ccipRouterModuleAddr = networkConfig.aptos.ccipObjectAddress

        const events = await aptos.getAccountEventsByEventType({
            accountAddress: argv.aptosReceiver,
            eventType: `${argv.aptosReceiver}::ccip_message_receiver::ReceivedMessage`,
            options: {
                limit: 100,
                orderBy: [{ transaction_version: "desc" }]
            },
        });

        if (!events.length) {
            console.log("No messages received yet. If you've already sent a CCIP message, please wait for the transaction to be processed.");
        }

        else {
            console.log(`Latest message received on Aptos by ${argv.aptosReceiver}: ${events[0].data.message}`);
        }
    } catch (error) {
        console.error("Error fetching module events:", error);
    }
}

getModuleEvents().catch(console.error);