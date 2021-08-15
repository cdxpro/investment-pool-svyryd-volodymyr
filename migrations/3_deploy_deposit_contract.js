const Deposit = artifacts.require("Deposit");
const FinPool = artifacts.require("FinPool");

const initialSupply = 10000000;

module.exports = function(deployer, network, accounts) {
    deployer.then(async () => {
        await deployer.deploy(Deposit);
    });
};
