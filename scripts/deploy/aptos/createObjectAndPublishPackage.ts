import { spawn } from "child_process";
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { networkConfig } from "../../../helper-config";

const argv = yargs(hideBin(process.argv))
  .option('packageName', {
    type: 'string',
    description: 'Specify the package name to publish',
    demandOption: true,
    choices: [
      networkConfig.aptos.dataFeedDemoModuleName,
      networkConfig.aptos.ccipSenderModuleName
    ],
  }).option("addressName", {
    type: 'string',
    description: 'Specify the address name at which the package will be published',
    demandOption: true,
    choices: [
      networkConfig.aptos.dataFeedDemoAddressName,
      networkConfig.aptos.ccipSenderAddressName
    ]
  })
  .parseSync();

// Define the path to your Move package and the named address
const PACKAGE_PATH = `modules/${argv.packageName}`; // The path to the package you want to deploy
const NAMED_ADDRESS = argv.addressName; // The key for the named address in your Move.toml

/**
 * Deploys an object by spawning the Aptos CLI `deploy-object` command.
 */
async function deployObjectWithCLI() {
  console.log(`--- Starting Object Deployment via Aptos CLI ---`);
  console.log(`Package:   ${PACKAGE_PATH}`);

  return new Promise<void>((resolve, reject) => {
    // Construct the arguments for the CLI command
    const args = [
      "move",
      "deploy-object",
      "--package-dir",
      PACKAGE_PATH,
      "--address-name",
      NAMED_ADDRESS,
      "--assume-yes", // Automatically approve the deployment summary
    ];

    console.log(`\nRunning command: aptos ${args.join(" ")}`);

    const child = spawn("aptos", args);

    let stdout = "";
    let stderr = "";

    // Capture standard output
    child.stdout.on("data", (data) => {
      const output = data.toString();
      console.log(output); // Stream the output live
      stdout += output;
    });

    // Capture standard error
    child.stderr.on("data", (data) => {
      const errorOutput = data.toString();
      console.error(errorOutput);
      stderr += errorOutput;
    });

    // Handle process exit
    child.on("close", (code) => {
      if (code === 0) {
        console.log("\n✅ CLI command executed successfully.");

        // Try to find the object address in the output
        const match = stdout.match(/object address (0x[a-fA-F0-9]+)/);
        if (match && match[1]) {
          console.log(`\n✅ Object package successfully deployed!`);
          console.log(`Deployed Object Address: ${match[1]}`);
        } else {
          console.warn("\nCould not automatically parse the object address from the CLI output, but the command succeeded.");
        }
        resolve();
      } else {
        console.error(`\n❌ CLI command failed with exit code ${code}`);
        reject(new Error(stderr || "The Aptos CLI command failed."));
      }
    });

    // Handle errors in spawning the process
    child.on("error", (err) => {
      console.error("Failed to start the 'aptos' subprocess. Is the Aptos CLI installed and in your PATH?");
      reject(err);
    });
  });
}

// Run the main function
async function main() {
  try {
    await deployObjectWithCLI();
  } catch (error) {
    console.error("\nDeployment script failed:", error);
    process.exit(1);
  }
}

main();
