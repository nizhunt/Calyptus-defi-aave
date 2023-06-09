import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import "@nomiclabs/hardhat-ethers";
import "hardhat-deploy";

dotenv.config();

const Mumbai_RPC_URL =
    process.env.Mumbai_RPC_URL || "set-Mumbai-rpc-url-in-dotenv";
const MUMBAI_RPC_URL =
    process.env.MUMBAI_RPC_URL || "set-mumbai-rpc-url-in-dotenv";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "set-your-private-key-in-dotenv";
const ETHERSCAN_API_KEY =
    process.env.ETHERSCAN_API_KEY || "set-your-etherscan-key-in-dotenv";
const POLYGONSCAN_API_KEY =
    process.env.POLYGONSCAN_API_KEY || "set-your-polygonscan-key-in-dotenv";

const config: HardhatUserConfig = {
    defaultNetwork: "hardhat",
    networks: {
        Mumbai: {
            url: Mumbai_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 5,
        },
        mumbai: {
            url: MUMBAI_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 80001,
        },
        localhost: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS ? true : false,
        token: "ETH",
        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
        currency: "USD",
    },
    solidity: "0.8.17",
    etherscan: {
        apiKey: {
            Mumbai: ETHERSCAN_API_KEY,
            polygonMumbai: POLYGONSCAN_API_KEY,
        },
    },
    mocha: {
        timeout: "400000",
    },
};

export default config;
