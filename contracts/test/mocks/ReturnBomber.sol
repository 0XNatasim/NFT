// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {Handshake} from "../../src/Handshake.sol";

/// @title ReturnBomber
/// @notice A contract taker whose native-receive path (a payable fallback, with
///         NO receive()) "return-bombs" the caller: it RETURNs a very large
///         memory blob. A naive `to.call{value:}("")` copies that blob into the
///         caller's memory, letting a hostile recipient inflate the settler's gas
///         cost. Handshake's `_payout`/`_sendNative` use assembly with a
///         zero-length output buffer, so the blob is discarded.
///
///         As a settlement payout recipient (30k stipend) the large RETURN OOGs,
///         so the payout falls back to a recoverable escrow credit. Via
///         `withdraw()` (full gas) the fallback succeeds and the blob is still
///         discarded — proving the return-bomb neither reverts settlement nor
///         inflates the caller. Implements onERC721Received so it can receive the
///         maker's NFT as a taker; only the bare native transfer hits the bomb.
contract ReturnBomber is IERC721Receiver {
    Handshake public immutable hs;

    constructor(Handshake hs_) {
        hs = hs_;
    }

    function approveCollection(address collection) external {
        IERC721(collection).setApprovalForAll(address(hs), true);
    }

    function fulfill(Handshake.TradeOrder calldata order, bytes calldata signature)
        external
        payable
    {
        hs.fulfillTrade{value: msg.value}(order, signature);
    }

    function pull(uint256 amount) external {
        hs.withdraw(amount);
    }

    function onERC721Received(address, address, uint256, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        return IERC721Receiver.onERC721Received.selector;
    }

    /// @dev Return-bomb: RETURN a ~500KB blob on every plain native transfer.
    ///      Memory expansion for a blob this size costs well over the 30k payout
    ///      stipend (so a stipended payout OOGs and falls back to escrow) yet is
    ///      affordable under the full gas a withdraw() forwards. A naive caller
    ///      copying this returndata would eat the same cost; Handshake's
    ///      zero-length output buffer discards it.
    fallback() external payable {
        assembly {
            return(0, 500000)
        }
    }
}
