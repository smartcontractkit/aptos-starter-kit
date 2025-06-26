import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { networkConfig } from "../../helper-config";

const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

const argv = yargs(hideBin(process.argv))
  .option('msgId', {
    type: 'string',
    description: 'Specify the ccip message Id',
    demandOption: true,
  })
  .parseSync();


async function getModuleEvents() {
    // get message Id from user input
    let msgId = argv.msgId;
    if (msgId.length !== 66 || !msgId.startsWith("0x")) {
        throw new Error("Format of message id is incorrect.");
    }

    const ccipRouterModuleAddr = networkConfig.aptos.ccipObjectAddress

  try {
    const events = await aptos.getModuleEventsByEventType({
      eventType: `${ccipRouterModuleAddr}::offramp::ExecutionStateChanged`,
      options: {
        limit: 100, 
        orderBy: [{ transaction_version: "desc" }]
      },
    });
    
    let selectedEvent = events.filter(event => event.data.message_id == msgId);
    let state = selectedEvent[0].data.state
    
    if(state === 0) {
        console.log(`Execution state for ccip message ${msgId} is UNTOUCHED`);
    } else if(state === 2) {
        console.log(`Execution state for ccip message ${msgId} is SUCCESS`);
    }
  } catch (error) {
    console.error("Error fetching module events:", error);
  }
}

getModuleEvents().catch(console.error);