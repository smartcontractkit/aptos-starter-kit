export const networkConfig = {
    aptos: {
        chainSelector: "743186221051783445",
        ccipObjectAddress: "0xbf9c97104a501e238a10ef1180386d4c030dbd9834a557cfcb016e85d929fdaf",
        ccipRouterModuleName: "router",
        ccipOfframpModuleName: "offramp",
        ccipOnrampModuleName: "onramp",
        ccipBnMTokenAddress: "0x9fb6e529e89805611769c76f7d5b6bfc557f04ec9ec69156bdb490e3403246b8",
        ccipBnMFaucetAddress: "0x68c7af48bfea9e459bd6b6f7240d6764750313a8639dc58c82f88806f559b764",
        feeTokenNameLink: "link",
        linkTokenAddress: "0x8873d0d9aa0e1d7bf7a42de620906d51f535314c72f27032bcaaf5519a22fec9",
        linkFaucetAddress: "0xa15307fbc421fc3ede3a74fb3bf2fd7f6b30eae731470a70e763a5b76475a0b6",
        feeTokenNameNative: "native",
        nativeTokenAddress: "0xa",
        feeTokenStoreAddress: "0x0",
        dataFeedDemoModuleName: "price_feed_demo",
        dataFeedId: "0x01a0b4d920000332000000000000000000000000000000000000000000000000",
        ccipSenderModuleName: "ccip_message_sender",
        destChains: {
            ethereumSepolia: "sepolia",
            avalancheFuji: "fuji"
        }
    },
    sepolia: {
        networkName: "sepolia",
        chainSelector: "16015286601757825753",
        ccipRouterAddress: "0x85634Ebafbc5D71d6606D4ea76630941B0e18Cee",
        ccipOfframpAddress: "0xe3d660848B680355a90b8E7fD4E4a1f63F3522D7",
        ccipOnrampAddress: "0x48B2e5D487Cb85a7586FCdbDF9cC4E8c7391ED1B",
        ccipBnMTokenAddress: "0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05",
        linkTokenAddress: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
        explorerUrl: "https://sepolia.etherscan.io"
    },
    avalancheFuji: {
        networkName: "fuji",
        chainSelector: "14767482510784806043",
        ccipRouterAddress: "0x8cEc1C22Fc5382633b7Ac5F07Cdd82FF3fB72C67",
        ccipOfframpAddress: "0xe9fA9D0de47a0B606C1A9af09746cCe82C82c8C3",
        ccipOnrampAddress: "0x6ebe6c93878586dDF1825134E2144Fb737b54bdd",
        ccipBnMTokenAddress: "0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4",
        linkTokenAddress: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846",
        explorerUrl: "https://testnet.snowtrace.io"
    }
}