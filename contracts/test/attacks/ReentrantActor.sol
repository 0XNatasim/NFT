// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface ISettlement {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
    function withdrawFees() external;
}

/// @notice Adversarial counterparty used to PROVE the ReentrancyGuard holds.
///         It acts as a contract *taker*. Every time it receives an NFT
///         (onERC721Received) or a native refund (receive) mid-settlement, it
///         re-enters a `nonReentrant` function on the settlement contract.
///
///         The re-entry is wrapped in try/catch so the *outer* trade is allowed
///         to complete: the test then asserts BOTH that the trade settled AND
///         that the re-entry was rejected. If the guard were ever removed, the
///         inner call would succeed, `reentryBlocked` would be false, and the
///         cross-function-reentrancy test would fail — exactly the regression
///         you want a refactor to trip over.
contract ReentrantActor is IERC721Receiver {
    enum Mode {
        NONE,
        WITHDRAW,
        WITHDRAW_FEES
    }

    ISettlement public immutable settlement;

    Mode public mode;
    uint256 public withdrawAmount;
    bool public reentryAttempted;
    bool public reentryBlocked;

    constructor(address _settlement) {
        settlement = ISettlement(_settlement);
    }

    /// @dev Configure which nonReentrant function to re-enter on the next callback.
    function arm(Mode _mode, uint256 _withdrawAmount) external {
        mode = _mode;
        withdrawAmount = _withdrawAmount;
        reentryAttempted = false;
        reentryBlocked = false;
    }

    function fundEscrow() external payable {
        settlement.deposit{value: msg.value}();
    }

    function setApprovalForAll(address nft) external {
        IERC721(nft).setApprovalForAll(address(settlement), true);
    }

    function _tryReenter() internal {
        if (mode == Mode.NONE) return;
        reentryAttempted = true;

        if (mode == Mode.WITHDRAW) {
            try settlement.withdraw(withdrawAmount) {
                reentryBlocked = false; // guard FAILED — re-entry got through
            } catch {
                reentryBlocked = true; // guard held
            }
        } else {
            try settlement.withdrawFees() {
                reentryBlocked = false;
            } catch {
                reentryBlocked = true;
            }
        }
    }

    // Fires when the actor receives the maker's NFT during settlement.
    function onERC721Received(address, address, uint256, bytes calldata)
        external
        returns (bytes4)
    {
        _tryReenter();
        return IERC721Receiver.onERC721Received.selector;
    }

    // Fires when the actor receives a native (MON) refund leg during settlement.
    receive() external payable {
        _tryReenter();
    }
}
