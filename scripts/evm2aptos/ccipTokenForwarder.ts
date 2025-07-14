import { ethers, Interface, hexlify, toUtf8Bytes } from "ethers";
import RouterABI from '../config/abi/Router';
import ERC20_ABI from '../config/abi/ERC20';
import OnRamp_1_6_ABI from "../config/abi/OnRamp_1_6";
import FeeQuoter_1_6_ABI from "../config/abi/FeeQuoter_1_6";
import { networkConfig } from "../../helper-config";
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import * as dotenv from "dotenv";
dotenv.config();

const argv = yargs(hideBin(process.argv))
    .option('feeToken', {
        type: 'string',
        description: 'Specify the fee token (link or native)',
        demandOption: true,
        choices: [
            networkConfig.aptos.feeTokenNameLink,
            networkConfig.aptos.feeTokenNameNative
        ],
    })
    .option("sourceChain", {
        type: 'string',
        description: 'Specify the source chain from where the token will be sent',
        demandOption: true,
        choices: [
            networkConfig.sepolia.networkName,
            networkConfig.avalancheFuji.networkName
        ]
    })
    .option('aptosAccount', {
        type: 'string',
        description: 'Specify the Aptos account address to forward the token to',
        demandOption: true
    })
    .option('amount', {
        type: 'number',
        description: 'Specify the amount of token to forward',
        demandOption: true,
    })
    .option('aptosReceiver', {
        type: 'string',
        description: 'Specify the Aptos Receiver Address',
        demandOption: true
    })
    .parseSync();

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
    throw new Error("Please set the environment variable PRIVATE_KEY.");
}

/**
 * Parses a human-readable token amount into the appropriate BigInt
 * based on the token's decimals.
 */
async function parseTokenAmount(
    tokenAddress: string,
    amount: number,
    provider: ethers.Provider
): Promise<bigint> {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const decimals: number = await tokenContract.decimals();
    return ethers.parseUnits(amount.toString(), decimals);
}

async function approveToken(
    wallet: ethers.Wallet,
    ccipRouterAddress: string,
    tokenAddress: string,
    amount: bigint
) {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

    const currentAllowance: bigint = await tokenContract.allowance(wallet.address, ccipRouterAddress);
    console.log(`Current Allowance of ${await tokenContract.symbol()} token:`, currentAllowance.toString());

    if (currentAllowance >= amount) {
        console.log("Sufficient allowance already granted.");
        return;
    }

    const tx = await tokenContract.approve(ccipRouterAddress, amount);
    console.log("Approval tx sent:", tx.hash);
    const confirmationsToWait = 3;
    const receipt = await tx.wait(confirmationsToWait);
    console.log(`Approval transaction confirmed in block ${receipt.blockNumber} after ${confirmationsToWait} confirmations.`);
    console.log(`Router contract approved to spend ${amount} of ${await tokenContract.symbol()} token from your account.`);
}

function buildCCIPMessage(
    recipient: string,
    data: string,
    token: string,
    amount: bigint,
    feeToken: string,
    extraArgs: string
): Array<any> {
    return [
        recipient,
        data,
        [{ token, amount }],
        feeToken,
        extraArgs
    ];
}

function encodeExtraArgsV2(gasLimit: bigint, strict: boolean): string {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();

    const encodedArgs = abiCoder.encode(["tuple(uint256 gasLimit, bool strict)"], [[gasLimit, strict]]);

    const GENERIC_EXTRA_ARGS_V2_TAG = "0x181dcf10";

    return ethers.concat([GENERIC_EXTRA_ARGS_V2_TAG, encodedArgs]);
}

async function extractCCIPMessageId(
    ccipOnRampContract: ethers.Contract,
    receipt: ethers.TransactionReceipt,
): Promise<string | null> {

    for (const log of receipt.logs) {
        try {
            const parsedLog = ccipOnRampContract.interface.parseLog(log);

            if (parsedLog?.name === "CCIPMessageSent") {
                const message = parsedLog.args.message;
                const messageId: string = message.header.messageId;

                console.log("🆔 CCIP Message ID:", messageId);
                return messageId;
            }
        } catch {
            // Skip unrelated logs
            continue;
        }
    }

    console.warn("❌ CCIPMessageSent event not found.");
    return null;
}

