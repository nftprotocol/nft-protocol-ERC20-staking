const HDWalletProvider = require('@truffle/hdwallet-provider');
const { projectId, mnemonic } = require('./secrets.json');

module.exports = {

  networks: {

    development: {
      protocol: 'http',
      host: 'localhost',
      port: 8545,
      gas: 5000000,
      gasPrice: 5e9,
      networkId: '*',
      network_id: '*',
    },

    mainnet: {
      provider: () => new HDWalletProvider(
        mnemonic, `https://mainnet.infura.io/v3/${projectId}`
      ),
      networkId: 1,
      network_id: 1,
      gasPrice: 88e9
    },

    kovan: {
      provider: () => new HDWalletProvider(
        mnemonic, `https://kovan.infura.io/v3/${projectId}`
      ),
      networkId: 42,
      network_id: 42,
      gasPrice: 1e9
    },

  },

  compilers: {

    solc: {
      version: "0.6.12",
      "settings": {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }

  }

};
