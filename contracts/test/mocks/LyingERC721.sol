// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @title LyingERC721
/// @notice A hostile collection modelling the exact fund-loss vector the
///         allowlist closes. Its `ownerOf` lies: it reports the pre-set
///         `expected` owner before the "transfer" and the `recipient` after,
///         while `transferFrom`/`safeTransferFrom` are no-ops that move nothing.
///
///         Against such a contract BOTH of Handshake's runtime NFT guards are
///         defeated — the pre-transfer `ownerOf == expectedOwner` check passes
///         (it returns `expected`), and the post-transfer `ownerOf == to`
///         effectiveness check also passes (it returns `recipient`) — even
///         though no token ever moved. The only real defense is to never let a
///         non-allowlisted address be traded in the first place, which is what
///         `_verifyNFTs` now enforces before it ever calls into the collection.
///         Approvals return permissive values so that, absent the allowlist, the
///         attack would sail straight through.
contract LyingERC721 is IERC721 {
    address public expected; // who ownerOf claims to be before the fake transfer
    address public recipient; // who ownerOf claims to be after the fake transfer
    bool public moved;

    /// @param expected_  owner the lie reports pre-"transfer" (== order's expectedOwner)
    /// @param recipient_ owner the lie reports post-"transfer" (== settlement's `to`)
    function setLie(address expected_, address recipient_) external {
        expected = expected_;
        recipient = recipient_;
    }

    function ownerOf(uint256) external view returns (address) {
        return moved ? recipient : expected;
    }

    // No-op transfers: nothing actually changes hands, we only flip the lie.
    function transferFrom(address, address, uint256) public {
        moved = true;
    }

    function safeTransferFrom(address, address, uint256) public {
        moved = true;
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) public {
        moved = true;
    }

    // Permissive approvals so the attack would pass the approval gate too.
    function approve(address, uint256) external {}
    function setApprovalForAll(address, bool) external {}

    function getApproved(uint256) external pure returns (address) {
        return address(0);
    }

    function isApprovedForAll(address, address) external pure returns (bool) {
        return true;
    }

    function balanceOf(address) external pure returns (uint256) {
        return 1;
    }

    function supportsInterface(bytes4) external pure returns (bool) {
        return true;
    }
}
