// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title MockERC721
/// @notice Minimal, fully compliant ERC-721 for tests. Built on the canonical
///         OpenZeppelin implementation so ownerOf/approvals/transfers behave
///         exactly as a real collection would — this is the "honest" collection
///         that an allowlisted (trusted) address is expected to be.
contract MockERC721 is ERC721 {
    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}
