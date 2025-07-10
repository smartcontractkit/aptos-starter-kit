export const networkConfig = {
    aptos: {
        networkName: "aptosTestnet",
        chainSelector: "743186221051783445",
        ccipObjectAddress: "0xc748085bd02022a9696dfa2058774f92a07401208bbd34cfd0c6d0ac0287ee45",
        ccipRouterModuleName: "router",
        ccipOfframpModuleName: "offramp",
        ccipOnrampModuleName: "onramp",
        ccipBnMTokenAddress: "0xa680c9935c7ea489676fa0e01f1ff8a97fadf0cb35e1e06ba1ba32ecd882fc9a", 
        ccipBnMFaucetAddress: "0xf92c11250dd30e7d11090326b6057c3ed5555fc1a2d29765ea0307bbebd4e77e", 
        feeTokenNameLink: "link",
        linkTokenAddress: "0x3d5d565c271d6b9c52f1a963f2b7bddad3453b0de2ace5e254b8db6549cc335e",
        feeTokenNameNative: "native",
        nativeTokenAddress: "0xa",
        feeTokenStoreAddress: "0x0",
        dataFeedDemoModuleName: "price_feed_demo",
        dataFeedDemoAddressName: "price_feed",
        dataFeedId: "0x01a0b4d920000332000000000000000000000000000000000000000000000000",
        ccipSenderModuleName: "ccip_message_sender",
        ccipSenderAddressName: "sender",
        ccipReceiverModuleName: "ccip_message_receiver",
        ccipReceiverAddressName: "receiver",
        destChains: {
            ethereumSepolia: "sepolia"
        }
    },
    sepolia: {
        networkName: "sepolia",
        chainSelector: "16015286601757825753",
        ccipRouterAddress: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
        ccipOfframpAddress: "0x0820f975ce90EE5c508657F0C58b71D1fcc85cE0",
        ccipOnrampAddress: "0x23a5084Fa78104F3DF11C63Ae59fcac4f6AD9DeE",
        ccipBnMTokenAddress: "0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05",
        linkTokenAddress: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
        explorerUrl: "https://sepolia.etherscan.io"
    }
}