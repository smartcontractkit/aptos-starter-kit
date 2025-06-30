import { Aptos } from "@aptos-labs/ts-sdk";

export async function fetchEventsByTxHash(txHash: string, aptos: Aptos) {
  let messageId: string;
  try {
    const transaction = await aptos.getTransactionByHash({ transactionHash: txHash });
    if (transaction.type === "user_transaction") {
      let ccipSendEvent = transaction.events.filter(event => event.type.includes("onramp::CCIPMessageSent"));
      messageId = ccipSendEvent[0].data.message.header.message_id;
    } else {
      throw new Error("No events found or not a user transaction.");
    }
  } catch (error) {
    throw new Error(`Error fetching transaction events: ${error}`);
  }
  return messageId
}

const GENERIC_EXTRA_ARGS_V2_TAG: number[] = [0x18, 0x1d, 0xcf, 0x10];

export function encodeGenericExtraArgsV2(gasLimit: bigint, allowOutOfOrderExecution: boolean): Uint8Array {
    // Initialize an empty array to store the encoded bytes
    let extraArgs: number[] = [];

    // Append the GENERIC_EXTRA_ARGS_V2_TAG (assuming it's a predefined constant)
    extraArgs.push(...GENERIC_EXTRA_ARGS_V2_TAG);

    // Encode gasLimit (u256) as bytes
    // Note: BigInt to bytes conversion might require a library or custom implementation
    const gasLimitBytes = bigIntToBytes(gasLimit);
    extraArgs.push(...gasLimitBytes);

    // Encode allowOutOfOrderExecution (boolean) as bytes
    const boolBytes = [allowOutOfOrderExecution ? 1 : 0];
    extraArgs.push(...boolBytes);

    // Convert the array to Uint8Array and return
    return new Uint8Array(extraArgs);
}

// Function to parse amount to U64 with decimals
export function parseAmountToU64Decimals(amount: number | string, decimals: number = 8): bigint {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return BigInt(Math.round(value * 10 ** decimals));
}

// Helper function to convert BigInt to bytes
function bigIntToBytes(value: bigint): number[] {
    // Assuming little-endian encoding for u256 (32 bytes)
    const bytes = new Array<number>(32).fill(0);
    let val = value;
    for (let i = 0; i < 32 && val > 0; i++) {
        bytes[i] = Number(val & BigInt(0xff));
        val >>= BigInt(8);
    }
    return bytes;
}