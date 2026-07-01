// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/// @notice Minimal EIP-1271 smart-contract wallet for tests. It validates
///         signatures against a single owner key (mirroring how Safe / AA
///         wallets front for an owner) and can hold NFTs and MON so it can act
///         as a maker in a settlement.
contract MockSmartWallet is IERC721Receiver {
    /// @dev EIP-1271 magic value returned for a valid signature.
    bytes4 internal constant MAGICVALUE = 0x1626ba7e;

    address public owner;

    constructor(address _owner) {
        owner = _owner;
    }

    /// @notice EIP-1271 signature validation: valid iff `signature` is an
    ///         ECDSA signature over `hash` by this wallet's owner.
    function isValidSignature(bytes32 hash, bytes calldata signature)
        external
        view
        returns (bytes4)
    {
        (address recovered,,) = ECDSA.tryRecover(hash, signature);
        return recovered == owner ? MAGICVALUE : bytes4(0xffffffff);
    }

    /// @notice Generic call passthrough so the wallet can approve NFTs and
    ///         fund escrow, like a real smart wallet would.
    function execute(address target, uint256 value, bytes calldata data)
        external
        payable
        returns (bytes memory)
    {
        (bool ok, bytes memory ret) = target.call{value: value}(data);
        require(ok, "execute failed");
        return ret;
    }

    function onERC721Received(address, address, uint256, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        return IERC721Receiver.onERC721Received.selector;
    }

    receive() external payable {}
}
