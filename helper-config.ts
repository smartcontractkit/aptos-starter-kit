import { e } from "@aptos-labs/ts-sdk/dist/common/accountAddress-AL8HRxQC";
export const networkConfig = {
    aptos: {
        chainSelector: "0x00",
        ccipObjectAddress: "0x00",
        ccipRouterModuleName: "router",
        ccipOfframpModuleName: "offramp",
        ccipOnrampModuleName: "onramp",
        ccipBnMTokenAddress: "0x00",
        feeTokenNameLink: "link",
        linkTokenAddress: "0x00",
        feeTokenNameNative: "native",
        nativeTokenAddress: "0x00",
        feeTokenStoreAddress: "0x00",
        dataFeedDemoModuleName: "price_feed_demo",
        dataFeedId: "0x00",
        ccipSenderModuleName: "ccip_message_sender",
        destChains: {
            ethereumSepolia: "sepolia",
            avalancheFuji: "fuji"
        }
    },
    sepolia: {
        networkName: "sepolia",
        chainSelector: "00",
        ccipRouterAddress: "0x00",
        ccipOfframpAddress: "0x00",
        ccipOnrampAddress: "0x00",
        ccipBnMTokenAddress: "0x00",
        linkTokenAddress: "0x00",
        explorerUrl: "https://sepolia.etherscan.io",
    },
    avalancheFuji: {
        networkName: "fuji",
        chainSelector: "00",
        ccipRouterAddress: "0x00",
        ccipOfframpAddress: "0x00",
        ccipOnrampAddress: "0x00",
        ccipBnMTokenAddress: "0x00",
        linkTokenAddress: "0x00",
        explorerUrl: "https://testnet.snowtrace.io",
    }
}