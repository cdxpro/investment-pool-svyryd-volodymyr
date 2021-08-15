const truffleAssert = require('truffle-assertions');
const Deposit = artifacts.require('Deposit');
const FinPool = artifacts.require('FinPool');

const initialSupply = 10000000;

contract('Deposit', async (accounts) => {
  async function initDepositor(depositPoolAddress, erc20Instance, account, amount) {
    await erc20Instance.approve(depositPoolAddress, amount, { from: account });
    await erc20Instance.transfer(account, amount);
  }

  beforeEach(async () => {
    tokenInstance = await FinPool.new(initialSupply);
    depositInstance = await Deposit.new(tokenInstance.address);
  });

  it(`initial eth balance should be equal 0`, async () => {
    const balance = await depositInstance.getEthBalance();

    assert.equal(balance, 0);
  });

  it(`deposit with eth should be successful`, async () => {
    const depositor = accounts[1];
    const ethBalanceBefore = await depositInstance.getEthBalance({ from: depositor });
    const depositAmount = web3.utils.toBN(10);
    const result = await depositInstance.depositEth(depositAmount, { from: depositor, value: depositAmount });

    truffleAssert.eventEmitted(result, 'EthDeposited', {
      account: depositor,
      depositedAmount: depositAmount,
    });

    const ethBalanceAfter = web3.utils.toBN(Number(await depositInstance.getEthBalance({ from: depositor })));
    assert.equal(ethBalanceAfter.toNumber(), web3.utils.toBN(ethBalanceBefore + depositAmount).toNumber());
  });

  it(`withdraw eth should be successful`, async () => {
    const depositor = accounts[1];
    const depositAmount = web3.utils.toBN(10);
    await depositInstance.depositEth(depositAmount, { from: depositor, value: depositAmount });

    const depositBefore = await depositInstance.getEthBalance({ from: depositor });
    const withdrawAmount = web3.utils.toBN(7);
    const result = await depositInstance.withdrawEth(withdrawAmount, { from: depositor, value: withdrawAmount });

    truffleAssert.eventEmitted(result, 'EthWithdrawn', {
      account: depositor,
      withdrawnAmount: withdrawAmount,
    });

    const ethBalanceAfter = web3.utils.toBN(Number(await depositInstance.getEthBalance({ from: depositor })));
    assert.equal(ethBalanceAfter.toNumber(), web3.utils.toBN(depositBefore - withdrawAmount).toNumber());
  });

  it(`withdraw eth should not be successful due to caller doesn't have enough funds`, async () => {
    const depositor = accounts[1];
    const depositAmount = web3.utils.toBN(10);
    await depositInstance.depositEth(depositAmount, { from: depositor, value: depositAmount });

    const withdrawAmount = web3.utils.toBN(100);

    await truffleAssert.reverts(
      depositInstance.withdrawEth(withdrawAmount, { from: depositor, value: withdrawAmount }),
      'not enough funds.',
    );
  });

  it(`deposit and withdrawal settings for not stored token should be disabled`, async () => {
    const {
      0: address,
      1: isWithdrawalAllowed,
      2: isDepositAllowed,
    } = await depositInstance.getTokenSettings(FinPool.address);

    assert.equal(address, FinPool.address, 'incorrect address');
    assert.equal(isWithdrawalAllowed, false, 'withdrawal should be disabled');
    assert.equal(isDepositAllowed, false, 'deposit should be disabled');
  });

  it(`token settings should be stored successfully`, async () => {
    await depositInstance.storeTokenSettings(FinPool.address, true, true);
    const {
      0: address,
      1: isWithdrawalAllowed,
      2: isDepositAllowed,
    } = await depositInstance.getTokenSettings(FinPool.address);

    assert.equal(address, FinPool.address, 'incorrect address');
    assert.equal(isWithdrawalAllowed, true, 'withdrawal should be enabled');
    assert.equal(isDepositAllowed, true, 'deposit should be enabled');
  });

  it(`token settings should not be stored due to caller is not the owner`, async () => {
    await truffleAssert.reverts(
      depositInstance.storeTokenSettings(FinPool.address, true, true, { from: accounts[1] }),
      'Ownable: caller is not the owner',
    );
  });

  it(`token settings should be updated successfully`, async () => {
    await depositInstance.storeTokenSettings(FinPool.address, true, true);
    const {
      0: address,
      1: isWithdrawalAllowed,
      2: isDepositAllowed,
    } = await depositInstance.getTokenSettings(FinPool.address);

    assert.equal(address, FinPool.address, 'incorrect address');
    assert.equal(isWithdrawalAllowed, true, 'withdrawal should be enabled');
    assert.equal(isDepositAllowed, true, 'deposit should be enabled');

    await depositInstance.storeTokenSettings(FinPool.address, false, false);
    const {
      0: afterUpdateAddress,
      1: afterUpdateIsWithdrawalAllowed,
      2: afterUpdateIsDepositAllowed,
    } = await depositInstance.getTokenSettings(FinPool.address);

    assert.equal(afterUpdateAddress, FinPool.address, 'incorrect address');
    assert.equal(afterUpdateIsWithdrawalAllowed, false, 'withdrawal should be disabled');
    assert.equal(afterUpdateIsDepositAllowed, false, 'deposit should be disabled');
  });

  it(`deposit with token should be successful`, async () => {
    const depositor = accounts[1];
    await depositInstance.storeTokenSettings(tokenInstance.address, true, true);
    await initDepositor(depositInstance.address, tokenInstance, depositor, web3.utils.toBN(25));

    const tokenBalanceBefore = await depositInstance.getTokenBalance(tokenInstance.address, { from: depositor });
    const depositAmount = web3.utils.toBN(25);
    const result = await depositInstance.depositToken(tokenInstance.address, depositAmount, {
      from: depositor,
      value: depositAmount,
    });

    truffleAssert.eventEmitted(result, 'TokenDeposited', {
      account: depositor,
      token: tokenInstance.address,
      depositedAmount: depositAmount,
    });

    const tokenBalanceAfter = web3.utils.toBN(
      Number(await depositInstance.getTokenBalance(tokenInstance.address, { from: depositor })),
    );
    assert.equal(tokenBalanceAfter.toNumber(), web3.utils.toBN(tokenBalanceBefore + depositAmount).toNumber());
  });

  it(`deposit with token should not be successful due to deposit is not allowed for current token`, async () => {
    const depositor = accounts[1];
    await depositInstance.storeTokenSettings(tokenInstance.address, true, false);
    const depositAmount = web3.utils.toBN(25);
    await initDepositor(depositInstance.address, tokenInstance, depositor, web3.utils.toBN(25));

    await truffleAssert.reverts(
      depositInstance.depositToken(tokenInstance.address, depositAmount, { from: depositor, value: depositAmount }),
      'deposit for this token is not allowed.',
    );
  });

  it(`withdrawal with token should be successful`, async () => {
    const depositor = accounts[1];
    await depositInstance.storeTokenSettings(tokenInstance.address, true, true);
    await initDepositor(depositInstance.address, tokenInstance, depositor, web3.utils.toBN(25));

    const depositAmount = web3.utils.toBN(25);
    await depositInstance.depositToken(tokenInstance.address, depositAmount, { from: depositor, value: depositAmount });
    const tokenBalanceBefore = await depositInstance.getTokenBalance(tokenInstance.address, { from: depositor });

    const withdrawAmount = web3.utils.toBN(20);
    const result = await depositInstance.withdrawToken(tokenInstance.address, withdrawAmount, {
      from: depositor,
      value: withdrawAmount,
    });

    truffleAssert.eventEmitted(result, 'TokenWithdrawn', {
      account: depositor,
      token: tokenInstance.address,
      withdrawnAmount: withdrawAmount,
    });

    const tokenBalanceAfter = web3.utils.toBN(
      Number(await depositInstance.getTokenBalance(tokenInstance.address, { from: depositor })),
    );

    assert.equal(tokenBalanceAfter.toNumber(), web3.utils.toBN(tokenBalanceBefore - withdrawAmount).toNumber());
  });

  it(`withdrawal with token should not be successful due to withdrawal is not allowed for current token`, async () => {
    const depositor = accounts[1];
    await depositInstance.storeTokenSettings(tokenInstance.address, false, true);
    const withdrawalAmount = web3.utils.toBN(25);
    await initDepositor(depositInstance.address, tokenInstance, depositor, web3.utils.toBN(25));

    await truffleAssert.reverts(
      depositInstance.withdrawToken(tokenInstance.address, withdrawalAmount, {
        from: depositor,
        value: withdrawalAmount,
      }),
      'withdraw for this token is not allowed.',
    );
  });

  it(`withdraw eth should not be successful due to caller doesn't have enough funds`, async () => {
    const depositor = accounts[1];
    await depositInstance.storeTokenSettings(tokenInstance.address, true, true);
    const withdrawalAmount = web3.utils.toBN(25);

    await truffleAssert.reverts(
      depositInstance.withdrawToken(tokenInstance.address, withdrawalAmount, {
        from: depositor,
        value: withdrawalAmount,
      }),
      'not enough funds.',
    );
  });
});
