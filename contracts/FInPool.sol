// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FinPool is ERC20 {
    constructor(uint256 initialSupply) ERC20("FinPool", "FPL") {
        _mint(msg.sender, initialSupply * (10**decimals()));
    }

    function decimals() public override pure returns (uint8) {
        return 18;
    }
}
