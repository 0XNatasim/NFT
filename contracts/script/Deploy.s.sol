// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {MonadMarketSettlement} from "../src/MonadMarketSettlement.sol";

/// Usage:
///   export MONAD_RPC_URL=... PRIVATE_KEY_DEPLOYER=0x... \
///          FEE_RECIPIENT_ADDRESS=0x... CONTRACT_OWNER=0x...
///   npm run contracts:deploy
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = _deployerKey();
        address feeRecipient = vm.envAddress("FEE_RECIPIENT_ADDRESS");
        address contractOwner = vm.envOr("CONTRACT_OWNER", vm.addr(deployerKey));

        vm.startBroadcast(deployerKey);
        MonadMarketSettlement settlement = new MonadMarketSettlement(contractOwner, feeRecipient);
        vm.stopBroadcast();

        console.log("MonadMarketSettlement deployed at:", address(settlement));
        console.log("Owner:", contractOwner);
        console.log("Fee recipient:", feeRecipient);
        console.log("Fee bps:", settlement.feeBps());
    }

    /// Accepts PRIVATE_KEY_DEPLOYER with or without the 0x prefix.
    function _deployerKey() internal view returns (uint256) {
        string memory raw = vm.envString("PRIVATE_KEY_DEPLOYER");
        if (bytes(raw).length >= 2 && bytes(raw)[0] == "0" && (bytes(raw)[1] == "x" || bytes(raw)[1] == "X")) {
            return vm.parseUint(raw);
        }
        return vm.parseUint(string.concat("0x", raw));
    }
}
