require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545, // GUI
      //port:8545, // CLI
      network_id: "*", // Match any network id
      gas: 6721975, // 3 237 992, 4 495 659
      gasPrice: 25000000000
    },
  },
  contracts_directory: './src/contracts/',
  contracts_build_directory: './src/abis/',
  compilers: {
    solc: {
      version: "0.8.0",    //<==========CHANGED THAT from "0.5.1"
      optimizer: {
        enabled: true,
        runs: 1
      }
    }
  }
}