async function transferTokenPayLink(wallet: ethers.Wallet, ccipRouterContract: ethers.Contract, ccipOnRampContract: ethers.Contract, recipient: string, aptosAccountAddress: string, tokenAddress: string, tokenAmount: bigint, feeTokenAddress: string, explorerUrl: string) {

    try {

        const ccipMessage = buildCCIPMessage(
            recipient,
            aptosAccountAddress, // Aptos account address (passed as data) to forward the token to
            tokenAddress,
            tokenAmount,
            feeTokenAddress,
            encodeExtraArgsV2(100000n, true) // Gas limit set to 200000. This is a reasonable default for most messages, OoO (Out of Order) execution enabled
        );

        const baseFee: bigint = await ccipRouterContract.getFee(networkConfig.aptos.chainSelector, ccipMessage);

        // Add 20% margin
        const margin = baseFee / 5n; // 20% of base fee
        const feeWithBuffer = baseFee + margin;

        console.log("Base Fee (in LINK JUELS):", baseFee.toString());
        console.log("Fee with 20% buffer (in LINK JUELS):", feeWithBuffer.toString());

        // Approve the token transfer
        await approveToken(wallet, await ccipRouterContract.getAddress(), tokenAddress, tokenAmount);

        // Approve the LINK token for fee payment
        await approveToken(wallet, await ccipRouterContract.getAddress(), feeTokenAddress, feeWithBuffer);

        console.log("Proceeding with the token transfer...");

        const tx = await ccipRouterContract.ccipSend(
            networkConfig.aptos.chainSelector,
            ccipMessage
        );

        console.log("Transaction sent:", tx.hash);
        console.log("Waiting for transaction confirmation...");
        const confirmationsToWait = 3;
        const receipt = await tx.wait(confirmationsToWait);
        console.log(`Transaction confirmed in block ${receipt.blockNumber} after ${confirmationsToWait} confirmations.`);
        console.log("✅ Transaction successful:", `${explorerUrl}/tx/${tx.hash}`);
        await extractCCIPMessageId(ccipOnRampContract, receipt);
    } catch (error) {
        handleError([
            { name: "CCIPRouterInterface", iface: ccipRouterContract.interface },
            { name: "CCIPOnRampInterface", iface: ccipOnRampContract.interface },
            { name: "ERC20Interface", iface: new Interface(ERC20_ABI) },
            { name: "FeeQuoterInterface", iface: new Interface(FeeQuoter_1_6_ABI) }
        ], error);
    }

}

async function transferTokenPayNative(wallet: ethers.Wallet, ccipRouterContract: ethers.Contract, ccipOnRampContract: ethers.Contract, recipient: string, aptosAccountAddress: string, tokenAddress: string, tokenAmount: bigint, explorerUrl: string) {

    try {

        const ccipMessage = buildCCIPMessage(
            recipient,
            aptosAccountAddress, // Aptos account address (passed as data) to forward the token to
            tokenAddress,
            tokenAmount,
            ethers.ZeroAddress, // Fee token is set to zero address (in case of using native token as fee)
            encodeExtraArgsV2(100000n, true) // Gas limit set to 200000. This is a reasonable default for most messages, OoO (Out of Order) execution enabled
        );

        const baseFee: bigint = await ccipRouterContract.getFee(networkConfig.aptos.chainSelector, ccipMessage);

        // Add 20% margin
        const margin = baseFee / 5n; // 20% of base fee
        const feeWithBuffer = baseFee + margin;

        console.log("Base Fee (in WEI):", baseFee.toString());
        console.log("Fee with 20% buffer (in WEI):", feeWithBuffer.toString());

        // Approve the token transfer
        await approveToken(wallet, await ccipRouterContract.getAddress(), tokenAddress, tokenAmount);

        console.log("Proceeding with the message transfer...");

        const tx = await ccipRouterContract.ccipSend(
            networkConfig.aptos.chainSelector,
            ccipMessage,
            {
                value: feeWithBuffer, // Send the fee in native currency (ETH)
            }
        );

        console.log("Transaction sent:", tx.hash);
        console.log("Waiting for transaction confirmation...");
        const confirmationsToWait = 3;
        const receipt = await tx.wait(confirmationsToWait);
        console.log(`Transaction confirmed in block ${receipt.blockNumber} after ${confirmationsToWait} confirmations.`);
        console.log("✅ Transaction successful:", `${explorerUrl}/tx/${tx.hash}`);
        await extractCCIPMessageId(ccipOnRampContract, receipt);
    } catch (error) {

        handleError([
            { name: "CCIPRouterInterface", iface: ccipRouterContract.interface },
            { name: "CCIPOnRampInterface", iface: ccipOnRampContract.interface },
            { name: "ERC20Interface", iface: new Interface(ERC20_ABI) },
            { name: "FeeQuoterInterface", iface: new Interface(FeeQuoter_1_6_ABI) }
        ], error);
    }

}

