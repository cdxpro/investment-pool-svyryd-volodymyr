// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import './FinPool.sol';

contract Deposit is Ownable {
    using SafeERC20 for IERC20;

    mapping(address => uint256) private ethBalances;

    mapping(IERC20 => mapping(address => uint256)) private tokensBalances;

    mapping(IERC20 => TokenSettings) private tokensSettings;

    struct TokenSettings {
        bool isWithdrawalAllowed;
        bool isDepositAllowed;
    }

    function getTokenSettings(IERC20 _tokenAddress)
        public
        view
        returns (
            IERC20,
            bool,
            bool
        )
    {
        bool isWithdrawalAllowed = tokensSettings[_tokenAddress].isWithdrawalAllowed;
        bool isDepositAllowed = tokensSettings[_tokenAddress].isDepositAllowed;

        return (_tokenAddress, isWithdrawalAllowed, isDepositAllowed);
    }

    function storeTokenSettings(
        IERC20 _tokenAddress,
        bool _isWithdrawalAllowed,
        bool _isDepositAllowed
    ) public onlyOwner returns (bool) {
        TokenSettings memory settings = TokenSettings({
            isWithdrawalAllowed: _isWithdrawalAllowed,
            isDepositAllowed: _isDepositAllowed
        });
        tokensSettings[_tokenAddress] = settings;

        return true;
    }

    function getEthBalance() public view returns (uint256) {
        return ethBalances[msg.sender];
    }

    function depositEth(uint256 _amount) external payable {
        ethBalances[msg.sender] = ethBalances[msg.sender] + _amount;
        emit EthDeposited(msg.sender, _amount);
    }

    function withdrawEth(uint256 _amount) external payable {
        require(ethBalances[msg.sender] >= _amount, 'not enough funds.');

        ethBalances[msg.sender] = ethBalances[msg.sender] - _amount;

        payable(msg.sender).transfer(_amount);

        emit EthWithdrawn(msg.sender, _amount);
    }

    function getTokenBalance(IERC20 _tokenAddress) public view returns (uint256) {
        return tokensBalances[_tokenAddress][msg.sender];
    }

    function depositToken(IERC20 _tokenAddress, uint256 _amount) external payable {
        require(tokensSettings[_tokenAddress].isDepositAllowed, 'deposit for this token is not allowed.');

        address from = msg.sender;
        address to = address(this);

        _tokenAddress.transferFrom(from, to, _amount);
        tokensBalances[_tokenAddress][msg.sender] = tokensBalances[_tokenAddress][msg.sender] + _amount;

        emit TokenDeposited(msg.sender, _tokenAddress, _amount);
    }

    function withdrawToken(IERC20 _tokenAddress, uint256 _amount) external payable {
        require(tokensSettings[_tokenAddress].isWithdrawalAllowed, 'withdraw for this token is not allowed.');
        require(tokensBalances[_tokenAddress][msg.sender] >= _amount, 'not enough funds.');

        tokensBalances[_tokenAddress][msg.sender] = tokensBalances[_tokenAddress][msg.sender] - _amount;
        _tokenAddress.safeTransfer(msg.sender, _amount);

        emit TokenWithdrawn(msg.sender, _tokenAddress, _amount);
    }

    event TokenDeposited(address account, IERC20 token, uint256 depositedAmount);
    event TokenWithdrawn(address account, IERC20 token, uint256 withdrawnAmount);

    event EthDeposited(address account, uint256 depositedAmount);
    event EthWithdrawn(address account, uint256 withdrawnAmount);
}
