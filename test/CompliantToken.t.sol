// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {KYCRegistry} from "../src/KYCRegistry.sol";
import {CompliantToken} from "../src/CompliantToken.sol";

contract CompliantTokenTest is Test {
    KYCRegistry public registry;
    CompliantToken public token;

    address public admin = address(0xAA);
    address public investorA = address(0x11);
    address public investorB = address(0x22);
    address public unverifiedUser = address(0x99);

    function setUp() public {
        vm.startPrank(admin);
        
        // 1. Deploy KYC Registry
        registry = new KYCRegistry();
        
        // 2. Deploy Compliant Token linked to the registry
        token = new CompliantToken("Marketnode Cash", "MNCASH", address(registry), admin);

        // 3. Verify investorA and investorB in the registry
        registry.verifyInvestor(investorA);
        registry.verifyInvestor(investorB);

        // 4. Mint 1,000 units to investorA
        token.mint(investorA, 1_000 * 1e18);

        vm.stopPrank();
    }

    function test_Transfer_Success_BetweenVerifiedInvestors() public {
        vm.prank(investorA);
        token.transfer(investorB, 200 * 1e18);

        assertEq(token.balanceOf(investorA), 800 * 1e18);
        assertEq(token.balanceOf(investorB), 200 * 1e18);
    }

    function test_Transfer_RevertIf_ReceiverNotVerified() public {
        vm.prank(investorA);
        
        // Expect revert because unverifiedUser has not passed KYC
        vm.expectRevert(
            abi.encodeWithSelector(CompliantToken.ReceiverNotKYCVerified.selector, unverifiedUser)
        );
        token.transfer(unverifiedUser, 100 * 1e18);
    }

    function test_Transfer_RevertIf_SenderKYCRevoked() public {
        // Revoke investorA's KYC
        vm.prank(admin);
        registry.revokeInvestor(investorA);

        // investorA attempts to transfer
        vm.prank(investorA);
        vm.expectRevert(
            abi.encodeWithSelector(CompliantToken.SenderNotKYCVerified.selector, investorA)
        );
        token.transfer(investorB, 100 * 1e18);
    }
    function testFuzz_Transfer_ValidAmounts(uint256 transferAmount) public {
        uint256 initialBalance = 1_000 * 1e18;

        // Bound transferAmount between 1 and initialBalance (1_000 tokens)
        transferAmount = bound(transferAmount, 1, initialBalance);

        vm.prank(investorA);
        token.transfer(investorB, transferAmount);

        assertEq(token.balanceOf(investorA), initialBalance - transferAmount);
        assertEq(token.balanceOf(investorB), transferAmount);
    }
}
