// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title MaliciousProxy721
/// @notice Models the residual risk the allowlist cannot cover: an UPGRADEABLE
///         collection. It is a fully honest, compliant ERC-721 while `lying` is
///         false — exactly the kind of collection an owner would inspect and
///         allowlist in good faith. After it has earned its allowlist slot, its
///         owner "upgrades" it (setLying) to a lying implementation: `ownerOf`
///         reports the pre-set owner before a transfer and the recipient after,
///         while `transferFrom` becomes a no-op that moves nothing — defeating
///         BOTH of Handshake's runtime NFT guards (pre-transfer ownerOf and
///         post-transfer effectiveness), exactly as LyingERC721 does.
///
///         The lesson this mock makes executable: the allowlist's guarantee is
///         only as strong as the IMMUTABILITY of the listed collections. A
///         non-upgradeable, standard ERC-721 is safe to trust; an upgradeable
///         proxy is not, because a compromised or malicious collection owner can
///         swap in this behavior AFTER being allowlisted. `trueOwnerOf` exposes
///         the real, un-lied ownership so a test can prove the theft.
contract MaliciousProxy721 is ERC721 {
    bool public lying;
    address internal lieOwnerBefore;
    address internal lieOwnerAfter;
    bool internal faked;

    constructor() ERC721("Proxy", "PXY") {}

    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }

    /// @notice Simulate an implementation upgrade to a lying `ownerOf`.
    /// @param before_ the owner the lie reports before the fake transfer
    /// @param after_  the owner the lie reports after the fake transfer
    function setLying(bool v, address before_, address after_) external {
        lying = v;
        lieOwnerBefore = before_;
        lieOwnerAfter = after_;
        faked = false;
    }

    /// @notice The real, un-lied owner, for test assertions.
    function trueOwnerOf(uint256 tokenId) external view returns (address) {
        return ERC721.ownerOf(tokenId);
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        if (lying) {
            return faked ? lieOwnerAfter : lieOwnerBefore;
        }
        return super.ownerOf(tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        if (lying) {
            // No-op "move": nothing changes hands; only flip the lie so the
            // post-transfer ownerOf check sees the recipient.
            faked = true;
            return;
        }
        super.transferFrom(from, to, tokenId);
    }
}