/*
tokenAmount: number - The amount of CCIP-BnM token to send
aptosAccountAddress: string - The Aptos account address to forward the token to
**/
async function sendTokenFromEvmToAptos(aptosAccountAddress: string, tokenAmount: number,) {
    // console.log(await ccipRouterContract.isChainSupported(networkConfig.aptos.chainSelector));

    let recipient = argv.aptosReceiver;
    let sourceChainRpcUrl: string | undefined;
    let tokenAddress: string | undefined;
    let feeTokenAddress: string | undefined;
    let explorerUrl: string | undefined;

    if (argv.sourceChain === networkConfig.sepolia.networkName) {
        sourceChainRpcUrl = process.env.ETHEREUM_SEPOLIA_RPC_URL;
        if (!sourceChainRpcUrl) {
            throw new Error("Please set the environment variable ETHEREUM_SEPOLIA_RPC_URL.");
        }

        const provider = new ethers.JsonRpcProvider(sourceChainRpcUrl);
        const wallet = new ethers.Wallet(privateKey as string, provider);

        const ccipRouterContract = new ethers.Contract(
            networkConfig.sepolia.ccipRouterAddress,
            RouterABI,
            wallet
        );

        const ccipOnRampContract = new ethers.Contract(
            networkConfig.sepolia.ccipOnrampAddress,
            OnRamp_1_6_ABI,
            wallet
        );

        tokenAddress = networkConfig.sepolia.ccipBnMTokenAddress;

        const parsedTokenAmount = await parseTokenAmount(tokenAddress, tokenAmount, wallet.provider as ethers.Provider);

        explorerUrl = networkConfig.sepolia.explorerUrl;

        if (argv.feeToken === networkConfig.aptos.feeTokenNameLink) {
            feeTokenAddress = networkConfig.sepolia.linkTokenAddress;
            transferTokenPayLink(wallet, ccipRouterContract, ccipOnRampContract, recipient, aptosAccountAddress, tokenAddress, parsedTokenAmount, feeTokenAddress, explorerUrl);
        } else if (argv.feeToken === networkConfig.aptos.feeTokenNameNative) {
            transferTokenPayNative(wallet, ccipRouterContract, ccipOnRampContract, recipient, aptosAccountAddress, tokenAddress, parsedTokenAmount, explorerUrl);
        } else {
            throw new Error("Invalid fee token specified. Please specify fee token use --feeToken link or --feeToken native.");
        }

    } else if (argv.sourceChain === networkConfig.avalancheFuji.networkName) {
        sourceChainRpcUrl = process.env.AVALANCHE_FUJI_RPC_URL;
        if (!sourceChainRpcUrl) {
            throw new Error("Please set the environment variable AVALANCHE_FUJI_RPC_URL.");
        }

        const provider = new ethers.JsonRpcProvider(sourceChainRpcUrl);
        const wallet = new ethers.Wallet(privateKey as string, provider);

        const ccipRouterContract = new ethers.Contract(
            networkConfig.avalancheFuji.ccipRouterAddress,
            RouterABI,
            wallet
        );

        const ccipOnRampContract = new ethers.Contract(
            networkConfig.avalancheFuji.ccipOnrampAddress,
            OnRamp_1_6_ABI,
            wallet
        );

        tokenAddress = networkConfig.avalancheFuji.ccipBnMTokenAddress;

        const parsedTokenAmount = await parseTokenAmount(tokenAddress, tokenAmount, wallet.provider as ethers.Provider);

        explorerUrl = networkConfig.avalancheFuji.explorerUrl;

        if (argv.feeToken === networkConfig.aptos.feeTokenNameLink) {
            feeTokenAddress = networkConfig.avalancheFuji.linkTokenAddress;
            transferTokenPayLink(wallet, ccipRouterContract, ccipOnRampContract, recipient, aptosAccountAddress, tokenAddress, parsedTokenAmount, feeTokenAddress, explorerUrl);
        } else if (argv.feeToken === networkConfig.aptos.feeTokenNameNative) {
            transferTokenPayNative(wallet, ccipRouterContract, ccipOnRampContract, recipient, aptosAccountAddress, tokenAddress, parsedTokenAmount, explorerUrl);
        }
        else {
            throw new Error("Invalid fee token specified. Please specify fee token use --feeToken link or --feeToken native.");
        }
    } else {
        throw new Error("Invalid source chain specified. Please specify --sourceChain sepolia or --sourceChain fuji.");
    }
}


async function handleError(
    interfaces: { name: string; iface: Interface }[],
    err: any
) {
    const data = err.data ?? err.error?.data;

    if (!data || typeof data !== "string" || !data.startsWith("0x")) {
        console.error("No valid revert data.");
        return;
    }

    const selector = data.slice(0, 10);

    if (selector === "0x08c379a0") {
        // Error(string)
        try {
            const fallbackInterface = interfaces[0].iface; // Pick any to decode standard error
            const reason = fallbackInterface.decodeErrorResult("Error(string)", data);
            console.log("Require/Revert with string:", reason[0]);
        } catch {
            console.log("Failed to decode standard error.");
        }
    } else if (selector === "0x4e487b71") {
        // Panic(uint256)
        const code = parseInt(data.slice(10, 74), 16);
        console.log("Panic with code:", code);
    } else {
        // Try parsing with each interface
        let matched = false;
        for (const { name, iface } of interfaces) {
            try {
                const decoded = iface.parseError(data);
                // console.log(`Custom Error matched in interface: ${name}`);
                console.log("Custom Error:", decoded!.name);

                if (decoded!.args.length > 0) {
                    const namedArgs: { [key: string]: any } = {};
                    decoded!.fragment.inputs.forEach((input, index) => {
                        namedArgs[input.name] = decoded!.args[index];
                    });
                    console.log({ args: namedArgs });
                }

                matched = true;
                break;
            } catch {
                continue;
            }
        }

        if (!matched) {
            console.log("Unknown error format or not found in any interface.");
        }
    }
}

sendTokenFromEvmToAptos(argv.aptosAccount, argv.amount);