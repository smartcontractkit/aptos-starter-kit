# Aptos starter kit
> This tutorial represents an educational example to use a Chainlink system, product, or service and is provided to demonstrate how to interact with Chainlink’s systems, products, and services to integrate them into your own. This template is provided “AS IS” and “AS AVAILABLE” without warranties of any kind, it has not been audited, and it may be missing key checks or error handling to make the usage of the system, product or service more clear. Do not use the code in this example in a production environment without completing your own audits and application of best practices. Neither Chainlink Labs, the Chainlink Foundation, nor Chainlink node operators are responsible for unintended outputs that are generated due to errors in code.

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
```shell
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

## Use CCIP to send token and messages from Aptos to EVM
<b>Note: </b>In the below examples, Avalanche Fuji is used as EVM destination chain. 

### Send BnM tokens

Make sure you have BnM and fee tokens in your account.

#### LINK Tokens on Aptos

When using LINK tokens to pay for CCIP fees, you will need LINK tokens on Aptos Testnet. You can run the `aptos2evm/dripLinkToken.ts` script by running the following command from your terminal:

```shell
npx ts-node scripts/aptos2evm/dripLinkToken.ts --to <YOUR_APTOS_WALLET_ADDRESS>
```

You'll receive 1 LINK token in your specified Aptos wallet address.

#### BnM Tokens on Aptos

To obtain CCIP-BnM tokens on Aptos Testnet, you can run the `aptos2evm/dripCCIPBnMToken.ts` script by running the following command from your terminal:

```shell
npx ts-node scripts/aptos2evm/dripCCIPBnMToken.ts --to <YOUR_APTOS_WALLET_ADDRESS>
```

You will receive 1 CCIP-BnM token in your specified Aptos wallet address.


#### Transfer tokens from Aptos Testnet to Avalanche Fuji.

```shell
npx ts-node scripts/aptos2evm/ccipSendTokenRouter.ts --feeToken link --destChain fuji --amount 0.1
``` 

Update the param from `link` to `native` if you want to pay native token (aptos) for CCIP fee. 

```shell
npx ts-node scripts/aptos2evm/ccipSendTokenRouter.ts --feeToken native --destChain fuji --amount 0.1
``` 

### Check the CCIP message status on EVM chain
Set the `AVALANCHE_FUJI_RPC_URL` in `.env` before check the status on Avalanche Fuji. 
```shell
npx ts-node scripts/checkMsgExecutionStateOnEvm.ts --txHash <Tx_Hash> --destChain fuji
```
If you see the message below, you might need to wait more time for CCIP to execute your message on destination chain. Or you wait for too long time that the execution is beyond the latest 500 blocks in destination chain. 
```shell
No messageId found in within the last 500 blocks
```

### Send arbitrary data 
1. Deploy the Receiver contract on Avalanche Fuji. (Source codes of the receiver contract can be found at `scripts/aptos2evm/receiver/Receiver.sol`.)
```shell
npx ts-node scripts/aptos2evm/deployReceiver.ts 
```
2. Set the `RECEIVER` with the contract address returned by this command. 

3. Send an arbitrary data to the receiver using link token as fee token for ccip.
```shell
npx ts-node scripts/aptos2evm/ccipSendMsgRouter.ts --feeToken link --destChain fuji
```
Or use native aptos token as fee token. 
```shell
npx ts-node scripts/aptos2evm/ccipSendMsgRouter.ts --feeToken native --destChain fuji
```
4. check status of CCIP message on evm chains
```shell
npx ts-node scripts/aptos2evm/checkMsgExecutionStateOnEvm.ts --txHash <your tx hash from last step> --destChain fuji
```

### Send BnM token and arbitrary data

1. Send an arbitraty message and token from aptos testnet to Avalanche Fuji.
```shell
npx ts-node scripts/aptos2evm/ccipSendMsgAndTokenRouter.ts --feeToken link --destChain fuji --amount 0.1
```
Or use native aptos token as fee token. 
```shell
npx ts-node scripts/aptos2evm/ccipSendMsgAndTokenRouter.ts --feeToken native --destChain fuji --amount 0.1
```
2. check status of CCIP message on evm chains
```shell
npx ts-node scripts/aptos2evm/checkMsgExecutionStateOnEvm.ts --txHash <your tx hash from last step> --destChain fuji
```

### Send tokens through a ccip sender module
1. Replace the `RECEIVER` in `.env` with an EOA address on Avalanche
2. Send the BnM tokens from aptos testnet to Avalanche Fuji
```shell
npx ts-node scripts/aptos2evm/ccipSendToken.ts --feeToken link --destChain Fuji --amount 0.1
``` 
Update the param from `link` to `native` if you want to pay native token (aptos) for CCIP fee. 
```shell
npx ts-node scripts/aptos2evm/ccipSendToken.ts --feeToken native --destChain Fuji --amount 0.1
``` 
3. check status of CCIP message on evm chains
```shell
npx ts-node scripts/aptos2evm/checkMsgExecutionStateOnEvm.ts --txHash <your tx hash from last step> --destChain fuji
```

### Send arbitraty data through a ccip sender module
1. Replace the `RECEIVER` in `env` with the receiver address deployed in "Send arbitrary data"
2. Send arbitraty data from aptos testnet to Avalanche Fuji
```shell
npx ts-node scripts/aptos2evm/ccipSendMsg.ts --feeToken link --destChain fuji
``` 
Update the param from `link` to `native` if you want to pay native token (aptos) for CCIP fee. 
```shell
npx ts-node scripts/aptos2evm/ccipSendMsg.ts --feeToken native --destChain fuji
``` 
3. check status of CCIP message on Avalanche Fuji
```shell
npx ts-node scripts/aptos2evm/checkMsgExecutionStateOnEvm.ts --txHash <your tx hash from last step> --destChain fuji
```

### Send BnM token and arbitraty data through a ccip sender module
1. Send the BnM tokens and arbitrary data from aptos testnet to Avalanche Fuji
```shell
npx ts-node scripts/aptos2evm/ccipSendMsgAndToken.ts --feeToken link --destChain fuji --amount 0.1
``` 
Update the param from `link` to `native` if you want to pay native token (aptos) for CCIP fee. 
```shell
npx ts-node scripts/aptos2evm/ccipSendMsgAndToken.ts --feeToken native --destChain fuji --amount 0.1
``` 
2. check status of CCIP message on Avalanche Fuji
```shell
npx ts-node scripts/aptos2evm/checkMsgExecutionStateOnEvm.ts --txHash <your tx hash from last step> --destChain fuji
```

## Use CCIP to send token and messages from EVM to Aptos
1. Send tokens from EVM chain to by directly calling router contract

Set the `PRIVATE_KEY` and `AVALANCHE_FUJI_RPC_URL` in `.env`. `PRIVATE_KEY` is your EVM private key corresponding to your EOA and `AVALANCHE_FUJI_RPC_URL` is the RPC URL of Avalanche Fuji network.

### Send BnM tokens

Make sure you have BnM and fee tokens in your account.

### LINK Tokens on EVM Chains

When using LINK tokens to pay for CCIP fees, you will need LINK tokens on Avalanche Fuji. You can use the [Chainlink Faucet](https://faucet.chain.link) to get test LINK tokens.

### BnM Tokens on EVM Chains

To obtain CCIP-BnM tokens on Avalanche Fuji, you can use the [Mint tokens in the documentation](https://docs.chain.link/ccip/test-tokens#mint-tokens-in-the-documentation) section to get test BnM tokens.

#### Transfer tokens from Avalanche Fuji to Aptos Testnet

```shell
npx ts-node scripts/aptos2evm/ccipSendTokenRouter.ts --feeToken link --sourceChain fuji --amount 0.1 --aptosReceiver <your aptos account/resource account address>
``` 

Update the param from `link` to `native` if you want to pay native token (APT) for CCIP fee. 
```shell
npx ts-node scripts/aptos2evm/ccipSendTokenRouter.ts --feeToken native --sourceChain fuji --amount 0.1 --aptosReceiver <your aptos account/resource account address>
``` 

### Check the CCIP message status on Aptos Testnet

> **NOTE**: Since end-to-end transaction time depends primarily on the time to finality on the source blockchain (Avalanche Fuji
  in this case), it's recommended to wait 1-2 minutes before running the script. For more details, refer to the
  [Finality by Blockchain](https://docs.chain.link/ccip/ccip-execution-latency#finality-by-blockchain).

Run the following command command to check the status of the CCIP message on Aptos Testnet:

```shell
npx ts-node scripts/evm2aptos/checkMsgExecutionStateOnAptos.ts --msgId <your ccip message id>
```

You will see `Execution state for ccip message <your ccip message id> is SUCCESS` if the message is executed successfully on Aptos. 

### Send arbitrary data
1. Deploy the Receiver module on Aptos Testnet. (Source codes of the receiver module can be found inside the [`ccip_message_receiver.move`](sources/ccip_message_receiver.move) file.)

> **NOTE**: In this case, the CCIP Receiver module also handles tokens (meaning it can receive tokens from EVM chains and forward the received tokens to another Aptos address). Therefore, it must be deployed under a resource account. A resource account allows the module to generate a signer for its own address on-chain, which is required to authorize the withdrawal or transfer of those assets. Without this signer capability, any tokens the module receives would be locked.

2. Run the following command to create a resource account and publish the module:

```shell
aptos move create-resource-account-and-publish-package --address-name receiver --seed <unique seed corresponding to your aptos account> --named-addresses deployer=<your aptos account address>
```

> **NOTE**: The `--seed` parameter is used to create a resource account. You can use any unique hex string (such as `0x1`, `0x2`, etc.) as the seed, but it must be unique for your account (i.e., you cannot use the same seed for multiple resource accounts under the same account).

3. Now, you can copy the resource account address from the output of the previous command as you need to use that as the value of `--aptosReceiver` parameter in the next step.

4. Send an arbitrary data to the receiver using link token as fee token for ccip.

```shell
npx ts-node scripts/evm2aptos/ccipSendMsgRouter.ts --feeToken link --sourceChain fuji --aptosReceiver <your resource account address> --msgString "Hello Aptos from EVM"
```

Update the param from `link` to `native` if you want to pay native token (APT) for CCIP fee. 

```shell
npx ts-node scripts/evm2aptos/ccipSendMsgRouter.ts --feeToken native --sourceChain fuji --aptosReceiver <your resource account address> --msgString "Hello Aptos from EVM"
```

### Send BnM token and arbitrary data

In this case, the BnM token and arbitrary data are sent to the same receiver module deployed in the previous step. Instead of arbitrary data, the data should be another Aptos account address to which the received BnM token will be forwarded.

Run the following command:

```shell
npx ts-node scripts/evm2aptos/ccipTokenForwarder.ts --feeToken link --sourceChain fuji --aptosReceiver <your resource account address> --aptosAccount <your another aptos account / final recipient of the token> --amount 0.1 
```

Update the param from `link` to `native` if you want to pay native token (APT) for CCIP fee. 

```shell
npx ts-node scripts/evm2aptos/ccipTokenForwarder.ts --feeToken native --sourceChain fuji --aptosReceiver <your resource account address> --aptosAccount <your another aptos account / final recipient of the token> --amount 0.1 
```
 
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