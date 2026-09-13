// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {KYCRegistry} from "../src/KYCRegistry.sol";

contract KYCRegistryTest is Test {
    KYCRegistry public registry;

    address public admin = address(0xAA);
    address public investor = address(0xBB);
    address public unauthorizedUser = address(0xCC);

    function setUp() public {
        // Deploy the contract with `admin` as the deployer (msg.sender)
        vm.prank(admin);
        registry = new KYCRegistry();
    }

    function test_AdminIsCorrect() public view {
        assertEq(registry.admin(), admin);
    }

    function test_VerifyInvestor_Success() public {
        // Only admin can verify
        vm.prank(admin);
        registry.verifyInvestor(investor);

        assertTrue(registry.isVerified(investor));
    }

    function test_VerifyInvestor_RevertIf_NotAdmin() public {
        // Prank an unauthorized caller
        vm.prank(unauthorizedUser);

        // Expect the custom error CallerNotAdmin(unauthorizedUser)
        vm.expectRevert(abi.encodeWithSelector(KYCRegistry.CallerNotAdmin.selector, unauthorizedUser));
        registry.verifyInvestor(investor);
    }

    function test_VerifyInvestor_RevertIf_ZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(KYCRegistry.InvalidZeroAddress.selector);
        registry.verifyInvestor(address(0));
    }

    function test_RevokeInvestor_Success() public {
        // First verify
        vm.prank(admin);
        registry.verifyInvestor(investor);
        assertTrue(registry.isVerified(investor));

        // Then revoke
        vm.prank(admin);
        registry.revokeInvestor(investor);
        assertFalse(registry.isVerified(investor));
    }
}