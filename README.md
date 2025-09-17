# Aptos Starter Kit

A starter kit for working with Chainlink Data Feeds and CCIP.

## Repo structure

There are 2 main folders in the repo: modules and scripts.

In folder modules, there are 3 aptos projects to publish the modules that are used for Chainlink products on Aptos. Chainlink Price Feed products related modules are saved in `price_feed_demo`. `ccip_message_receiver`, `ccip_message_sender` are used to publish receiver and sender modules on Aptos network.

In folder scripts, there are ts scripts to do the following tasks:

- Transfer message, token and PTT from Aptos -> EVM using Chainlink router
- Transfer message, token and PTT from Aptos -> EVM using custom router
- Transfer message, token and PTT from EVM -> Aptos using Chainlink router

## Prerequisites

1. Install [Aptos CLI](https://aptos.dev/en/build/cli)

   > **NOTE**: If you have an existing installation of the Aptos CLI, make sure to update it to the latest version to avoid compatibility issues.

2. Clone the repo:

   ```shell
   git clone https://github.com/smartcontractkit/aptos-starter-kit.git
   ```

3. Navigate to the directory:

   ```shell
   cd aptos-starter-kit
   ```

4. Install dependencies:

   ```shell
   npm install
   ```

5. Generate an account on Aptos Testnet:

   ```shell
   aptos init --network testnet
   ```

   This command will guide you through creating a new account for Testnet and will save the credentials in a `.aptos/config.yaml` file in this project's root. If you don't have a private key already just hit enter and the CLI will auto generate one. This command also configures your Aptos CLI to use Testnet.

   You will be given the option to fund your account. You can do so now, or do it later as per this README.

   Next, verify your current configuration with:

   ```shell
   aptos config show-profiles
   ```

   This should show your `default` profile configured for Testnet, with the `network` set to `Testnet`. This information is taken from the `.aptos/config.yaml` file.

   **Example output:**

   ```text
   $ aptos config show-profiles

   {
     "Result": {
       "default": {
         "network": "Testnet",
         "has_private_key": true,
         "public_key": "ed25519-pub-0x2ecdd2d7bc0cbfe2e44c219ef9a9fddc986b384f4a01fb5d821cf0dab5d2fbae",
         "account": "d0e227835c33932721d54ae401cfaae753c295024fe454aa029b5e2782d2fad4",
         "rest_url": "https://fullnode.testnet.aptoslabs.com"
       }
     }
   }
   ```

   > **Note**: For a browser-based extension wallet (similar to MetaMask for EVM-based chains), you can install [Petra
   > Wallet](https://petra.app/) for Aptos. You can [import your account using your private
   > key](https://petra.app/docs/use#import-an-existing-account), which you can find as the `private_key` value in the
   > `default` profile under the `profiles` section of the `.aptos/config.yaml` file generated above.

6. You can use the official [Aptos Testnet Faucet](https://aptos.dev/en/network/faucet) to get **APT** tokens. Simply enter your Aptos account address and click on **Mint** to request tokens. Once you've minted it you can check your account balance with `aptos account balance ` which should produce output in your terminal that confirms the default number of tokens is provided:

```
{
  "Result": [
    {
      "asset_type": "coin",
      "coin_type": "0x1::aptos_coin::AptosCoin",
      "balance": 100000000
    }
  ]
}
```

## Environment Configuration (`.env` file)

The starter kit uses a `.env` file to manage sensitive information like private keys and RPC URLs. Create a new file named `.env` in the root of the `aptos-starter-kit` directory by copying the example file:

```shell
cp .env.example .env
```

Next, open the `.env` file and fill in the following values:

- `PRIVATE_KEY_HEX`: The private key of your wallet (EOA) on Aptos Testnet from which you're sending CCIP-BnM tokens from Aptos to EVM. You can find this in the `.aptos/config.yaml` file created by the `aptos init --network testnet` command above.
- `PRIVATE_KEY`: The private key of your wallet (EOA) on Ethereum Sepolia from which you're sending CCIP-BnM tokens from EVM to Aptos. You can export your private key from your MetaMask Wallet, as shown in the [official MetaMask guide](https://support.metamask.io/configure/accounts/how-to-export-an-accounts-private-key/).
- `ETHEREUM_SEPOLIA_RPC_URL`: The RPC endpoint for the Ethereum Sepolia testnet. You can obtain an RPC URL by signing up for a personal endpoint from [Alchemy](https://www.alchemy.com/), [Infura](https://www.infura.io/), or another node provider service.

## Publish the modules on Aptos Testnet

### Publish the `price_feed_demo` module

The `price_feed_demo` module is used to fetch and store data feed prices on Aptos Testnet. It allows you to interact with Chainlink Data Feeds.

Publish the `price_feed_demo` module to an Aptos Object by running the following command:

```shell
npx ts-node scripts/deploy/aptos/createObjectAndPublishPackage.ts --packageName price_feed_demo --addressName price_feed
```

> This command will create a new Aptos Object and publish the `price_feed_demo` module to it. The `packageName` parameter specifies the name of the package containing the `price_feed_demo` module, and the `addressName` parameter is the address alias for an on-chain address (in this case, the object address).

Note down the address of the object at which the `price_feed_demo` module is published, as you will need it to interact with the module later.

### Publish the `ccip_message_sender` module

The `ccip_message_sender` module is used to send messages and tokens from Aptos to EVM chains. It is a CCIP sender module that can send arbitrary data and tokens to EVM chains.

Publish the `ccip_message_sender` module to an Aptos Object by running the following command:

```shell
npx ts-node scripts/deploy/aptos/createObjectAndPublishPackage.ts --packageName ccip_message_sender --addressName sender
```

> This command will create a new Aptos Object and publish the `ccip_message_sender` module to it. The `packageName` parameter specifies the name of the package containing the `ccip_message_sender` module, and the `addressName` parameter is the address alias for an on-chain address (in this case, the object address).

Note down the address of the object at which the `ccip_message_sender` module is published, as you will need it to interact with the module later.

### Publish the `ccip_message_receiver` module

The `ccip_message_receiver` module is used to receive messages and tokens from EVM chains. It is a CCIP receiver module that can receive arbitrary data and tokens from EVM chains.

Publish the `ccip_message_receiver` module to a resource account by running the following command:

```shell
npx ts-node scripts/deploy/aptos/createResourceAccountAndPublishReceiver.ts
```

> This command will create a new resource account and publish the `ccip_message_receiver` module to it. The resource account is used to handle tokens received from EVM chains, allowing the module to generate a signer for its own address on-chain, which is required to authorize the withdrawal or transfer of those assets.

Note down the address of the resource account at which the `ccip_message_receiver` module is published, as you will need it to interact with the module later.

## Use CCIP to send token and messages from Aptos to EVM

> **Note**: In the examples below, Aptos Testnet is used as the source chain (Aptos), and Ethereum Sepolia is used as the destination chain (EVM).

### Send BnM tokens using `ccip_router::router` module

Make sure you have BnM and fee tokens in your account.

#### BnM Tokens on Aptos

To acquire CCIP-BnM tokens on the Aptos Testnet, execute the following command:

```shell
npx ts-node scripts/faucets/aptos/dripCCIPBnMToken.ts --to <your aptos account address>
```

This script, `dripCCIPBnMToken.ts`, mints 1 CCIP-BnM token to the specified Aptos account address.

#### Transfer tokens from Aptos Testnet to Ethereum Sepolia

Transfer tokens from Aptos Testnet to Ethereum Sepolia by directly interacting with the `ccip_router::router` module. As a quickstart you can use your EOA (wallet address) on Ethereum Sepolia. If you have [deployed a CCIP Receiver to the EVM](https://docs.chain.link/ccip/getting-started/evm#receiver-code) then you can give that address.

```shell
npx ts-node scripts/aptos2evm/ccipSendTokenRouter.ts --feeToken link --destChain sepolia --amount 0.1 --evmReceiver <your eoa / reciever contract address on sepolia>
```

Update the `--feeToken` param from `link` to `native` if you want to pay native Aptos token (APT) for CCIP fee.

```shell
npx ts-node scripts/aptos2evm/ccipSendTokenRouter.ts --feeToken native --destChain sepolia --amount 0.1 --evmReceiver <your eoa / reciever contract address on sepolia>
```

### Check the CCIP message status on EVM chain

#### Use the CCIP Explorer to check the message status

Use the CCIP Explorer URL provided in the output to track your message status across chains. The explorer gives an overview of the entire cross-chain transaction life cycle.

```text
🔗 CCIP Explorer URL: https://ccip.chain.link/#/side-drawer/msg/<your ccip message id>
```

#### Programmatically check the message status

```shell
npx ts-node scripts/aptos2evm/checkMsgExecutionStateOnEvm.ts --msgId <your ccip message id> --destChain sepolia
```

> **Note**: Since end-to-end transaction time depends primarily on the time to finality on the source blockchain (Aptos Testnet in this case), it's recommended to wait 20-30 seconds before running the script. For more details, refer to the [Finality by Blockchain](https://docs.chain.link/ccip/ccip-execution-latency#finality-by-blockchain) section in the CCIP documentation.

If you see the message below, it means you may need to wait longer for CCIP to execute your message on the destination chain. Alternatively, you may have waited too long, and the execution is now beyond the latest 500 blocks on the destination chain.

```shell
No ExecutionStateChanged event found in within the last 500 blocks
```

### Withdraw tokens from the Receiver contract

> **Note**: If you are using EOA as receiver, the token will directly be deposited to your EOA. You do not need to run the command to withdraw tokens.

> **Note**: The command only works if the receiver contract deployed on EVM chain has the function withdraw. Please check the sample contract [here](/scripts/aptos2evm/receiver/Receiver.sol). You will deploy the contract later.

If you have sent CCIP-BnM tokens to a Receiver contract on Ethereum Sepolia, you can withdraw the tokens from the Receiver contract to your EVM address by running the following command:

```shell
npx ts-node scripts/withdrawTokensFromReceiver.ts --network sepolia --receiver <your receiver contract address on sepolia> --to <your eoa address on sepolia>
```

### Send arbitrary data using `ccip_router::router` module

1. Deploy the Receiver contract on Ethereum Sepolia.

   > Source code of the Receiver contract can be found inside the [`Receiver.sol`](scripts/aptos2evm/receiver/Receiver.sol) file.

   ```shell
   npx ts-node scripts/deploy/evm/deployReceiver.ts --evmChain sepolia
   ```

2. You can copy the deployed contract address from the output of the previous command as you need to use that as the value of `--evmReceiver` parameter in the next step.

3. Send arbitrary data to the receiver using LINK token as the fee token for CCIP.

   ```shell
   npx ts-node scripts/aptos2evm/ccipSendMsgRouter.ts --feeToken link --destChain sepolia --msgString "Hello EVM from Aptos" --evmReceiver <your receiver contract address on sepolia>
   ```

   Update the param from `link` to `native` if you want to pay native Aptos token (APT) for CCIP fee.

   ```shell
   npx ts-node scripts/aptos2evm/ccipSendMsgRouter.ts --feeToken native --destChain sepolia --msgString "Hello EVM from Aptos" --evmReceiver <your receiver contract address on sepolia>
   ```

### Send BnM tokens and arbitrary data using `ccip_router::router` module

```shell
npx ts-node scripts/aptos2evm/ccipSendMsgAndTokenRouter.ts --feeToken link --destChain sepolia --amount 0.1 --msgString "Hello EVM from Aptos" --evmReceiver <your receiver contract address on sepolia>
```

Update the param from `link` to `native` if you want to pay native Aptos token (APT) for CCIP fee.

```shell
npx ts-node scripts/aptos2evm/ccipSendMsgAndTokenRouter.ts --feeToken native --destChain sepolia --amount 0.1 --msgString "Hello EVM from Aptos" --evmReceiver <your receiver contract address on sepolia>
```

### Send BnM tokens using `ccip_message_sender` module

1. Now, you need to use the `ccip_message_sender` module that you published in the previous steps.

2. Send BnM tokens from Aptos Testnet to Ethereum Sepolia.

   ```shell
   npx ts-node scripts/aptos2evm/ccipSendToken.ts --feeToken link --destChain sepolia --amount 0.1 --aptosSender <your ccip_message_sender module address> --evmReceiver <your eoa / receiver contract address on sepolia>
   ```

   Update the param from `link` to `native` if you want to pay native Aptos token (APT) for CCIP fee.

   ```shell
   npx ts-node scripts/aptos2evm/ccipSendToken.ts --feeToken native --destChain sepolia --amount 0.1 --aptosSender <your ccip_message_sender module address> --evmReceiver <your eoa / receiver contract address on sepolia>
   ```

### Send arbitraty data using `ccip_message_sender` module

1. Now, you need to use the `ccip_message_sender` module and the `receiver` contract that you published and deployed in the previous steps.

2. Send arbitraty data from Aptos Testnet to Ethereum Sepolia.

   ```shell
   npx ts-node scripts/aptos2evm/ccipSendMsg.ts --feeToken link --destChain sepolia --msgString "Hello EVM from Aptos" --aptosSender <your ccip_message_sender module address> --evmReceiver <your receiver contract address on sepolia>
   ```

   Update the param from `link` to `native` if you want to pay native Aptos token (APT) for CCIP fee.

   ```shell
   npx ts-node scripts/aptos2evm/ccipSendMsg.ts --feeToken native --destChain sepolia --msgString "Hello EVM from Aptos" --aptosSender <your ccip_message_sender module address> --evmReceiver <your receiver contract address on sepolia>
   ```

### Send BnM tokens and arbitraty data using `ccip_message_sender` module

1. Now, you need to use the `ccip_message_sender` module and the `receiver` contract that you published and deployed in the previous steps.

2. Send BnM tokens and arbitraty data from Aptos Testnet to Ethereum Sepolia.

   ```shell
   npx ts-node scripts/aptos2evm/ccipSendMsgAndToken.ts --feeToken link --destChain sepolia --amount 0.1 --msgString "Hello EVM from Aptos" --aptosSender <your ccip_message_sender module address> --evmReceiver <your receiver contract address on sepolia>
   ```

   Update the param from `link` to `native` if you want to pay native Aptos token (APT) for CCIP fee.

   ```shell
   npx ts-node scripts/aptos2evm/ccipSendMsgAndToken.ts --feeToken native --destChain sepolia --amount 0.1 --msgString "Hello EVM from Aptos" --aptosSender <your ccip_message_sender module address> --evmReceiver <your receiver contract address on sepolia>
   ```

## Use CCIP to send token and messages from EVM to Aptos

> **Note**: In the examples below, Ethereum Sepolia is used as the source chain (EVM), and Aptos Testnet is used as the destination chain (Aptos).

### Send BnM tokens using Router contract

Make sure you have BnM and fee tokens in your account.

#### LINK Tokens on EVM Chains

When using LINK tokens to pay for CCIP fees, you will need LINK tokens on Ethereum Sepolia. You can use the [Chainlink Faucet](https://faucet.chain.link) to get test LINK tokens.

#### BnM Tokens on EVM Chains

To obtain CCIP-BnM tokens on Ethereum Sepolia, you can use the [Mint tokens in the documentation](https://docs.chain.link/ccip/test-tokens#mint-tokens-in-the-documentation) section to get test BnM tokens.

#### Transfer tokens from Ethereum Sepolia to Aptos Testnet

Transfer tokens from Ethereum Sepolia to Aptos Testnet by directly interacting with the `Router` contract.

```shell
npx ts-node scripts/evm2aptos/ccipSendTokenRouter.ts --feeToken link --sourceChain sepolia --amount 0.1 --aptosReceiver <your aptos account/resource account address>
```

Update the param from `link` to `native` if you want to pay native Aptos token (APT) for CCIP fee.

```shell
npx ts-node scripts/evm2aptos/ccipSendTokenRouter.ts --feeToken native --sourceChain sepolia --amount 0.1 --aptosReceiver <your aptos account/resource account address>
```

### Check the CCIP message status on Aptos Testnet

> **NOTE**: Since end-to-end transaction time depends primarily on the time to finality on the source blockchain (Ethereum Sepolia in this case), it's recommended to wait 1-2 minutes before running the script. For more details, refer to the [Finality by Blockchain](https://docs.chain.link/ccip/ccip-execution-latency#finality-by-blockchain).

Run the following command command to check the status of the CCIP message on Aptos Testnet:

```shell
npx ts-node scripts/evm2aptos/checkMsgExecutionStateOnAptos.ts --msgId <your ccip message id>
```

You will see `Execution state for CCIP message <your ccip message id> is SUCCESS` if the message has been executed successfully on Aptos.

### Withdraw tokens from the Receiver module

If you have sent CCIP-BnM tokens to a Receiver module on Aptos Testnet, you can withdraw the tokens from the Receiver module to your Aptos account address by running the following command:

```shell
npx ts-node scripts/withdrawTokensFromReceiver.ts --network aptosTestnet --receiver <your receiver module address on aptos> --to <your eoa / account address on aptos>
```

### Send arbitrary data using Router contract

Send an arbitrary data to the receiver using link token as fee token for ccip.

```shell
npx ts-node scripts/evm2aptos/ccipSendMsgRouter.ts --feeToken link --sourceChain sepolia --aptosReceiver <your resource account address> --msgString "Hello Aptos from EVM"
```

Update the param from `link` to `native` if you want to pay native Aptos token (APT) for CCIP fee.

```shell
npx ts-node scripts/evm2aptos/ccipSendMsgRouter.ts --feeToken native --sourceChain sepolia --aptosReceiver <your resource account address> --msgString "Hello Aptos from EVM"
```

### Check the latest message received on Aptos

Run the following command to check the latest message received on Aptos:

```shell
npx ts-node scripts/evm2aptos/getLatestMessageOnAptos.ts --aptosReceiver <your resource account address>
```

> **Manually checking the latest message**: To manually check the latest message received on Aptos, search for your resource account address in the [Aptos Testnet Explorer](https://explorer.aptoslabs.com/?network=testnet). In the `Transactions` tab, find the latest transaction with the `offramp::execute` function call. Click on the transaction to view its details, then navigate to the `Events` tab. You will see an event with the `Type` as `<your resource account address>::ccip_message_receiver::ReceivedMessage` and `Data` as `{ "message": <your message string> }`. The structure of the event will look like this:

```text
Account Address: 0xa20dd.........59aa
Creation Number: 2
Sequence Number: 0
Type: 0xa20dd.........59aa::ccip_message_receiver::ReceivedMessage
Data: {
    message: "Hello Aptos from EVM"
}
```

### Send BnM tokens and arbitrary data using Router contract

In this case, the BnM tokens and arbitrary data are sent to the same receiver module deployed in the previous step. Instead of arbitrary data, the data should be another Aptos account address to which the received BnM tokens will be forwarded.

Run the following command:

```shell
npx ts-node scripts/evm2aptos/ccipTokenForwarder.ts --feeToken link --sourceChain sepolia --aptosReceiver <your resource account address> --aptosAccount <your another aptos account / final recipient of the token> --amount 0.1
```

Update the param from `link` to `native` if you want to pay native Aptos token (APT) for CCIP fee.

```shell
npx ts-node scripts/evm2aptos/ccipTokenForwarder.ts --feeToken native --sourceChain sepolia --aptosReceiver <your resource account address> --aptosAccount <your another aptos account / final recipient of the token> --amount 0.1
```

> To check the emitted event, search for your resource account address in the [Aptos Testnet Explorer](https://explorer.aptoslabs.com/?network=testnet). In the `Transactions` tab, find the latest transaction with the `offramp::execute` function call. Click on the transaction to view its details, then navigate to the `Events` tab. You will see an event with the `Type` as `<your resource account address>::ccip_message_receiver::ForwardedTokens` and `Data` as `{ "final_recipient": <your another aptos account / final recipient of the token> }`. The structure of the event will look like this:

```text
Account Address: 0xa20dd.........59aa
Creation Number: 3
Sequence Number: 0
Type: 0xa20dd.........59aa::ccip_message_receiver::ForwardedTokens
Data: {
  final_recipient: "0x8b92.........035b2"
}
```

## Use Data Feed on Aptos Testnet

1. Fetch the BTC/USD feed and save it to the account's global storage.

   ```shell
   npx ts-node scripts/fetchPrice.ts --priceFeedDemo <price_feed_demo module object address>
   ```

   You will see infomation like below if the script runs successfully:

   ```text
   Transaction submitted successfully. Transaction Hash: 0x3aeb1cf2cebafcba9b6a7322c3209c4b2c41a3b48ab8c58b03d93f3d6093764a
   ```

   Price you just fetch is Bitcoin price to module `price_feed_demo`. Update `DATA_FEED_ID` if other asset price needs to be fetched. Please find other data feeds supported by Chainlink [here](https://docs.chain.link/data-feeds/price-feeds/addresses?page=1&testnetPage=1&network=aptos).

2. Retrieve this data using the view function.

   ```shell
   npx ts-node scripts/getPriceData.ts --priceFeedDemo <price_feed_demo module object address>
   ```

   You will see information like below if the script runs successfully:

   ```text
   Price: 109255000000000000000000
   Timestamp: 1749642370
   ```

## Upgrade the `price_feed_demo` or the `ccip_message_sender` module

> **What does "upgrade" mean?**  
> Upgrading an Aptos object module allows you to redeploy the module code to the same object address, replacing the previous version. This process updates the logic of the module while preserving the existing on-chain state and data associated with the object.

Since the `price_feed_demo` and `ccip_message_sender` modules are published to objects, you can upgrade them (for example, by adding new modules or modifying existing code) using the following command:

#### Upgrade the `price_feed_demo` module:

```shell
npx ts-node scripts/deploy/aptos/upgradeObjectWithNewCode.ts --objectAddress <object address having the price_feed_demo module> --packageName price_feed_demo --addressName price_feed
```

#### Upgrade the `ccip_message_sender` module:

```shell
npx ts-node scripts/deploy/aptos/upgradeObjectWithNewCode.ts --objectAddress <object address having the ccip_message_sender module> --packageName ccip_message_sender --addressName sender


## DISCLAIMER
This tutorial represents an educational example to use a Chainlink system, product, or service and is provided to demonstrate how to interact with Chainlink’s systems, products, and services to integrate them into your own. This template is provided “AS IS” and “AS AVAILABLE” without warranties of any kind, it has not been audited, and it may be missing key checks or error handling to make the usage of the system, product or service more clear. Do not use the code in this example in a production environment without completing your own audits and application of best practices. Neither Chainlink Labs, the Chainlink Foundation, nor Chainlink node operators are responsible for unintended outputs that are generated due to errors in code.
```
