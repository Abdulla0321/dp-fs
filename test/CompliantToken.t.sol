// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {KYCRegistry} from "../src/KYCRegistry.sol";
import {CompliantToken} from "../src/CompliantToken.sol";

contract CompliantTokenTest is Test {
    KYCRegistry public registry;
    CompliantToken public token;

    address public admin = address(this);
    address public verifiedUser = address(0x1);
    address public unverifiedUser = address(0x2);

    function setUp() public {
        registry = new KYCRegistry();
        token = new CompliantToken("MarketnodeCash", "MNCASH", address(registry), admin);

        registry.verifyInvestor(verifiedUser);
    }

    function testMintToVerifiedUser() public {
        token.mint(verifiedUser, 1000e18);
        assertEq(token.balanceOf(verifiedUser), 1000e18);
    }

    function testRevertWhenMintToUnverifiedUser() public {
        vm.expectRevert(abi.encodeWithSelector(CompliantToken.ReceiverNotKYCVerified.selector, unverifiedUser));
        token.mint(unverifiedUser, 1000e18);
    }
}
