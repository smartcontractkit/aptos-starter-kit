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
    },
        avalancheFuji: {
        networkName: "fuji",
        chainSelector: "14767482510784806043",
        ccipRouterAddress: "0xF694E193200268f9a4868e4Aa017A0118C9a8177",
        ccipOfframpAddress: "0x3F1f176e347235858DD6Db905DDBA09Eaf25478a",
        ccipOnrampAddress: "0xA5D5B0B844c8f11B61F28AC98BBA84dEA9b80953",
        ccipBnMTokenAddress: "0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4",
        linkTokenAddress: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846",
        explorerUrl: "https://testnet.snowtrace.io"
    },
    arbitrumSepolia: {
        networkName: "arbitrumSepolia",
        chainSelector: "3478487238524512106",
        ccipRouterAddress: "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165",
        ccipOfframpAddress: "0xf4ebcc2c077d3939434c7ab0572660c5a45e4df5",
        ccipOnrampAddress: "0x28a025d34c830bf212f5d2357c8dcab32dd92a20",
        ccipBnMTokenAddress: "0xA8C0c11bf64AF62CDCA6f93D3769B88BdD7cb93D",
        linkTokenAddress: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E",
        explorerUrl: "https://sepolia.arbiscan.io"
    },
    baseSepolia: {
        networkName: "baseSepolia",
        chainSelector: "10344971235874465080",
        ccipRouterAddress: "0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93",
        ccipOfframpAddress: "0xf4ebcc2c077d3939434c7ab0572660c5a45e4df5",
        ccipOnrampAddress: "0x28a025d34c830bf212f5d2357c8dcab32dd92a20",
        ccipBnMTokenAddress: "0x88A2d74F47a237a62e7A51cdDa67270CE381555e",
        linkTokenAddress: "0xE4aB69C077896252FAFBD49EFD26B5D171A32410",
        explorerUrl: "https://sepolia.basescan.org/"
    }, 
    bnbChainTestnet: {
        networkName: "bnbChainTestnet",
        chainSelector: "13264668187771770619",
        ccipRouterAddress: "0xE1053aE1857476f36A3C62580FF9b016E8EE8F6f",
        ccipOfframpAddress: "0xf4ebcc2c077d3939434c7ab0572660c5a45e4df5",
        ccipOnrampAddress: "0x28a025d34c830bf212f5d2357c8dcab32dd92a20",
        ccipBnMTokenAddress: "0xbFA2ACd33ED6EEc0ed3Cc06bF1ac38d22b36B9e9",
        linkTokenAddress: "0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06",
        explorerUrl: "https://testnet.bscscan.com"
    },
    opSepolia:{
        networkName: "opSepolia",
        chainSelector: "5224473277236331295",
        ccipRouterAddress: "0x114A20A10b43D4115e5aeef7345a1A71d2a60C57",
        ccipOfframpAddress: "0x30d197c6f5be050d5525dd94d01760facdb67e7c",
        ccipOnrampAddress: "0x8f5bed5f7601025b12a97b01584220c12e343986",
        ccipBnMTokenAddress: "0x8aF4204e30565DF93352fE8E1De78925F6664dA7",
        linkTokenAddress: "0xE4aB69C077896252FAFBD49EFD26B5D171A32410",
        explorerUrl: "https://sepolia-optimism.etherscan.io"
    }, 
    sonicBlaze: {
        networkName: "sonicBlaze",
        chainSelector: "3676871237479449268",
        ccipRouterAddress: "0x2fBd4659774D468Db5ca5bacE37869905d8EfA34",
        ccipOfframpAddress: "0xf094e1db26ce8c76c9ff0bd0566bb8eeff1b76dd",
        ccipOnrampAddress: "0x384c8843411f725e800e625d5d1b659256d629df",
        ccipBnMTokenAddress: "0x230c46b9a7c8929A80863bDe89082B372a4c7A99",
        linkTokenAddress: "0xd8C1eEE32341240A62eC8BC9988320bcC13c8580",
        explorerUrl: "https://testnet.sonicscan.org"
    }
}