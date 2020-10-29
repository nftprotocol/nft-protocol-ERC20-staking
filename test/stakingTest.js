const {expectRevert, time, constants, BN} = require('@openzeppelin/test-helpers');
const ganacheTime = require('ganache-time-traveler');
const ERC20 = artifacts.require('ERC20');
const NFTT = artifacts.require('NFTProtocolTest');
const Staking = artifacts.require('NFTStaking');

contract('NFTStaking', function (accounts) {

  let network = 'development';
  let alice = accounts[0];
  let bob = accounts[1];
  let eve = accounts[2];
  let snapshotBeforeEach;
  let snapshotGenesis;
  let test = {};

  // Setup test timeline
  before(async function () {
    // Take genesis snapshot to ensure local ganache begins on a clean slate
    snapshotGenesis = (await ganacheTime.takeSnapshot())["result"];

    // Deploy contracts
    test.nftt = await NFTT.new("Local NFTT", "lNFTT", {from: alice});
    test.staking = await Staking.new(test.nftt.address, {from: alice});

  });

  beforeEach(async function () {
    snapshotBeforeEach = (await ganacheTime.takeSnapshot())["result"];
    console.log(`#### Testing ${this.currentTest.fullTitle()} ####`);
  });

  afterEach(async function () {
    console.log(`#### End test ${this.currentTest.fullTitle()} ####`);
    await ganacheTime.revertToSnapshot(snapshotBeforeEach);
  });

  after(async function () {
    await ganacheTime.revertToSnapshot(snapshotGenesis);
  });

  async function deposit(user, tokens) {
    if (typeof(user) == 'undefined') user = alice;
    if (typeof(tokens) == 'undefined') tokens = 10000;

    await test.nftt.approve(test.staking.address, tokens, {from: user});
    await test.nftt.mint(user, tokens, {from: alice, gasPrice: web3.utils.toHex(0)});

    await test.staking.deposit(tokens, {from: user});
  }

  async function fundStakingRewards() {
    // Transfer 750,000 NFT to staking contract
    await test.nftt.mint(alice, web3.utils.toWei('750000'), {from: alice, gasPrice: web3.utils.toHex(0)});
    await test.nftt.transfer(test.staking.address, web3.utils.toWei('750000'), {from: alice, gasPrice: web3.utils.toHex(0)});
  }

  it('deposit before staking begins', async function () {
    await expectRevert(
        deposit(alice, web3.utils.toWei('50000', 'ether')),
        'staking has not begun yet'
    );
  });

  it('deposit before staking rewards sent to contract', async function () {
    await expectRevert(
        test.staking.beginStaking({from: alice}),
        'not enough staking rewards'
    );
  });

  it('deposit', async function () {
    await fundStakingRewards();
    let depositAmount = web3.utils.toWei('50000', 'ether');
    await test.staking.beginStaking({from: alice});
    await deposit(alice, depositAmount);
    await time.increase(time.duration.seconds(86000 * 75)); // 75 days

    // Deposit should fail if we're over 60 days from start time
    await expectRevert(
        deposit(alice, web3.utils.toWei('50000', 'ether')),
        'contract staking deposit time period over'
    );
  });

  it('one user deposits one time', async function () {
    await fundStakingRewards();
    let depositAmount = web3.utils.toWei('10000', 'ether');
    await test.staking.beginStaking({from: alice});
    await deposit(alice, depositAmount);
    await time.increase(time.duration.seconds(86000 * 10)); // 10 days
    let user_yield = await test.staking.getUserYield(alice);
    assert.equal(user_yield.toString(), (0).toString());
    await time.increase(time.duration.seconds(86000 * 21)); // 31 days
    user_yield = await test.staking.getUserYield(alice);
    assert.equal(user_yield.toString(), (web3.utils.toWei('200').toString()));
    await time.increase(time.duration.seconds(86000 * 15)); // 46 days
    user_yield = await test.staking.getUserYield(alice);
    assert.equal(user_yield.toString(), (web3.utils.toWei('300').toString()));
    await time.increase(time.duration.seconds(86000 * 15)); // 61 days
    user_yield = await test.staking.getUserYield(alice);
    assert.equal(user_yield.toString(), (web3.utils.toWei('500').toString()));
    await time.increase(time.duration.seconds(86000 * 30)); // 91 days
    user_yield = await test.staking.getUserYield(alice);
    assert.equal(user_yield.toString(), (web3.utils.toWei('1000').toString()));
  });

  it('one user deposits two times', async function () {
    await fundStakingRewards();
    let depositAmount = web3.utils.toWei('10000', 'ether');
    await test.staking.beginStaking({from: alice});
    await deposit(alice, depositAmount);
    await time.increase(time.duration.seconds(86000 * 10)); // 10 days
    let user_yield = await test.staking.getUserYield(alice);
    assert.equal(user_yield.toString(), (0).toString());
    await time.increase(time.duration.seconds(86000 * 21)); // 31 days
    user_yield = await test.staking.getUserYield(alice);
    assert.equal(user_yield.toString(), (web3.utils.toWei('200').toString()));
    await deposit(alice, depositAmount);
    await time.increase(time.duration.seconds(86000 * 16)); // 47 days
    user_yield = await test.staking.getUserYield(alice);
    assert.equal(user_yield.toString(), (web3.utils.toWei('300').toString()));
    await time.increase(time.duration.seconds(86000 * 16)); // 63 days
    user_yield = await test.staking.getUserYield(alice);
    assert.equal(user_yield.toString(), (web3.utils.toWei('700').toString()));
    await time.increase(time.duration.seconds(86000 * 33)); // 94 days
    user_yield = await test.staking.getUserYield(alice);
    assert.equal(user_yield.toString(), (web3.utils.toWei('1500').toString()));
  });

  it('one user deposits once and withdraws all', async function () {
    let begin_block = await web3.eth.getBlockNumber();
    await fundStakingRewards();
    let depositAmount = web3.utils.toWei('10000', 'ether');
    await test.staking.beginStaking({from: alice});
    await deposit(alice, depositAmount);
    await time.increase(time.duration.seconds(86000 * 91)); // 91 days
    await test.staking.withdrawAll({from: alice});
    let alice_bal = await test.nftt.balanceOf(alice);
    console.log(alice_bal.toString());
    let end_block = await web3.eth.getBlockNumber();
    await expectRevert(
        test.staking.withdrawAll({from: alice}),
        'nothing to withdraw'
    );
    printLogs(test.staking, begin_block, end_block);
  });

  it('one user deposits five times and withdraws all', async function () {
    let begin_block = await web3.eth.getBlockNumber();
    await fundStakingRewards();
    let depositAmount = web3.utils.toWei('10000', 'ether');
    await test.staking.beginStaking({from: alice});
    await deposit(alice, depositAmount);
    await deposit(alice, depositAmount);
    await deposit(alice, depositAmount);
    await deposit(alice, depositAmount);
    await deposit(alice, depositAmount);
    await time.increase(time.duration.seconds(86000 * 91)); // 91 days
    await test.staking.withdrawAll({from: alice});
    let alice_bal = await test.nftt.balanceOf(alice);
    console.log('nft balance: ', alice_bal.toString());
    assert.equal(alice_bal.toString(), web3.utils.toWei('55000', 'ether'));
    let end_block = await web3.eth.getBlockNumber();
    printLogs(test.staking, begin_block, end_block);
  });

  it('one user deposits once, another deposits twice, and the two withdraws all', async function () {
    let begin_block = await web3.eth.getBlockNumber();
    await fundStakingRewards();
    let depositAmount = web3.utils.toWei('10000', 'ether');
    await test.staking.beginStaking({from: alice});
    await deposit(alice, depositAmount);
    await deposit(bob, depositAmount);
    await deposit(bob, depositAmount);
    await time.increase(time.duration.seconds(86000 * 91)); // 91 days
    await test.staking.withdrawAll({from: alice});
    await test.staking.withdrawAll({from: bob});
    let alice_bal = await test.nftt.balanceOf(alice);
    console.log(alice_bal.toString());
    assert.equal(alice_bal.toString(), web3.utils.toWei('11000', 'ether'));
    let bob_bal = await test.nftt.balanceOf(bob);
    console.log(bob_bal.toString());
    assert.equal(bob_bal.toString(), web3.utils.toWei('22000', 'ether'));
    let end_block = await web3.eth.getBlockNumber();
    // check that withdraw doesn't work if you've already removed all your
    // funds
    await expectRevert(
        test.staking.withdrawAll({from: alice}),
        'nothing to withdraw'
    );
    await expectRevert(
        test.staking.withdrawAll({from: bob}),
        'nothing to withdraw'
    );
    printLogs(test.staking, begin_block, end_block);
  });

  it('one user attempts to deposit six times', async function () {
    let begin_block = await web3.eth.getBlockNumber();
    await fundStakingRewards();
    let depositAmount = web3.utils.toWei('10000', 'ether');
    await test.staking.beginStaking({from: alice});
    await deposit(alice, depositAmount);
    await deposit(alice, depositAmount);
    await deposit(alice, depositAmount);
    await deposit(alice, depositAmount);
    await deposit(alice, depositAmount);
    await expectRevert(
        deposit(alice, web3.utils.toWei('50000', 'ether')),
        'users can only have 5 total deposits'
    );
  });

  async function printLogs(contract, _fromBlock, _toBlock) {
    let logs = await contract.getPastEvents("allEvents", {fromBlock: _fromBlock, toBlock: _toBlock});
    for (log of logs) {
      let tmp = {}
      let allNum = true
      for (const property in log.returnValues) {
        if (Object.prototype.hasOwnProperty.call(log.returnValues, property) && !Number.isInteger(parseInt(property))) {
          allNum = false;
          tmp[property] = log.returnValues[property];
        }
      }
      console.log(log.event, allNum ? log.returnValues : tmp);
    }
  }

});
