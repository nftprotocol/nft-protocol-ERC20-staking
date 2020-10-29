// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "../includes/ERC20.sol";

// Test ERC20 token for NFT Protocol testing
contract NFTProtocolTest is ERC20 {

  address public minter;

  constructor (string memory name, string memory symbol) public ERC20(name, symbol) {
    minter = msg.sender;
  }

  function mint(address to, uint256 amount) public {
    require(msg.sender == minter, "Only minter can mint");
    _mint(to, amount);
  }

}
