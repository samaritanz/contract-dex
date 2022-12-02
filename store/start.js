var { ethers, utils, providers } = require("ethers");
var config = require("config");
var {
  getProvider,
  getAddresses,
  getMainWallet,
  getWallet,
} = require("../utils");
var { tokenABI, routerABI } = require("../utils/abi");
var dayjs = require("dayjs");

const multiTransferETH = async () => {
  // console.log("start", config.get("dev"));
  // const mnemonic = utils.entropyToMnemonic(utils.randomBytes(32));
  // console.log({ mnemonic });
  try {
    const provider = new ethers.providers.JsonRpcProvider(
      config.get("dev")["97"].rpcurl
    );
    const wallet = new ethers.Wallet(config.get("dev").privateKey, provider);

    const walletBalance = await provider.getBalance(wallet.address);
    // const walletBalance = await provider.getBalance(wallet.address);
    console.log(
      `\n当前地址：${wallet.address}的余额是 ${utils.formatEther(
        walletBalance
      )} ETH`
    );
    const abiAirdrop = [
      "function multiTransferToken(address,address[],uint256[]) external",
      "function multiTransferETH(address[],uint256[]) public payable",
    ];
    const { mnemonic } = config.get("dev");
    // 创建HD钱包
    const hdNode = utils.HDNode.fromMnemonic(mnemonic);
    let basePath = "m/44'/60'/0'/0";
    const numWallet = 20;

    let addresses = [];
    for (let i = 0; i < numWallet; i++) {
      let hdNodeNew = hdNode.derivePath(basePath + "/" + i);
      let walletNew = new ethers.Wallet(hdNodeNew.privateKey);
      addresses.push(walletNew.address);
    }
    const amounts = Array(20).fill(utils.parseEther("0.03"));
    const contractAirdrop = new ethers.Contract(
      config.get("dev")["97"].airdrop,
      abiAirdrop,
      wallet
    );
    const tx = await contractAirdrop.multiTransferETH(addresses, amounts, {
      value: ethers.utils.parseEther("0.6"),
    });
    // 等待交易上链
    await tx.wait();
    const afterwalletBalance = await provider.getBalance(wallet.address);
    // const walletBalance = await provider.getBalance(wallet.address);
    console.log(
      `\nTransfer之后当前地址：${wallet.address}的余额是 ${utils.formatEther(
        afterwalletBalance
      )} ETH`
    );
    for (let i = 0; i < numWallet; i++) {
      let hdNodeNew = hdNode.derivePath(basePath + "/" + i);
      let walletNew = new ethers.Wallet(hdNodeNew.privateKey);
      const balance = await provider.getBalance(walletNew.address);
      console.log(
        `\n地址：${walletNew.address} 余额：${utils.formatEther(balance)}`
      );
    }
    // console.log({ addresses, amounts }, utils.parseEther("0.002"));
    // return { addresses, amounts };
    // return;
  } catch (error) {
    console.log({ error });
  }
};

