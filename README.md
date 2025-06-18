# Aptos starter kit

## prerequisites
1. Install [Aptos CLI](https://aptos.dev/en/build/cli)<br>
2. Config an account on Aptos testnet
Clone the repo
```shell
clone https://github.com/smartcontractkit/aptos-starter-kit.git &
cd aptos-starter-kit
```
Generate an account on Aptos
```shell
aptos init --network testnet --assume-yes
```
Get test tokens for the account from the [official faucet](https://aptos.dev/en/network/faucet). 

Set the `sender` and `owner` as your generated `account` in the file `~/Move.toml`. The account address can be found in `~/.aptos/config.yaml`
```toml
...
[addresses]
sender = "<replace sender with your account address>"
owner = "<replace sender with your account address>"
...
```

## Publish the module on Aptos testnet
<b>Publish the module with command</b>
```shell
aptos move publish --skip-fetch-latest-git-deps
```
With the command, you will see information like below in terminal:
```
Transaction submitted: https://explorer.aptoslabs.com/txn/0x5ac473255ca8e7865d5b620f46e1c21e7fbe413c882bf90254a4f02c7554e86b?network=testnet
{
  "Result": {
    "transaction_hash": "0x5ac473255ca8e7865d5b620f46e1c21e7fbe413c882bf90254a4f02c7554e86b",
    "gas_used": 1142,
    "gas_unit_price": 100,
    "sender": "9c57740685301c316158afd34608cf8286b869ce164301f4903180cc52605ad9",
    "sequence_number": 2,
    "success": true,
    "timestamp_us": 1749639336582974,
    "version": 6782783566,
    "vm_status": "Executed successfully"
  }
}
```
You successfully published the module on the aptos testnet and the module is saved under your account now. The address of the module is the same as your account address. 

## Install dependencies and set config in `.env`
1. Run `npm install` to install dependencies.

2. Rename `.env.example` to `.env`.

3. Set `PRIVATE_KEY_HEX`, `STARTER_MODULE_ADDRESS` and `RECEIVER` in `.env`.
```
PRIVATE_KEY_HEX=<YOUR_PRIVATE_KEY_HEX>
DATA_FEED_DEMO_MODULE_ADDRESS=<YOUR_ACCOUNT_ADDRESS>
RECEIVER=<YOUR_EVM_ADDRESS>
```
`PRIVATE_KEY_HEX` and `STARTER_MODULE_ADDRESS` can be found in `~/.aptos/config.yaml` and remove the prefix `ed25519-priv-` before private key. 

`RECEIVER` is EVM address that is used to receive the token and messages from Aptos. The address is used for CCIP and you can skip this config if you only want to use data feed. 

## Use CCIP to send token from Aptos testnet to Ethereum Sepolia
1. Send tokens from Aptos testnet to Ethereum Sepolia with CCIP sender by directly calling router module. 
```
npx ts-node scripts/ccipSendTokenRouter.ts --feeToken link
``` 
Update the param from `link` to `native` if you want to pay native token (aptos) for CCIP fee. 
```
npx ts-node scripts/ccipSendTokenRouter.ts --feeToken native
``` 
Please make sure you have BnM and fee tokens in your account before running this command.
2. Send tokens from Aptos testnet to Ethereum Sepolia with CCIP sender with ccip sender module. 
```
npx ts-node scripts/ccipSendToken.ts --feeToken link
``` 
Update the param from `link` to `native` if you want to pay native token (aptos) for CCIP fee. 
```
npx ts-node scripts/ccipSendToken.ts --feeToken native
``` 
Please make sure you have BnM and fee tokens in your account before running this command.

3. Check the status on Sepolia

Set the `ETHEREUM_SEPOLIA_RPC_URL` in `.env` before check the status on ethereum sepolia. 

A transaction hash is returned in when the CCIP message is sent successfully. Run the command with transaction hash:
```
npx ts-node scripts/checkMsgExecutionStateOnSepolia.ts --txHash <Your Transaction Hash from last step>
```
If you see the message below, you might need to wait more time for CCIP to execute your message on destination chain. Or you wait for too long time that the execution is beyond the latest 500 blocks in destination chain. 
```
No messageId found in within the last 500 blocks
```
## Use CCIP to send token from Ethereum Sepolia to Aptos testnet
1. Send tokens from Ethereum Sepolia to by directly calling router contract

Set the `PRIVATE_KEY` and `APTOS_RECEIVER` in `.env`. `PRIVATE_KEY` is your EVM private key. `APTOS_RECEIVER` is the account address to receive the tokens from eth sepolia. 

Run command to send ccip message paying sepoliaETH
```
npx ts-node scripts/sepolia-aptos/transferTokenPayNative.ts
```
2. Check the status of CCIP message on Aptos testnet

Run command to check the event
```
npx ts-node scripts/sepolia-aptos/checkExecutionStateOnAptos.ts --msgId <your ccip message id>
```
you will see `Execution state for ccip message <your ccip message id> is SUCCESS` if the message is executed successfully on aptos. 
run 
## Use data feed on aptos testnet
1. Fetch the BTC/USD feed and save it to the account's global storage.
```shell
npx ts-node scripts/fetchPrice.ts
```
You will see infomation like below if the script runs successfully:
```
Transaction submitted successfully. Transaction Hash: 0x3aeb1cf2cebafcba9b6a7322c3209c4b2c41a3b48ab8c58b03d93f3d6093764a
```
Price you just fetch is Bitcoin price to module `price_feed_demo`. Update `DATA_FEED_ID` if other asset price needs to be fetched. Please find other data feeds supported by Chainlink [here](https://docs.chain.link/data-feeds/price-feeds/addresses?page=1&testnetPage=1&network=aptos). 

2. Retrieve this data using the view function.
```shell
npx ts-node scripts/getPriceData.ts
```
You will see information like below if the script runs successfully:
```
Price: 109255000000000000000000
Timestamp: 1749642370
```