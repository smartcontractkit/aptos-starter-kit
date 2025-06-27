import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

async function fetchEventsByTxHash() {
  const config = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(config);

  const txHash = "0xfe9bfc8c1382d9783fd6426a80930a003ee36407b25ee53210e3225760559018";

  let messageId: string;
  try {
    const transaction = await aptos.getTransactionByHash({ transactionHash: txHash });
    if (transaction.type === "user_transaction") {
      let ccipSendEvent = transaction.events.filter(event => event.type.includes("onramp::CCIPMessageSent"));
      console.log("CCIP Send Event:", ccipSendEvent[0].data);
      messageId = ccipSendEvent[0].data.message.header.message_id;
    } else {
      throw new Error("No events found or not a user transaction.");
    }
  } catch (error) {
    throw new Error(`Error fetching transaction events: ${error}`);
  }
  let s: string = messageId;
}

fetchEventsByTxHash();