const multiTransferToken = async (tokenAddress) => {
  // console.log("start", config.get("dev"));
  // const mnemonic = utils.entropyToMnemonic(utils.randomBytes(32));
  // console.log({ mnemonic });
  try {
    const provider = getProvider();
    const wallet = getMainWallet(provider);

    const abiToken = [
      "function balanceOf(address) public view returns(uint)",
      "function transfer(address, uint) public returns (bool)",
      "function approve(address, uint256) public returns (bool)",
    ];
    const abiAirdrop = [
      "function multiTransferToken(address,address[],uint256[]) external",
      "function multiTransferETH(address[],uint256[]) public payable",
    ];
    const contractAirdrop = new ethers.Contract(
      config.get("dev")["97"].airdrop,
      abiAirdrop,
      wallet
    );
    const tokenContract = new ethers.Contract(tokenAddress, abiToken, wallet);

    let { wait } = await tokenContract.approve(
      config.get("dev")[97]["airdrop"],
      utils.parseUnits("200000000", "18")
    );
    await wait();

    let { addresses } = getAddresses();

    const amounts = Array(20).fill(utils.parseEther("100000"));

    let tokenBalance = await tokenContract.balanceOf(wallet.address);
    console.log(
      `\n当前地址：${wallet.address}的token余额为：${utils.formatUnits(
        tokenBalance,
        "18"
      )}`
    );
    const tx = await contractAirdrop.multiTransferToken(
      config.get("dev")[97].token,
      addresses,
      amounts
    );
    // // 等待交易上链
    await tx.wait();
    tokenBalance = await tokenContract.balanceOf(wallet.address);
    console.log(
      `\n当前地址：${wallet.address}的token余额为：${utils.formatUnits(
        tokenBalance,
        "18"
      )}`
    );
    // const afterwalletBalance = await provider.getBalance(wallet.address);
    // // const walletBalance = await provider.getBalance(wallet.address);
    // console.log(
    //   `\nTransfer之后当前地址：${wallet.address}的余额是 ${utils.formatEther(
    //     afterwalletBalance
    //   )} ETH`
    // );
    let balanceArray = [];
    addresses.map((itemAddress) => {
      balanceArray.push(tokenContract.balanceOf(itemAddress));
    });
    balanceArray = await Promise.all(balanceArray);
    balanceArray.map((balanceData, index) =>
      console.log(
        `\n地址：${addresses[index]} 余额：${utils.formatEther(balanceData)}`
      )
    );
  } catch (error) {
    console.log({ error });
  }
};

const exchangeToken = async (tokenFrom, tokenTo) => {
  // console.log({ tokenFrom: tokenFrom, tokenTo: tokenTo });
  const provider = getProvider();
  // const wallet = getMainWallet(provider);
  const { walletArray } = getAddresses();
  // console.log({ tokenABI });
  const startApproveTime = dayjs().unix();
  console.log(`开始授权 ${startApproveTime} \n`);
  await Promise.all(
    walletArray.map(async (item) => {
      const tokenContract = new ethers.Contract(
        config.get("dev")["97"].token,
        tokenABI,
        item
      );
      const allowance = await tokenContract.allowance(
        item.address,
        config.get("dev")["97"].Router_Address
      );
      if (utils.formatUnits(allowance) < 1000) {
        // console.log({ tokenContract });
        const tx = await tokenContract.approve(
          config.get("dev")["97"].Router_Address,
          utils.parseUnits("1000000000").toString()
        );
        // console.log({ tx });
        await tx.wait();
        const allowance = await tokenContract.allowance(
          item.address,
          config.get("dev")["97"].Router_Address
        );
        console.log(
          `\n 地址:${item.address} 对Router合约的授权额度：${utils.formatUnits(
            String(allowance)
          )}`
        );
      }
    })
  );
  const endApprovetime = dayjs().unix();
  console.log(`授权结束，用时${endApprovetime - startApproveTime}秒`);

  console.log("开始购买。。。");
  const toContract = new ethers.Contract(
    config.get("dev")["97"].USDT,
    tokenABI,
    provider
  );
  try {
    await Promise.all(
      walletArray.map(async (item) => {
        // const tokenContract = new ethers.Contract(
        //   config.get("dev")["97"].token,
        //   tokenABI,
        //   item
        // );
        // console.log({ item });

        const routerContract = new ethers.Contract(
          config.get("dev")["97"].Router_Address,
          routerABI,
          item
        );
        const deadline = 5;

        // console.log({ tokenContract });
        const tx = await routerContract.swapExactTokensForTokens(
          utils.parseUnits("1000"),
          utils.parseUnits("10"),
          [tokenFrom, tokenTo],
          item.address,
          Date.now() + 1000 * 60 * deadline
        );
        await tx.wait();
        const [balance, blockNumber] = await Promise.all([
          toContract.balanceOf(item.address),
          provider.getBlockNumber(),
        ]);
        // const blockNumber = await provider.getBlockNumber();
        console.log(
          `地址:${item.address} 购买成功 ,当前余额为：${utils.formatUnits(
            String(balance)
          )}`
        );
        console.log(`当前区块为：${blockNumber}`);
      })
    );
  } catch (error) {
    console.log(error);
  }
  const endSwaptime = dayjs().unix();
  console.log(`购买结束，用时${endSwaptime - endApprovetime}秒`);
};

module.exports = {
  multiTransferETH,
  multiTransferToken,
  exchangeToken,
};
