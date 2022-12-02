var express = require("express");
var router = express.Router();
var {
  multiTransferETH,
  multiTransferToken,
  exchangeToken,
} = require("../store/start");
var { utils } = require("ethers");
/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
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
  const tokenFrom = req.query.from;
  const tokenTo = req.query.to;
  if (utils.isAddress(tokenFrom) && utils.isAddress(tokenTo)) {
    const data = await exchangeToken(tokenFrom, tokenTo);

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
