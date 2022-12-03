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
var { logger } = require("../logger");

const multiTransferETH = async () => {
  // logger.info("start", config.get("dev"));
  // const mnemonic = utils.entropyToMnemonic(utils.randomBytes(32));
  // logger.info({ mnemonic });
  try {
    const provider = new ethers.providers.JsonRpcProvider(
      config.get("dev")["97"].rpcurl
    );
    const wallet = new ethers.Wallet(config.get("dev").privateKey, provider);

    const walletBalance = await provider.getBalance(wallet.address);
    // const walletBalance = await provider.getBalance(wallet.address);
    logger.info(
      `当前地址：${wallet.address}的余额是 ${utils.formatEther(
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
    logger.info(
      `Transfer之后当前地址：${wallet.address}的余额是 ${utils.formatEther(
        afterwalletBalance
      )} ETH`
    );
    for (let i = 0; i < numWallet; i++) {
      let hdNodeNew = hdNode.derivePath(basePath + "/" + i);
      let walletNew = new ethers.Wallet(hdNodeNew.privateKey);
      const balance = await provider.getBalance(walletNew.address);
      logger.info(
        `地址：${walletNew.address} 余额：${utils.formatEther(balance)}`
      );
    }
    // logger.info({ addresses, amounts }, utils.parseEther("0.002"));
    // return { addresses, amounts };
    // return;
  } catch (error) {
    logger.info({ error });
  }
};

const multiTransferToken = async (tokenAddress) => {
  // logger.info("start", config.get("dev"));
  // const mnemonic = utils.entropyToMnemonic(utils.randomBytes(32));
  // logger.info({ mnemonic });
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
    logger.info(
      `当前地址：${wallet.address}的token余额为：${utils.formatUnits(
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
    logger.info(
      `当前地址：${wallet.address}的token余额为：${utils.formatUnits(
        tokenBalance,
        "18"
      )}`
    );
    // const afterwalletBalance = await provider.getBalance(wallet.address);
    // // const walletBalance = await provider.getBalance(wallet.address);
    // logger.info(
    //   `Transfer之后当前地址：${wallet.address}的余额是 ${utils.formatEther(
    //     afterwalletBalance
    //   )} ETH`
    // );
    let balanceArray = [];
    addresses.map((itemAddress) => {
      balanceArray.push(tokenContract.balanceOf(itemAddress));
    });
    balanceArray = await Promise.all(balanceArray);
    balanceArray.map((balanceData, index) =>
      logger.info(
        `地址：${addresses[index]} 余额：${utils.formatEther(balanceData)}`
      )
    );
  } catch (error) {
    logger.info({ error });
  }
};

const exchangeToken = async ({ from, to, amount, slippage = 10 }) => {
  // logger.info({ from: from, to: to });
  const provider = getProvider();
  // const wallet = getMainWallet(provider);
  const { walletArray } = getAddresses();
  // logger.info({ tokenABI });
  const startApproveTime = dayjs().unix();
  logger.info(`开始购买`);
  await Promise.all(
    walletArray.map(async (item, index) => {
      const tokenContract = new ethers.Contract(
        config.get("dev")["97"].token,
        tokenABI,
        item
      );
      const toContract = new ethers.Contract(
        config.get("dev")["97"].USDT,
        tokenABI,
        provider
      );
      const allowance = await tokenContract.allowance(
        item.address,
        config.get("dev")["97"].Router_Address
      );
      logger.info(
        `地址${item.address}对应的授权额度为:${utils.formatUnits(allowance)}`
      );
      if (utils.formatUnits(allowance) < amount) {
        // logger.info({ tokenContract });
        logger.info(`地址${item.address}开始授权`);
        const tx = await tokenContract.approve(
          config.get("dev")["97"].Router_Address,
          utils.parseUnits("1000000000").toString()
        );
        // logger.info({ tx });
        await tx.wait();
        const allowance = await tokenContract.allowance(
          item.address,
          config.get("dev")["97"].Router_Address
        );
        logger.info(
          ` 地址:${item.address} 对Router合约的授权额度：${utils.formatUnits(
            String(allowance)
          )}`
        );
      }
      const routerContract = new ethers.Contract(
        config.get("dev")["97"].Router_Address,
        routerABI,
        item
      );
      const deadline = 5;
      logger.info(`开始查询最少购买的数量`);
      const amounts = await routerContract.getAmountsOut(
        utils.parseUnits(amount),
        [from, to]
      );

      const amountOut = Number(
        Number(utils.formatUnits(amounts[1])) * (1 - slippage / 100)
      ).toFixed(8);
      // logger.info(`最少获得的Token数量为:${amountOut}`);
      // logger.info({ tokenContract });
      const beforeSwapBalance = await toContract.balanceOf(item.address);
      logger.info(
        `地址${item.address}购买前余额${utils.formatUnits(beforeSwapBalance)}`
      );

      const swapTx = await routerContract.swapExactTokensForTokens(
        utils.parseUnits(amount),
        utils.parseUnits(String(amountOut)),
        [from, to],
        item.address,
        Date.now() + 1000 * 60 * deadline
      );
      await swapTx.wait();

      const [balance, blockNumber] = await Promise.all([
        toContract.balanceOf(item.address),
        provider.getBlockNumber(),
      ]);
      // const blockNumber = await provider.getBlockNumber();
      logger.info(`地址${item.address}购买后余额${utils.formatUnits(balance)}`);
      logger.info(
        `地址:${item.address} 购买成功 ,购买金额为：${
          utils.formatUnits(balance) - utils.formatUnits(beforeSwapBalance)
        }`
      );
      logger.info(`当前区块为：${blockNumber}`);
    })
  );
  const endApprovetime = dayjs().unix();
  logger.info(`购买结束，用时${endApprovetime - startApproveTime}秒`);
};

module.exports = {
  multiTransferETH,
  multiTransferToken,
  exchangeToken,
};
