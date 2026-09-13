// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {KYCRegistry} from "./KYCRegistry.sol";

/// @title Compliant Institutional Settlement Token
/// @notice ERC-20 token where all transfers are validated by an on-chain KYC registry
contract CompliantToken is ERC20, Ownable {
    KYCRegistry public immutable kycRegistry;

    // Custom errors for failed compliance
    error SenderNotKYCVerified(address sender);
    error ReceiverNotKYCVerified(address receiver);
    error ZeroRegistryAddress();

    constructor(
        string memory name,
        string memory symbol,
        address _kycRegistry,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        if (_kycRegistry == address(0)) revert ZeroRegistryAddress();
        kycRegistry = KYCRegistry(_kycRegistry);
    }

    /// @notice Allows the contract owner (Marketnode admin) to mint tokens to an authorized entity
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @dev Core OpenZeppelin v5 hook executed before any balance update
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        // Bypass checks on minting (from == 0) and burning (to == 0)
        // For standard peer-to-peer transfers, both parties must be verified
        if (from != address(0) && !kycRegistry.isVerified(from)) {
            revert SenderNotKYCVerified(from);
        }

        if (to != address(0) && !kycRegistry.isVerified(to)) {
            revert ReceiverNotKYCVerified(to);
        }

        // Proceed with the internal ERC20 balance mutation
        super._update(from, to, value);
    }
}