const { ethers, utils } = require("ethers");
var config = require("config");

const getProvider = () => {
  return new ethers.providers.JsonRpcProvider(config.get("dev")["97"].rpcurl);
};

const getMainWallet = (provider) => {
  return new ethers.Wallet(config.get("dev").privateKey, provider);
};

const getWallet = (privateKey, provider) => {
  return new ethers.Wallet(privateKey, provider);
};

const getAddresses = () => {
  const provider = getProvider();
  let addresses = [],
    walletArray = [],
    numWallet = 20,
    basePath = "m/44'/60'/0'/0";
  const { mnemonic } = config.get("dev");
  const hdNode = utils.HDNode.fromMnemonic(mnemonic);
  for (let i = 0; i < numWallet; i++) {
    let hdNodeNew = hdNode.derivePath(basePath + "/" + i);
    let walletNew = new ethers.Wallet(hdNodeNew.privateKey, provider);
    addresses.push(walletNew.address);
    walletArray.push(walletNew);
  }
  return { addresses, walletArray };
};

module.exports = {
  getProvider,
  getAddresses,
  getMainWallet,
  getWallet,
};
