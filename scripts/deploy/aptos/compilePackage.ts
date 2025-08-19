import { spawn } from "child_process";

/**
 * Compiles a Move package using the safer `spawn` method.
 * This version accepts multiple named addresses.
 * @param packageDir - The name of the package directory (e.g., "my_package").
 * @param namedAddresses - An object mapping address names to their hex string values.
 */
export function compilePackage(
  packageDir: string,
  namedAddresses: { [key: string]: string },
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Format the named addresses for the CLI command
    const namedAddressesArg = Object.entries(namedAddresses)
      .map(([key, value]) => `${key}=${value}`)
      .join(",");

    const args = [
      "move",
      "compile",
      "--save-metadata",
      "--package-dir",
      packageDir,
      "--named-addresses",
      namedAddressesArg,
    ];

    console.log(`\nCompiling ${packageDir} with addresses: ${namedAddressesArg}`);
    console.log(`Running: aptos ${args.join(" ")}`);

    const child = spawn("aptos", args);
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => (stdout += data.toString()));
    child.stderr.on("data", (data) => (stderr += data.toString()));

    child.on("close", (code) => {
      if (code === 0) {
        console.log(stdout);
        console.log(`✅ ${packageDir} compiled successfully.`);
        resolve();
      } else {
        console.error(`Compilation failed with exit code ${code}`);
        reject(new Error(stderr));
      }
    });

    child.on("error", (err) => {
      console.error("Failed to start 'aptos' subprocess. Is the Aptos CLI installed and in your PATH?");
      reject(err);
    });
  });
}