var express = require("express");
var router = express.Router();
var {
  multiTransferETH,
  multiTransferToken,
  exchangeToken,
} = require("../store/start");
var { utils } = require("ethers");
var { logger } = require("../logger");

/* GET home page. */
router.get("/", function (req, res, next) {
  logger.info("home page");

  res.render("index", { title: "Express" });
});

router.get("/index", function (req, res, next) {
  logger.info("home page");

  res.json({ title: "Express" });
});

router.get("/transfer/ETH", async (req, res, next) => {
  const data = await multiTransferETH();

  res.json({
    title: "Express",
    data: {
      code: 0,
      result: "success",
      data: data,
    },
  });
});

router.get("/transfertoken", async (req, res, next) => {
  if (utils.isAddress(req.query.token)) {
    const data = await multiTransferToken(req.query.token);

    res.json({
      title: "Express",
      data: {
        code: 0,
        result: "success",
        data: data,
      },
    });
  } else {
    res.json({
      data: {
        code: 10001,
        result: "error",
        data: "address is not a valid address",
      },
    });
  }
});

router.get("/exchange", async (req, res, next) => {
  // console.log({ req });
  const { from, to, amount, slippage } = req.query;
  // const tokenTo = req.query.to;
  if (utils.isAddress(from) && utils.isAddress(to)) {
    const data = await exchangeToken({ from, to, amount, slippage });

    res.json({
      title: "Express",
      data: {
        code: 0,
        result: "success",
        data,
      },
    });
  } else {
    res.json({
      data: {
        code: 10001,
        result: "error",
        data: "address is not a valid address",
      },
    });
  }
});

module.exports = router;
