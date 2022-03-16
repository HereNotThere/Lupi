import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

import "hardhat-contract-sizer";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 20,
      },
    },
  },
  paths: {
    artifacts: "./src/artifacts",
  },
  networks: {
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/fb413fbb148a4a63b37698824d8d617a`,
      accounts:
        process.env.RINKEBY_PRIVATE_KEY !== undefined
          ? [process.env.RINKEBY_PRIVATE_KEY]
          : [],
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    arbitrumrinkeby: {
      url: "https://rinkeby.arbitrum.io/rpc",
      accounts:
        process.env.ARB_RINKEBY_PRIVATE_KEY !== undefined
          ? [process.env.ARB_RINKEBY_PRIVATE_KEY]
          : [],
    },
    arbitrum: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts:
        process.env.ARB_PRIVATE_KEY !== undefined
          ? [process.env.ARB_PRIVATE_KEY]
          : [],
    },
    hardhat: {
      mining: {
        mempool: {
          order: "fifo",
        },
        auto: true,
        interval: [3000, 6000],
      },
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  contractSizer: {
    disambiguatePaths: false,
    runOnCompile: true,
  },
};

export default config;
