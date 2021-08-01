require("dotenv").config();

const HDWalletProvider = require("@truffle/hdwallet-provider");

const privateKeys = [process.env.PRIVATE_KEY];
const infuraAccessToken = process.env.INFURA_ACCESS_TOKEN;
const providerUrl = `https://rinkeby.infura.io/v3/${infuraAccessToken}`;
const etherscanApiToken = process.env.ETHERSCAN_API_TOKEN;

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
    },
    rinkeby: {
      provider: () =>
        new HDWalletProvider({
          privateKeys: privateKeys,
          providerOrUrl: providerUrl,
          numberOfAddresses: 1
        }),
      gas: 5000000,
      gasPrice: 25000000000,
      network_id: 4,
      websocket: true,
    },
  },
  compilers: {
    solc: {
      version: "0.8.0",
    },
  },
  db: {
    enabled: false,
  },
  plugins: ["truffle-plugin-verify", "solidity-coverage"],

  api_keys: {
    etherscan: etherscanApiToken,
  },
};
