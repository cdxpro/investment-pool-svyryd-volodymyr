const FinPool = artifacts.require("FinPool");

const initialSupply = 10000000;

contract("FinPool test", async (accounts) => {

  beforeEach(async () => {
    this.instance = await FinPool.deployed();
  });
  

  it(`should put ${initialSupply} FinPool tokens in the first account`, async () => {
    const balance = await this.instance.balanceOf(accounts[0]);

    assert.equal(web3.utils.fromWei(balance), initialSupply);
  });
});