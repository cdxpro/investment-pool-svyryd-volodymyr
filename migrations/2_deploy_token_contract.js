const FinPool = artifacts.require("FinPool");

const initialSupply = 10000000;

module.exports = function (deployer) {
  deployer.deploy(FinPool, initialSupply);
};

