// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Institutional KYC Registry for Marketnode Asset Compliance
/// @notice Manages verified institutional investor wallet statuses
contract KYCRegistry {
    // -------------------------------------------------------------
    // STATE VARIABLES
    // -------------------------------------------------------------

    address public immutable admin;

    // Mapping: wallet address => KYC verified status
    mapping(address => bool) private _isKYCVerified;

    // -------------------------------------------------------------
    // CUSTOM ERRORS (Gas-Optimized)
    // -------------------------------------------------------------

    error CallerNotAdmin(address caller);
    error InvalidZeroAddress();
    error InvestorAlreadyVerified(address investor);
    error InvestorNotVerified(address investor);

    // -------------------------------------------------------------
    // EVENTS (For Middleware Indexers)
    // -------------------------------------------------------------

    event InvestorVerified(address indexed investor, address indexed approvedBy);
    event InvestorRevoked(address indexed investor, address indexed revokedBy);

    // -------------------------------------------------------------
    // MODIFIERS
    // -------------------------------------------------------------

    modifier onlyAdmin() {
        if (msg.sender != admin) {
            revert CallerNotAdmin(msg.sender);
        }
        _;
    }

    // -------------------------------------------------------------
    // CONSTRUCTOR
    // -------------------------------------------------------------

    constructor() {
        admin = msg.sender;
    }

    // -------------------------------------------------------------
    // EXTERNAL FUNCTIONS
    // -------------------------------------------------------------

    /// @notice Grants KYC verification to an institutional investor
    function verifyInvestor(address investor) external onlyAdmin {
        if (investor == address(0)) revert InvalidZeroAddress();
        if (_isKYCVerified[investor]) revert InvestorAlreadyVerified(investor);

        _isKYCVerified[investor] = true;
        emit InvestorVerified(investor, msg.sender);
    }

    /// @notice Revokes KYC verification if an investor fails ongoing compliance checks
    function revokeInvestor(address investor) external onlyAdmin {
        if (!_isKYCVerified[investor]) revert InvestorNotVerified(investor);

        _isKYCVerified[investor] = false;
        emit InvestorRevoked(investor, msg.sender);
    }

    /// @notice Read-only view function to check an investor's status
    function isVerified(address investor) external view returns (bool) {
        return _isKYCVerified[investor];
    }
}