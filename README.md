# staking notes
https://snapshot.page/#/nft/proposal/QmPxcWrWvcUL8ijAV2ArVHpgcCzoZBYNgsjSKqBusiQVYk
## CONTRACT DEPLOYMENT
### NFT staking contract (kovan)
```
2020-10-25T18:13:20-0400
0x4370b0E937c7881d47b7Bbe871Ad5D95572DB2F0

2020-10-21T19:30:05-0400
0x73765A8d6C125CD926c015f1AB97c1608c7f8334
```

### NFT Protocol token (kovan)
`0xB5a9f4270157BeDe68070df7A070525644fc782D`

## getters
### `active bool`
Indicates whether or not the contract has begun the staking deposit period with `beginStaking()`.
The staking deposit period determines whether or not users can deposit into the contract.
It also initializes the `startTime` and `cutoffTime` state variables that define the staking deposit period.

### `uint256 cutOffTime`
Time when the staking deposit period ends.

### `uint256 totalDeposited`
All of the deposited NFT tokens (in wei) that have been added to the contract. Think of this as a balanceOf call for the contract. Should match `NFTProtocolToken.balanceOf(contractAddress)`.

### `function getUserDeposits(address) returns tuple(uint256) length:2`
Returns a list of tuples (a comma-separated list of comma separated lists of length two). For example, if the user has the following two deposits:
```
12000 DAI
1603310000 timestamp

13000 DAI
1603310400 timestamp
```

Then getUserDeposits will return the following:
`12000,1603310000,13000,1603310400`
* This can be used to display a transaction history on the front-end

### `function getUserYield(address) returns uint256`
Gets the current earnings for the user by adding up all of their earnings for each deposit.

### `uint256 userFunds`
Total number of user funds held in the contract at the moment.

### `uint256 stakingFunds`
Total number of rewards remaining.

### `uint256 totalDeposited`
Aggregate NFT Protocol tokens deposited.

### `uint256 maxStakingAmount`
Maximum amount of tokens a user is authorized to deposit into the staking pool.

### `uint256 maxContractStakingCapacity`
The maximum staking amount that all users are able to add to the contract. 
The remaining capacity for staking in the contract is `maxStakingCapacity - totalDeposited` or `userFunds`.

### `uint256 minStakingAmount`
Minimum NFT protocol tokens that the user is authorized to deposit. User gets a revert if they try to deposit less than this amount.

### `uint256 numUserDeposits`
Number of times the user has deposited already.

### `uint256 userMaxDeposits`
Maximum amount of times any user is able to deposit.

### `userDeposits`
Returns an array of tuples with user deposits (deposit amount, timestamp).

### `uint256 startTime`
Start time for the deposit period.

### `uint256 totalRewardSupply` 
Number of NFT tokens in the pool remaining to be awarded to the staking users.

### `uint256 constant userMaxDeposits`
Constant state variable determining how many deposits a single user can make.

-----------------------------------------------------------

## Optional getters

### `function getYieldMultiplier(uint256) returns uint256`
Takes in a number of days and returns the current yield multiplier for that day.

### `address governance`
Gets the governance address for the contract.

### `allStakingUsers(uint256) returns address`
Returns the address of a staking user by its index.

