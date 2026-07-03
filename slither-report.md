'forge clean' running (wd: /home/emperor/Workspace/NFT/NFT)
'forge config --json' running
'forge build --build-info --deny never' running (wd: /home/emperor/Workspace/NFT/NFT)
**THIS CHECKLIST IS NOT COMPLETE**. Use `--show-ignored-findings` to show all the results.
Summary
 - [incorrect-exp](#incorrect-exp) (1 results) (High)
 - [incorrect-shift](#incorrect-shift) (1 results) (High)
 - [shadowing-state](#shadowing-state) (1 results) (High)
 - [divide-before-multiply](#divide-before-multiply) (9 results) (Medium)
 - [reentrancy-no-eth](#reentrancy-no-eth) (1 results) (Medium)
 - [tautology](#tautology) (1 results) (Medium)
 - [uninitialized-local](#uninitialized-local) (6 results) (Medium)
 - [unused-return](#unused-return) (7 results) (Medium)
 - [missing-zero-check](#missing-zero-check) (1 results) (Low)
 - [incorrect-modifier](#incorrect-modifier) (2 results) (Low)
 - [calls-loop](#calls-loop) (4 results) (Low)
 - [reentrancy-benign](#reentrancy-benign) (1 results) (Low)
 - [reentrancy-events](#reentrancy-events) (3 results) (Low)
 - [timestamp](#timestamp) (1 results) (Low)
 - [assembly](#assembly) (409 results) (Informational)
 - [boolean-equal](#boolean-equal) (2 results) (Informational)
 - [pragma](#pragma) (1 results) (Informational)
 - [cyclomatic-complexity](#cyclomatic-complexity) (1 results) (Informational)
 - [solc-version](#solc-version) (7 results) (Informational)
 - [low-level-calls](#low-level-calls) (9 results) (Informational)
 - [naming-convention](#naming-convention) (65 results) (Informational)
 - [redundant-statements](#redundant-statements) (1 results) (Informational)
 - [too-many-digits](#too-many-digits) (8 results) (Informational)
 - [unindexed-event-address](#unindexed-event-address) (4 results) (Informational)
 - [unused-state](#unused-state) (9 results) (Informational)
 - [constable-states](#constable-states) (1 results) (Optimization)
## incorrect-exp
Impact: High
Confidence: Medium
 - [ ] ID-0
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L206-L277) has bitwise-xor operator ^ instead of the exponentiation operator **: 
	 - [inverse = (3 * denominator) ^ 2](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L259)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L206-L277


## incorrect-shift
Impact: High
Confidence: High
 - [ ] ID-1
[stdStorageSafe.getMaskByOffsets(uint256,uint256)](contracts/lib/forge-std/src/StdStorage.sol#L316-L322) contains an incorrect shift operation: [mask = 1 << 256 - offsetRight + offsetLeft - 1 << offsetRight](contracts/lib/forge-std/src/StdStorage.sol#L320)

contracts/lib/forge-std/src/StdStorage.sol#L316-L322


## shadowing-state
Impact: High
Confidence: High
 - [ ] ID-2
[StdCheats.vm](contracts/lib/forge-std/src/StdCheats.sol#L655) shadows:
	- [StdCheatsSafe.vm](contracts/lib/forge-std/src/StdCheats.sol#L11)

contracts/lib/forge-std/src/StdCheats.sol#L655


## divide-before-multiply
Impact: Medium
Confidence: Medium
 - [ ] ID-3
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L206-L277) performs a multiplication on the result of a division:
	- [low = low / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L247)
	- [result = low * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L274)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L206-L277


 - [ ] ID-4
[Math.invMod(uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L317-L363) performs a multiplication on the result of a division:
	- [quotient = gcd / remainder](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L339)
	- [(gcd,remainder) = (remainder,gcd - remainder * quotient)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L341-L348)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L317-L363


 - [ ] ID-5
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L206-L277) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L244)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L268)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L206-L277


 - [ ] ID-6
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L206-L277) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L244)
	- [inverse = (3 * denominator) ^ 2](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L259)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L206-L277


 - [ ] ID-7
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L206-L277) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L244)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L266)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L206-L277


 - [ ] ID-8
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L206-L277) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L244)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L267)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L206-L277


 - [ ] ID-9
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L206-L277) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L244)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L264)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L206-L277


 - [ ] ID-10
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L206-L277) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L244)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L263)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L206-L277


 - [ ] ID-11
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L206-L277) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L244)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L265)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L206-L277


## reentrancy-no-eth
Impact: Medium
Confidence: Medium
 - [ ] ID-12
Reentrancy in [Handshake.fulfillTrade(Handshake.TradeOrder,bytes)](contracts/src/Handshake.sol#L224-L305):
	External calls:
	- [_transferNFTs(order.makerNFTs,order.maker,msg.sender)](contracts/src/Handshake.sol#L287)
		- [nft.safeTransferFrom(from,to,items[i].tokenId)](contracts/src/Handshake.sol#L454)
	- [_transferNFTs(order.takerNFTs,msg.sender,order.maker)](contracts/src/Handshake.sol#L288)
		- [nft.safeTransferFrom(from,to,items[i].tokenId)](contracts/src/Handshake.sol#L454)
	State variables written after the call(s):
	- [_payout(order.maker,order.takerMonAmount)](contracts/src/Handshake.sol#L294)
		- [escrowBalance[to] += amount](contracts/src/Handshake.sol#L498)
	[Handshake.escrowBalance](contracts/src/Handshake.sol#L92) can be used in cross function reentrancies:
	- [Handshake.deposit()](contracts/src/Handshake.sol#L163-L167)
	- [Handshake.escrowBalance](contracts/src/Handshake.sol#L92)
	- [_payout(msg.sender,order.makerMonAmount)](contracts/src/Handshake.sol#L295)
		- [escrowBalance[to] += amount](contracts/src/Handshake.sol#L498)
	[Handshake.escrowBalance](contracts/src/Handshake.sol#L92) can be used in cross function reentrancies:
	- [Handshake.deposit()](contracts/src/Handshake.sol#L163-L167)
	- [Handshake.escrowBalance](contracts/src/Handshake.sol#L92)

contracts/src/Handshake.sol#L224-L305


## tautology
Impact: Medium
Confidence: High
 - [ ] ID-13
[stdStorageSafe.find(StdStorage,bool)](contracts/lib/forge-std/src/StdStorage.sol#L106-L169) contains a tautology or contradiction:
	- [-- i >= 0](contracts/lib/forge-std/src/StdStorage.sol#L126)

contracts/lib/forge-std/src/StdStorage.sol#L106-L169


## uninitialized-local
Impact: Medium
Confidence: Medium
 - [ ] ID-14
[StdCheatsSafe.rawToConvertedEIPTx1559(StdCheatsSafe.RawTx1559).transaction](contracts/lib/forge-std/src/StdCheats.sol#L393) is a local variable never initialized

contracts/lib/forge-std/src/StdCheats.sol#L393


 - [ ] ID-15
[StdCheatsSafe.readEIP1559ScriptArtifact(string).artifact](contracts/lib/forge-std/src/StdCheats.sol#L373) is a local variable never initialized

contracts/lib/forge-std/src/StdCheats.sol#L373


 - [ ] ID-16
[StdCheatsSafe.rawToConvertedEIP1559Detail(StdCheatsSafe.RawTx1559Detail).txDetail](contracts/lib/forge-std/src/StdCheats.sol#L409) is a local variable never initialized

contracts/lib/forge-std/src/StdCheats.sol#L409


 - [ ] ID-17
[stdStorageSafe.bytesToBytes32(bytes,uint256).out](contracts/lib/forge-std/src/StdStorage.sol#L283) is a local variable never initialized

contracts/lib/forge-std/src/StdStorage.sol#L283


 - [ ] ID-18
[stdStorageSafe.root(StdStorage).root_slot](contracts/lib/forge-std/src/StdStorage.sol#L267) is a local variable never initialized

contracts/lib/forge-std/src/StdStorage.sol#L267


 - [ ] ID-19
[StdCheatsSafe.rawToConvertedReceipt(StdCheatsSafe.RawReceipt).receipt](contracts/lib/forge-std/src/StdCheats.sol#L461) is a local variable never initialized

contracts/lib/forge-std/src/StdCheats.sol#L461


## unused-return
Impact: Medium
Confidence: Medium
 - [ ] ID-20
[StdCheatsSafe.isFork()](contracts/lib/forge-std/src/StdCheats.sol#L588-L592) ignores return value by [vm.activeFork()](contracts/lib/forge-std/src/StdCheats.sol#L589-L591)

contracts/lib/forge-std/src/StdCheats.sol#L588-L592


 - [ ] ID-21
[SignatureChecker.isValidSignatureNow(address,bytes32,bytes)](node_modules/@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol#L32-L39) ignores return value by [(recovered,err,None) = ECDSA.tryRecover(hash,signature)](node_modules/@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol#L34)

node_modules/@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol#L32-L39


 - [ ] ID-22
[stdStorageSafe.root(StdStorage)](contracts/lib/forge-std/src/StdStorage.sol#L261-L280) ignores return value by [(found,None,parent_slot) = vm.getMappingKeyAndParentOf(who,bytes32(root_slot))](contracts/lib/forge-std/src/StdStorage.sol#L277)

contracts/lib/forge-std/src/StdStorage.sol#L261-L280


 - [ ] ID-23
[StdUtils.getTokenBalances(address,address[])](contracts/lib/forge-std/src/StdUtils.sol#L134-L161) ignores return value by [(None,returnData) = multicall.aggregate(calls)](contracts/lib/forge-std/src/StdUtils.sol#L154)

contracts/lib/forge-std/src/StdUtils.sol#L134-L161


 - [ ] ID-24
[stdStorageSafe.root(StdStorage)](contracts/lib/forge-std/src/StdStorage.sol#L261-L280) ignores return value by [(found,None,parent_slot) = vm.getMappingKeyAndParentOf(who,bytes32(child))](contracts/lib/forge-std/src/StdStorage.sol#L269)

contracts/lib/forge-std/src/StdStorage.sol#L261-L280


 - [ ] ID-25
[stdStorageSafe.find(StdStorage,bool)](contracts/lib/forge-std/src/StdStorage.sol#L106-L169) ignores return value by [(reads,None) = vm.accesses(address(who))](contracts/lib/forge-std/src/StdStorage.sol#L121)

contracts/lib/forge-std/src/StdStorage.sol#L106-L169


 - [ ] ID-26
[SignatureChecker.isValidSignatureNowCalldata(address,bytes32,bytes)](node_modules/@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol#L44-L55) ignores return value by [(recovered,err,None) = ECDSA.tryRecoverCalldata(hash,signature)](node_modules/@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol#L50)

node_modules/@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol#L44-L55


## missing-zero-check
Impact: Low
Confidence: Medium
 - [ ] ID-27
[Ownable2Step.transferOwnership(address).newOwner](node_modules/@openzeppelin/contracts/access/Ownable2Step.sol#L43) lacks a zero-check on :
		- [_pendingOwner = newOwner](node_modules/@openzeppelin/contracts/access/Ownable2Step.sol#L44)

node_modules/@openzeppelin/contracts/access/Ownable2Step.sol#L43


## incorrect-modifier
Impact: Low
Confidence: High
 - [ ] ID-28
Modifier [StdCheatsSafe.skipWhenNotForking()](contracts/lib/forge-std/src/StdCheats.sol#L600-L604) does not always execute _; or revert

contracts/lib/forge-std/src/StdCheats.sol#L600-L604


 - [ ] ID-29
Modifier [StdCheatsSafe.skipWhenForking()](contracts/lib/forge-std/src/StdCheats.sol#L594-L598) does not always execute _; or revert

contracts/lib/forge-std/src/StdCheats.sol#L594-L598


## calls-loop
Impact: Low
Confidence: Medium
 - [ ] ID-30
[Handshake._transferNFTs(Handshake.NFTItem[],address,address)](contracts/src/Handshake.sol#L451-L466) has external calls inside a loop: [nft.safeTransferFrom(from,to,items[i].tokenId)](contracts/src/Handshake.sol#L454)
	Calls stack containing the loop:
		Handshake.fulfillTrade(Handshake.TradeOrder,bytes)

contracts/src/Handshake.sol#L451-L466


 - [ ] ID-31
[Handshake._verifyNFTs(Handshake.NFTItem[],address)](contracts/src/Handshake.sol#L436-L449) has external calls inside a loop: [nft.getApproved(items[i].tokenId) != address(this) && ! nft.isApprovedForAll(expectedOwner,address(this))](contracts/src/Handshake.sol#L443-L444)
	Calls stack containing the loop:
		Handshake.fulfillTrade(Handshake.TradeOrder,bytes)

contracts/src/Handshake.sol#L436-L449


 - [ ] ID-32
[Handshake._transferNFTs(Handshake.NFTItem[],address,address)](contracts/src/Handshake.sol#L451-L466) has external calls inside a loop: [nft.ownerOf(items[i].tokenId) != to](contracts/src/Handshake.sol#L462)
	Calls stack containing the loop:
		Handshake.fulfillTrade(Handshake.TradeOrder,bytes)

contracts/src/Handshake.sol#L451-L466


 - [ ] ID-33
[Handshake._verifyNFTs(Handshake.NFTItem[],address)](contracts/src/Handshake.sol#L436-L449) has external calls inside a loop: [nft.ownerOf(items[i].tokenId) != expectedOwner](contracts/src/Handshake.sol#L439)
	Calls stack containing the loop:
		Handshake.fulfillTrade(Handshake.TradeOrder,bytes)

contracts/src/Handshake.sol#L436-L449


## reentrancy-benign
Impact: Low
Confidence: Medium
 - [ ] ID-34
Reentrancy in [StdCheatsSafe.noGasMetering()](contracts/lib/forge-std/src/StdCheats.sol#L606-L625):
	External calls:
	- [vm.pauseGasMetering()](contracts/lib/forge-std/src/StdCheats.sol#L607)
	State variables written after the call(s):
	- [gasMeteringOff = true](contracts/lib/forge-std/src/StdCheats.sol#L616)
	- [gasMeteringOff = false](contracts/lib/forge-std/src/StdCheats.sol#L622)

contracts/lib/forge-std/src/StdCheats.sol#L606-L625


## reentrancy-events
Impact: Low
Confidence: Medium
 - [ ] ID-35
Reentrancy in [stdStorageSafe.root(StdStorage)](contracts/lib/forge-std/src/StdStorage.sol#L261-L280):
	External calls:
	- [vm.startMappingRecording()](contracts/lib/forge-std/src/StdStorage.sol#L264)
	- [child = find(self,true).slot - field_depth](contracts/lib/forge-std/src/StdStorage.sol#L265)
		- [vm.store(self._target,slot,testVal)](contracts/lib/forge-std/src/StdStorage.sol#L60)
		- [vm.store(self._target,slot,bytes32(valueToPut))](contracts/lib/forge-std/src/StdStorage.sol#L74)
		- [vm.store(self._target,slot,prevSlotValue)](contracts/lib/forge-std/src/StdStorage.sol#L92)
		- [vm.store(self._target,slot,prevSlotValue)](contracts/lib/forge-std/src/StdStorage.sol#L64)
		- [vm.record()](contracts/lib/forge-std/src/StdStorage.sol#L119)
		- [(reads,None) = vm.accesses(address(who))](contracts/lib/forge-std/src/StdStorage.sol#L121)
	Event emitted after the call(s):
	- [SlotFound(who,fsig,keccak256(bytes)(abi.encodePacked(params,field_depth)),uint256(reads[i]))](contracts/lib/forge-std/src/StdStorage.sol#L153)
		- [child = find(self,true).slot - field_depth](contracts/lib/forge-std/src/StdStorage.sol#L265)
	- [WARNING_UninitedSlot(who,uint256(reads[i]))](contracts/lib/forge-std/src/StdStorage.sol#L129)
		- [child = find(self,true).slot - field_depth](contracts/lib/forge-std/src/StdStorage.sol#L265)

contracts/lib/forge-std/src/StdStorage.sol#L261-L280


 - [ ] ID-36
Reentrancy in [stdStorageSafe.find(StdStorage,bool)](contracts/lib/forge-std/src/StdStorage.sol#L106-L169):
	External calls:
	- [vm.record()](contracts/lib/forge-std/src/StdStorage.sol#L119)
	- [(reads,None) = vm.accesses(address(who))](contracts/lib/forge-std/src/StdStorage.sol#L121)
	- [! checkSlotMutatesCall(self,reads[i])](contracts/lib/forge-std/src/StdStorage.sol#L132)
		- [vm.store(self._target,slot,testVal)](contracts/lib/forge-std/src/StdStorage.sol#L60)
		- [vm.store(self._target,slot,prevSlotValue)](contracts/lib/forge-std/src/StdStorage.sol#L64)
	- [(found,offsetLeft,offsetRight) = findOffsets(self,reads[i])](contracts/lib/forge-std/src/StdStorage.sol#L140)
		- [vm.store(self._target,slot,bytes32(valueToPut))](contracts/lib/forge-std/src/StdStorage.sol#L74)
		- [vm.store(self._target,slot,prevSlotValue)](contracts/lib/forge-std/src/StdStorage.sol#L92)
	Event emitted after the call(s):
	- [SlotFound(who,fsig,keccak256(bytes)(abi.encodePacked(params,field_depth)),uint256(reads[i]))](contracts/lib/forge-std/src/StdStorage.sol#L153)
	- [WARNING_UninitedSlot(who,uint256(reads[i]))](contracts/lib/forge-std/src/StdStorage.sol#L129)

contracts/lib/forge-std/src/StdStorage.sol#L106-L169


 - [ ] ID-37
Reentrancy in [stdStorageSafe.parent(StdStorage)](contracts/lib/forge-std/src/StdStorage.sol#L247-L259):
	External calls:
	- [vm.startMappingRecording()](contracts/lib/forge-std/src/StdStorage.sol#L250)
	- [child = find(self,true).slot - field_depth](contracts/lib/forge-std/src/StdStorage.sol#L251)
		- [vm.store(self._target,slot,testVal)](contracts/lib/forge-std/src/StdStorage.sol#L60)
		- [vm.store(self._target,slot,bytes32(valueToPut))](contracts/lib/forge-std/src/StdStorage.sol#L74)
		- [vm.store(self._target,slot,prevSlotValue)](contracts/lib/forge-std/src/StdStorage.sol#L92)
		- [vm.store(self._target,slot,prevSlotValue)](contracts/lib/forge-std/src/StdStorage.sol#L64)
		- [vm.record()](contracts/lib/forge-std/src/StdStorage.sol#L119)
		- [(reads,None) = vm.accesses(address(who))](contracts/lib/forge-std/src/StdStorage.sol#L121)
	Event emitted after the call(s):
	- [SlotFound(who,fsig,keccak256(bytes)(abi.encodePacked(params,field_depth)),uint256(reads[i]))](contracts/lib/forge-std/src/StdStorage.sol#L153)
		- [child = find(self,true).slot - field_depth](contracts/lib/forge-std/src/StdStorage.sol#L251)
	- [WARNING_UninitedSlot(who,uint256(reads[i]))](contracts/lib/forge-std/src/StdStorage.sol#L129)
		- [child = find(self,true).slot - field_depth](contracts/lib/forge-std/src/StdStorage.sol#L251)

contracts/lib/forge-std/src/StdStorage.sol#L247-L259


## timestamp
Impact: Low
Confidence: Medium
 - [ ] ID-38
[Handshake.fulfillTrade(Handshake.TradeOrder,bytes)](contracts/src/Handshake.sol#L224-L305) uses timestamp for comparisons
	Dangerous comparisons:
	- [block.timestamp >= order.expiry](contracts/src/Handshake.sol#L243)

contracts/src/Handshake.sol#L224-L305


## assembly
Impact: Informational
Confidence: High
 - [ ] ID-39
[safeconsole.log(address,bool,bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L4135-L4185) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4146-L4171)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4174-L4184)

contracts/lib/forge-std/src/safeconsole.sol#L4135-L4185


 - [ ] ID-40
[safeconsole.log(bool,uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L1470-L1495) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1476-L1486)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1489-L1494)

contracts/lib/forge-std/src/safeconsole.sol#L1470-L1495


 - [ ] ID-41
[safeconsole.log(bytes32,uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L2738-L2784) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2748-L2771)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2774-L2783)

contracts/lib/forge-std/src/safeconsole.sol#L2738-L2784


 - [ ] ID-42
[safeconsole.log(address,uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L933-L958) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L939-L949)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L952-L957)

contracts/lib/forge-std/src/safeconsole.sol#L933-L958


 - [ ] ID-43
[SafeCast.toUint(bool)](node_modules/@openzeppelin/contracts/utils/math/SafeCast.sol#L1157-L1161) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/SafeCast.sol#L1158-L1160)

node_modules/@openzeppelin/contracts/utils/math/SafeCast.sol#L1157-L1161


 - [ ] ID-44
[safeconsole.log(bool,uint256,bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L6997-L7040) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7006-L7028)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7031-L7039)

contracts/lib/forge-std/src/safeconsole.sol#L6997-L7040


 - [ ] ID-45
[safeconsole.log(bool,bytes32,uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L7741-L7784) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7750-L7772)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7775-L7783)

contracts/lib/forge-std/src/safeconsole.sol#L7741-L7784


 - [ ] ID-46
[safeconsole.log(address,bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L865-L904) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L873-L893)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L896-L903)

contracts/lib/forge-std/src/safeconsole.sol#L865-L904


 - [ ] ID-47
[StorageSlot.getAddressSlot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L66-L70) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L67-L69)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L66-L70


 - [ ] ID-48
[safeconsole.log(bool,bytes32,bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L7928-L7978) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7939-L7964)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7967-L7977)

contracts/lib/forge-std/src/safeconsole.sol#L7928-L7978


 - [ ] ID-49
[safeconsole.log(bytes32,bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L2444-L2483) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2452-L2472)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2475-L2482)

contracts/lib/forge-std/src/safeconsole.sol#L2444-L2483


 - [ ] ID-50
[MessageHashUtils.toEthSignedMessageHash(bytes32)](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L32-L38) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L33-L37)

node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L32-L38


 - [ ] ID-51
[safeconsole.log(address,address,bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L3185-L3214) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3192-L3204)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3207-L3213)

contracts/lib/forge-std/src/safeconsole.sol#L3185-L3214


 - [ ] ID-52
[safeconsole.log(address,bytes32,address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L4923-L4973) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4934-L4959)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4962-L4972)

contracts/lib/forge-std/src/safeconsole.sol#L4923-L4973


 - [ ] ID-53
[safeconsole.log(uint256,bool,address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L8837-L8880) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8846-L8868)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8871-L8879)

contracts/lib/forge-std/src/safeconsole.sol#L8837-L8880


 - [ ] ID-54
[safeconsole.log(address,address,bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L3123-L3152) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3130-L3142)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3145-L3151)

contracts/lib/forge-std/src/safeconsole.sol#L3123-L3152


 - [ ] ID-55
[safeconsole.log(bool,uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L1524-L1563) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1532-L1552)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1555-L1562)

contracts/lib/forge-std/src/safeconsole.sol#L1524-L1563


 - [ ] ID-56
[safeconsole.log(bytes32,uint256,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L12738-L12781) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12747-L12769)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12772-L12780)

contracts/lib/forge-std/src/safeconsole.sol#L12738-L12781


 - [ ] ID-57
[safeconsole.log(uint256,address,address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L8205-L8234) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8212-L8224)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8227-L8233)

contracts/lib/forge-std/src/safeconsole.sol#L8205-L8234


 - [ ] ID-58
[safeconsole.log(uint256,uint256,address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L9376-L9405) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9383-L9395)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9398-L9404)

contracts/lib/forge-std/src/safeconsole.sol#L9376-L9405


 - [ ] ID-59
[safeconsole.log(address,address,uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L3261-L3290) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3268-L3280)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3283-L3289)

contracts/lib/forge-std/src/safeconsole.sol#L3261-L3290


 - [ ] ID-60
[safeconsole.log(bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L341-L362) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L346-L354)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L357-L361)

contracts/lib/forge-std/src/safeconsole.sol#L341-L362


 - [ ] ID-61
[safeconsole.log(uint256,bytes32,bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L10223-L10266) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10232-L10254)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10257-L10265)

contracts/lib/forge-std/src/safeconsole.sol#L10223-L10266


 - [ ] ID-62
[safeconsole.log(address,uint256,bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L4356-L4385) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4363-L4375)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4378-L4384)

contracts/lib/forge-std/src/safeconsole.sol#L4356-L4385


 - [ ] ID-63
[safeconsole.log(uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L447-L468) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L452-L460)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L463-L467)

contracts/lib/forge-std/src/safeconsole.sol#L447-L468


 - [ ] ID-64
[safeconsole.log(bool,bool,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L6503-L6532) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6510-L6522)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6525-L6531)

contracts/lib/forge-std/src/safeconsole.sol#L6503-L6532


 - [ ] ID-65
[StdCheatsSafe.deployCode(string)](contracts/lib/forge-std/src/StdCheats.sol#L512-L520) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/StdCheats.sol#L515-L517)

contracts/lib/forge-std/src/StdCheats.sol#L512-L520


 - [ ] ID-66
[safeconsole.log(address,bytes32,uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L5207-L5250) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5216-L5238)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5241-L5249)

contracts/lib/forge-std/src/safeconsole.sol#L5207-L5250


 - [ ] ID-67
[safeconsole.log(address,bytes32,bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L5349-L5399) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5360-L5385)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5388-L5398)

contracts/lib/forge-std/src/safeconsole.sol#L5349-L5399


 - [ ] ID-68
[safeconsole.log(bool,uint256,bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L7180-L7223) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7189-L7211)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7214-L7222)

contracts/lib/forge-std/src/safeconsole.sol#L7180-L7223


 - [ ] ID-69
[safeconsole.log(bool,uint256,address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L6797-L6826) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6804-L6816)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6819-L6825)

contracts/lib/forge-std/src/safeconsole.sol#L6797-L6826


 - [ ] ID-70
[safeconsole.log(bytes32,address,address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L10812-L10855) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10821-L10843)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10846-L10854)

contracts/lib/forge-std/src/safeconsole.sol#L10812-L10855


 - [ ] ID-71
[safeconsole.log(bytes32,uint256,bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L12991-L13048) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13004-L13032)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13035-L13047)

contracts/lib/forge-std/src/safeconsole.sol#L12991-L13048


 - [ ] ID-72
[safeconsole.log(uint256,bool,bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L8882-L8911) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8889-L8901)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8904-L8910)

contracts/lib/forge-std/src/safeconsole.sol#L8882-L8911


 - [ ] ID-73
[safeconsole.log(bool,bool,bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L6334-L6363) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6341-L6353)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6356-L6362)

contracts/lib/forge-std/src/safeconsole.sol#L6334-L6363


 - [ ] ID-74
[safeconsole.log(uint256,bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L1939-L1978) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1947-L1967)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1970-L1977)

contracts/lib/forge-std/src/safeconsole.sol#L1939-L1978


 - [ ] ID-75
[safeconsole.log(bool,bytes32,bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L7644-L7687) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7653-L7675)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7678-L7686)

contracts/lib/forge-std/src/safeconsole.sol#L7644-L7687


 - [ ] ID-76
[safeconsole.log(uint256,bytes32,bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L10611-L10661) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10622-L10647)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10650-L10660)

contracts/lib/forge-std/src/safeconsole.sol#L10611-L10661


 - [ ] ID-77
[safeconsole.log(bytes32,address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L2314-L2353) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2322-L2342)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2345-L2352)

contracts/lib/forge-std/src/safeconsole.sol#L2314-L2353


 - [ ] ID-78
[StdCheatsSafe.deployCode(string,uint256)](contracts/lib/forge-std/src/StdCheats.sol#L533-L541) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/StdCheats.sol#L536-L538)

contracts/lib/forge-std/src/StdCheats.sol#L533-L541


 - [ ] ID-79
[safeconsole.log(bytes32,bool,address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L11543-L11586) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11552-L11574)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11577-L11585)

contracts/lib/forge-std/src/safeconsole.sol#L11543-L11586


 - [ ] ID-80
[safeconsole.log(bool,bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L1606-L1645) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1614-L1634)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1637-L1644)

contracts/lib/forge-std/src/safeconsole.sol#L1606-L1645


 - [ ] ID-81
[safeconsole.log(bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L544-L579) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L551-L569)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L572-L578)

contracts/lib/forge-std/src/safeconsole.sol#L544-L579


 - [ ] ID-82
[safeconsole.log(bytes32,bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L2882-L2928) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2892-L2915)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2918-L2927)

contracts/lib/forge-std/src/safeconsole.sol#L2882-L2928


 - [ ] ID-83
[safeconsole.log(uint256,bool,bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L9293-L9343) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9304-L9329)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9332-L9342)

contracts/lib/forge-std/src/safeconsole.sol#L9293-L9343


 - [ ] ID-84
[safeconsole.log(bytes32,address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L2355-L2394) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2363-L2383)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2386-L2393)

contracts/lib/forge-std/src/safeconsole.sol#L2355-L2394


 - [ ] ID-85
[safeconsole.log(bytes32,bytes32,bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L13695-L13752) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13708-L13736)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13739-L13751)

contracts/lib/forge-std/src/safeconsole.sol#L13695-L13752


 - [ ] ID-86
[safeconsole.log(bytes32,address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L2396-L2442) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2406-L2429)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2432-L2441)

contracts/lib/forge-std/src/safeconsole.sol#L2396-L2442


 - [ ] ID-87
[safeconsole.log(address,uint256,address,address)](contracts/lib/forge-std/src/safeconsole.sol#L4187-L4216) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4194-L4206)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4209-L4215)

contracts/lib/forge-std/src/safeconsole.sol#L4187-L4216


 - [ ] ID-88
[ECDSA.tryRecoverCalldata(bytes32,bytes)](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L85-L104) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L95-L99)

node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L85-L104


 - [ ] ID-89
[safeconsole.log(uint256,uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L1980-L2005) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1986-L1996)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1999-L2004)

contracts/lib/forge-std/src/safeconsole.sol#L1980-L2005


 - [ ] ID-90
[safeconsole.log(bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L156-L187) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L162-L178)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L181-L186)

contracts/lib/forge-std/src/safeconsole.sol#L156-L187


 - [ ] ID-91
[Math.tryModExp(bytes,bytes,bytes)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L451-L473) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L463-L472)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L451-L473


 - [ ] ID-92
[safeconsole.log(uint256,bool,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L9082-L9111) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9089-L9101)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9104-L9110)

contracts/lib/forge-std/src/safeconsole.sol#L9082-L9111


 - [ ] ID-93
[safeconsole.log(bool,address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L1280-L1319) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1288-L1308)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1311-L1318)

contracts/lib/forge-std/src/safeconsole.sol#L1280-L1319


 - [ ] ID-94
[safeconsole.log(bytes32,uint256,bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L12835-L12885) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12846-L12871)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12874-L12884)

contracts/lib/forge-std/src/safeconsole.sol#L12835-L12885


 - [ ] ID-95
[safeconsole.log(uint256,bytes32,address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L9991-L10034) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10000-L10022)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10025-L10033)

contracts/lib/forge-std/src/safeconsole.sol#L9991-L10034


 - [ ] ID-96
[ShortStrings.toString(ShortString)](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L63-L72) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L67-L70)

node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L63-L72


 - [ ] ID-97
[safeconsole.log(address,bytes32,address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L4833-L4876) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4842-L4864)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4867-L4875)

contracts/lib/forge-std/src/safeconsole.sol#L4833-L4876


 - [ ] ID-98
[safeconsole.log(address,address,address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L3078-L3121) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3087-L3109)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3112-L3120)

contracts/lib/forge-std/src/safeconsole.sol#L3078-L3121


 - [ ] ID-99
[safeconsole.log(bool,bool,uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L6534-L6577) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6543-L6565)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6568-L6576)

contracts/lib/forge-std/src/safeconsole.sol#L6534-L6577


 - [ ] ID-100
[safeconsole.log(bytes32,bool,uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L12007-L12057) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12018-L12043)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12046-L12056)

contracts/lib/forge-std/src/safeconsole.sol#L12007-L12057


 - [ ] ID-101
[safeconsole.log(bytes32,bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L2786-L2832) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2796-L2819)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2822-L2831)

contracts/lib/forge-std/src/safeconsole.sol#L2786-L2832


 - [ ] ID-102
[safeconsole.log(bool)](contracts/lib/forge-std/src/safeconsole.sol#L118-L135) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L122-L128)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L131-L134)

contracts/lib/forge-std/src/safeconsole.sol#L118-L135


 - [ ] ID-103
[safeconsole.log(bool,bool,address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L6258-L6301) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6267-L6289)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6292-L6300)

contracts/lib/forge-std/src/safeconsole.sol#L6258-L6301


 - [ ] ID-104
[safeconsole.log(bytes32,bytes32,bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L13813-L13870) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13826-L13854)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13857-L13869)

contracts/lib/forge-std/src/safeconsole.sol#L13813-L13870


 - [ ] ID-105
[StorageSlot.getUint256Slot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L93-L97) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L94-L96)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L93-L97


 - [ ] ID-106
[safeconsole.log(bool,bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L1688-L1734) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1698-L1721)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1724-L1733)

contracts/lib/forge-std/src/safeconsole.sol#L1688-L1734


 - [ ] ID-107
[safeconsole.log(bool,bool,uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L6472-L6501) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6479-L6491)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6494-L6500)

contracts/lib/forge-std/src/safeconsole.sol#L6472-L6501


 - [ ] ID-108
[safeconsole.log(bytes32,address,bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L11439-L11496) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11452-L11480)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11483-L11495)

contracts/lib/forge-std/src/safeconsole.sol#L11439-L11496


 - [ ] ID-109
[safeconsole.log(address,bool,bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L3786-L3815) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3793-L3805)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3808-L3814)

contracts/lib/forge-std/src/safeconsole.sol#L3786-L3815


 - [ ] ID-110
[Bytes._unsafeReadBytesOffset(bytes,uint256)](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L326-L331) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L328-L330)

node_modules/@openzeppelin/contracts/utils/Bytes.sol#L326-L331


 - [ ] ID-111
[safeconsole.log(bool,uint256,uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L7135-L7178) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7144-L7166)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7169-L7177)

contracts/lib/forge-std/src/safeconsole.sol#L7135-L7178


 - [ ] ID-112
[safeconsole._memcopyView(uint256,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L38-L43) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L40-L42)

contracts/lib/forge-std/src/safeconsole.sol#L38-L43


 - [ ] ID-113
[safeconsole.log(address,address,address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L3016-L3045) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3023-L3035)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3038-L3044)

contracts/lib/forge-std/src/safeconsole.sol#L3016-L3045


 - [ ] ID-114
[safeconsole.log(address,uint256,uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L4556-L4599) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4565-L4587)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4590-L4598)

contracts/lib/forge-std/src/safeconsole.sol#L4556-L4599


 - [ ] ID-115
[safeconsole.log(address,bytes32,bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L5505-L5562) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5518-L5546)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5549-L5561)

contracts/lib/forge-std/src/safeconsole.sol#L5505-L5562


 - [ ] ID-116
[safeconsole.log(address,bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L1110-L1149) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1118-L1138)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1141-L1148)

contracts/lib/forge-std/src/safeconsole.sol#L1110-L1149


 - [ ] ID-117
[safeconsole.log(address,bytes32,bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L5020-L5063) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5029-L5051)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5054-L5062)

contracts/lib/forge-std/src/safeconsole.sol#L5020-L5063


 - [ ] ID-118
[safeconsole.log(bool,bytes32,address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L7412-L7455) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7421-L7443)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7446-L7454)

contracts/lib/forge-std/src/safeconsole.sol#L7412-L7455


 - [ ] ID-119
[safeconsole.log(bool,bytes32,bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L7599-L7642) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7608-L7630)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7633-L7641)

contracts/lib/forge-std/src/safeconsole.sol#L7599-L7642


 - [ ] ID-120
[safeconsole.log(uint256,address,address)](contracts/lib/forge-std/src/safeconsole.sol#L1736-L1761) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1742-L1752)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1755-L1760)

contracts/lib/forge-std/src/safeconsole.sol#L1736-L1761


 - [ ] ID-121
[StdCheatsSafe.assumeNotBlacklisted(address,address)](contracts/lib/forge-std/src/StdCheats.sol#L209-L227) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/StdCheats.sol#L212-L214)

contracts/lib/forge-std/src/StdCheats.sol#L209-L227


 - [ ] ID-122
[safeconsole.log(uint256,address,address,address)](contracts/lib/forge-std/src/safeconsole.sol#L8143-L8172) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8150-L8162)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8165-L8171)

contracts/lib/forge-std/src/safeconsole.sol#L8143-L8172


 - [ ] ID-123
[safeconsole.log(uint256,uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L2007-L2032) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2013-L2023)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2026-L2031)

contracts/lib/forge-std/src/safeconsole.sol#L2007-L2032


 - [ ] ID-124
[safeconsole.log(bytes32,uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L2656-L2695) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2664-L2684)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2687-L2694)

contracts/lib/forge-std/src/safeconsole.sol#L2656-L2695


 - [ ] ID-125
[safeconsole.log(bytes32,bytes32,address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L13206-L13263) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13219-L13247)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13250-L13262)

contracts/lib/forge-std/src/safeconsole.sol#L13206-L13263


 - [ ] ID-126
[safeconsole.log(uint256,uint256,address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L9438-L9481) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9447-L9469)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9472-L9480)

contracts/lib/forge-std/src/safeconsole.sol#L9438-L9481


 - [ ] ID-127
[safeconsole.log(uint256,bool,uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L9113-L9156) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9122-L9144)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9147-L9155)

contracts/lib/forge-std/src/safeconsole.sol#L9113-L9156


 - [ ] ID-128
[safeconsole.log(address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L258-L293) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L265-L283)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L286-L292)

contracts/lib/forge-std/src/safeconsole.sol#L258-L293


 - [ ] ID-129
[safeconsole.log(bool,bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L1375-L1400) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1381-L1391)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1394-L1399)

contracts/lib/forge-std/src/safeconsole.sol#L1375-L1400


 - [ ] ID-130
[safeconsole.log(address,uint256,uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L4494-L4523) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4501-L4513)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4516-L4522)

contracts/lib/forge-std/src/safeconsole.sol#L4494-L4523


 - [ ] ID-131
[safeconsole.log(uint256,bool,address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L8806-L8835) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8813-L8825)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8828-L8834)

contracts/lib/forge-std/src/safeconsole.sol#L8806-L8835


 - [ ] ID-132
[safeconsole.log(address,bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L1069-L1108) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1077-L1097)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1100-L1107)

contracts/lib/forge-std/src/safeconsole.sol#L1069-L1108


 - [ ] ID-133
[safeconsole.log(bytes32,bytes32,bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L13421-L13478) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13434-L13462)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13465-L13477)

contracts/lib/forge-std/src/safeconsole.sol#L13421-L13478


 - [ ] ID-134
[safeconsole.log(uint256,bytes32,bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L10178-L10221) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10187-L10209)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10212-L10220)

contracts/lib/forge-std/src/safeconsole.sol#L10178-L10221


 - [ ] ID-135
[safeconsole.log(address,bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L838-L863) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L844-L854)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L857-L862)

contracts/lib/forge-std/src/safeconsole.sol#L838-L863


 - [ ] ID-136
[safeconsole.log(bytes32,bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L2526-L2565) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2534-L2554)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2557-L2564)

contracts/lib/forge-std/src/safeconsole.sol#L2526-L2565


 - [ ] ID-137
[Math.log2(uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L619-L658) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L655-L657)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L619-L658


 - [ ] ID-138
[safeconsole.log(bool,address,address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L5626-L5655) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5633-L5645)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5648-L5654)

contracts/lib/forge-std/src/safeconsole.sol#L5626-L5655


 - [ ] ID-139
[safeconsole.log(address,bool,uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L3955-L3998) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3964-L3986)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3989-L3997)

contracts/lib/forge-std/src/safeconsole.sol#L3955-L3998


 - [ ] ID-140
[safeconsole.log(bool,bytes32,uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L7876-L7926) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7887-L7912)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7915-L7925)

contracts/lib/forge-std/src/safeconsole.sol#L7876-L7926


 - [ ] ID-141
[safeconsole.log(address,uint256,uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L4463-L4492) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4470-L4482)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4485-L4491)

contracts/lib/forge-std/src/safeconsole.sol#L4463-L4492


 - [ ] ID-142
[safeconsole.log(uint256,bool,bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L9203-L9246) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9212-L9234)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9237-L9245)

contracts/lib/forge-std/src/safeconsole.sol#L9203-L9246


 - [ ] ID-143
[safeconsole.log(address,uint256,address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L4280-L4323) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4289-L4311)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4314-L4322)

contracts/lib/forge-std/src/safeconsole.sol#L4280-L4323


 - [ ] ID-144
[safeconsole.log(uint256,bytes32,address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L10081-L10131) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10092-L10117)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10120-L10130)

contracts/lib/forge-std/src/safeconsole.sol#L10081-L10131


 - [ ] ID-145
[safeconsole.log(bool,uint256,uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L7073-L7102) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7080-L7092)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7095-L7101)

contracts/lib/forge-std/src/safeconsole.sol#L7073-L7102


 - [ ] ID-146
[safeconsole.log(uint256)](contracts/lib/forge-std/src/safeconsole.sol#L137-L154) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L141-L147)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L150-L153)

contracts/lib/forge-std/src/safeconsole.sol#L137-L154


 - [ ] ID-147
[safeconsole.log(bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L618-L660) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L627-L648)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L651-L659)

contracts/lib/forge-std/src/safeconsole.sol#L618-L660


 - [ ] ID-148
[Strings.toChecksumHexString(address)](node_modules/@openzeppelin/contracts/utils/Strings.sol#L108-L126) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Strings.sol#L113-L115)

node_modules/@openzeppelin/contracts/utils/Strings.sol#L108-L126


 - [ ] ID-149
[safeconsole.log(bool,bool,bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L6365-L6394) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6372-L6384)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6387-L6393)

contracts/lib/forge-std/src/safeconsole.sol#L6365-L6394


 - [ ] ID-150
[safeconsole.log(bytes32,uint256,bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L12551-L12594) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12560-L12582)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12585-L12593)

contracts/lib/forge-std/src/safeconsole.sol#L12551-L12594


 - [ ] ID-151
[safeconsole.log(bool,bytes32,bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L8084-L8141) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8097-L8125)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8128-L8140)

contracts/lib/forge-std/src/safeconsole.sol#L8084-L8141


 - [ ] ID-152
[StorageSlot.getBooleanSlot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L75-L79) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L76-L78)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L75-L79


 - [ ] ID-153
[safeconsole.log(address,address,uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L3354-L3397) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3363-L3385)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3388-L3396)

contracts/lib/forge-std/src/safeconsole.sol#L3354-L3397


 - [ ] ID-154
[safeconsole.log(uint256,uint256,bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L9804-L9847) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9813-L9835)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9838-L9846)

contracts/lib/forge-std/src/safeconsole.sol#L9804-L9847


 - [ ] ID-155
[safeconsole.log(bool,address,uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L5840-L5869) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5847-L5859)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5862-L5868)

contracts/lib/forge-std/src/safeconsole.sol#L5840-L5869


 - [ ] ID-156
[safeconsole.log(uint256,bool,uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L9051-L9080) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9058-L9070)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9073-L9079)

contracts/lib/forge-std/src/safeconsole.sol#L9051-L9080


 - [ ] ID-157
[safeconsole.log(uint256,address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L1817-L1856) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1825-L1845)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1848-L1855)

contracts/lib/forge-std/src/safeconsole.sol#L1817-L1856


 - [ ] ID-158
[safeconsole.log(uint256,bool,bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L8944-L8973) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8951-L8963)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8966-L8972)

contracts/lib/forge-std/src/safeconsole.sol#L8944-L8973


 - [ ] ID-159
[safeconsole.log(bool,address,uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L5871-L5900) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5878-L5890)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5893-L5899)

contracts/lib/forge-std/src/safeconsole.sol#L5871-L5900


 - [ ] ID-160
[safeconsole.log(bool,address,uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L5933-L5976) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5942-L5964)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5967-L5975)

contracts/lib/forge-std/src/safeconsole.sol#L5933-L5976


 - [ ] ID-161
[safeconsole.log(address,uint256,bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L4691-L4734) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4700-L4722)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4725-L4733)

contracts/lib/forge-std/src/safeconsole.sol#L4691-L4734


 - [ ] ID-162
[safeconsole.log(bool,address,bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L6023-L6066) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6032-L6054)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6057-L6065)

contracts/lib/forge-std/src/safeconsole.sol#L6023-L6066


 - [ ] ID-163
[safeconsole.log(uint256,uint256,bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L9483-L9512) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9490-L9502)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9505-L9511)

contracts/lib/forge-std/src/safeconsole.sol#L9483-L9512


 - [ ] ID-164
[safeconsole.log(uint256,address,address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L8174-L8203) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8181-L8193)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8196-L8202)

contracts/lib/forge-std/src/safeconsole.sol#L8174-L8203


 - [ ] ID-165
[safeconsole.log(bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L581-L616) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L588-L606)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L609-L615)

contracts/lib/forge-std/src/safeconsole.sol#L581-L616


 - [ ] ID-166
[safeconsole.log(uint256,uint256,uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L9714-L9757) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9723-L9745)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9748-L9756)

contracts/lib/forge-std/src/safeconsole.sol#L9714-L9757


 - [ ] ID-167
[StdUtils.getTokenBalances(address,address[])](contracts/lib/forge-std/src/StdUtils.sol#L134-L161) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/StdUtils.sol#L140-L142)

contracts/lib/forge-std/src/StdUtils.sol#L134-L161


 - [ ] ID-168
[safeconsole.log(bytes32,bool,bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L12215-L12272) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12228-L12256)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12259-L12271)

contracts/lib/forge-std/src/safeconsole.sol#L12215-L12272


 - [ ] ID-169
[safeconsole.log(bytes32,uint256,uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L12783-L12833) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12794-L12819)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12822-L12832)

contracts/lib/forge-std/src/safeconsole.sol#L12783-L12833


 - [ ] ID-170
[safeconsole.log(uint256,bytes32,bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L10663-L10720) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10676-L10704)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10707-L10719)

contracts/lib/forge-std/src/safeconsole.sol#L10663-L10720


 - [ ] ID-171
[safeconsole.log(bytes32,uint256,bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L12887-L12937) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12898-L12923)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12926-L12936)

contracts/lib/forge-std/src/safeconsole.sol#L12887-L12937


 - [ ] ID-172
[ECDSA.parseCalldata(bytes)](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L245-L268) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L246-L267)

node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L245-L268


 - [ ] ID-173
[MessageHashUtils.toDataWithIntendedValidatorHash(address,bytes32)](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L71-L81) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L75-L80)

node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L71-L81


 - [ ] ID-174
[safeconsole.log(address,uint256,bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L4646-L4689) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4655-L4677)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4680-L4688)

contracts/lib/forge-std/src/safeconsole.sol#L4646-L4689


 - [ ] ID-175
[safeconsole.log(bool,bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L1647-L1686) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1655-L1675)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1678-L1685)

contracts/lib/forge-std/src/safeconsole.sol#L1647-L1686


 - [ ] ID-176
[safeconsole.log(address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L212-L233) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L217-L225)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L228-L232)

contracts/lib/forge-std/src/safeconsole.sol#L212-L233


 - [ ] ID-177
[safeconsole.log(bool,uint256,bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L6966-L6995) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6973-L6985)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6988-L6994)

contracts/lib/forge-std/src/safeconsole.sol#L6966-L6995


 - [ ] ID-178
[safeconsole.log(bytes32,address,bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L11335-L11385) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11346-L11371)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11374-L11384)

contracts/lib/forge-std/src/safeconsole.sol#L11335-L11385


 - [ ] ID-179
[safeconsole.log(address,bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L811-L836) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L817-L827)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L830-L835)

contracts/lib/forge-std/src/safeconsole.sol#L811-L836


 - [ ] ID-180
[safeconsole.log(bool,uint256,address,address)](contracts/lib/forge-std/src/safeconsole.sol#L6766-L6795) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6773-L6785)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6788-L6794)

contracts/lib/forge-std/src/safeconsole.sol#L6766-L6795


 - [ ] ID-181
[safeconsole.log(uint256,bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L2143-L2182) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2151-L2171)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2174-L2181)

contracts/lib/forge-std/src/safeconsole.sol#L2143-L2182


 - [ ] ID-182
[safeconsole.log(uint256,bool,bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L9248-L9291) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9257-L9279)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9282-L9290)

contracts/lib/forge-std/src/safeconsole.sol#L9248-L9291


 - [ ] ID-183
[safeconsole.log(uint256,bool,address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L8775-L8804) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8782-L8794)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8797-L8803)

contracts/lib/forge-std/src/safeconsole.sol#L8775-L8804


 - [ ] ID-184
[Handshake._payout(address,uint256)](contracts/src/Handshake.sol#L490-L501) uses assembly
	- [INLINE ASM](contracts/src/Handshake.sol#L494-L496)

contracts/src/Handshake.sol#L490-L501


 - [ ] ID-185
[safeconsole.log(address,bytes32,bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L5065-L5108) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5074-L5096)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5099-L5107)

contracts/lib/forge-std/src/safeconsole.sol#L5065-L5108


 - [ ] ID-186
[StorageSlot.getBytes32Slot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L84-L88) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L85-L87)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L84-L88


 - [ ] ID-187
[safeconsole.log(address,bool,bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L3755-L3784) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3762-L3774)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3777-L3783)

contracts/lib/forge-std/src/safeconsole.sol#L3755-L3784


 - [ ] ID-188
[safeconsole.log(uint256,bool,uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L9020-L9049) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9027-L9039)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9042-L9048)

contracts/lib/forge-std/src/safeconsole.sol#L9020-L9049


 - [ ] ID-189
[safeconsole.log(address,bytes32,uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L5297-L5347) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5308-L5333)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5336-L5346)

contracts/lib/forge-std/src/safeconsole.sol#L5297-L5347


 - [ ] ID-190
[safeconsole.log(bytes32,uint256,uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L12648-L12691) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12657-L12679)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12682-L12690)

contracts/lib/forge-std/src/safeconsole.sol#L12648-L12691


 - [ ] ID-191
[StdCheatsSafe.deployCode(string,bytes,uint256)](contracts/lib/forge-std/src/StdCheats.sol#L523-L531) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/StdCheats.sol#L526-L528)

contracts/lib/forge-std/src/StdCheats.sol#L523-L531


 - [ ] ID-192
[safeconsole.log(bool,address,address)](contracts/lib/forge-std/src/safeconsole.sol#L1199-L1224) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1205-L1215)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1218-L1223)

contracts/lib/forge-std/src/safeconsole.sol#L1199-L1224


 - [ ] ID-193
[safeconsole.log(bytes32,bytes32,address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L13102-L13152) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13113-L13138)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13141-L13151)

contracts/lib/forge-std/src/safeconsole.sol#L13102-L13152


 - [ ] ID-194
[safeconsole.log(address,bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L1151-L1197) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1161-L1184)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1187-L1196)

contracts/lib/forge-std/src/safeconsole.sol#L1151-L1197


 - [ ] ID-195
[safeconsole.log(uint256,address,bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L8602-L8645) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8611-L8633)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8636-L8644)

contracts/lib/forge-std/src/safeconsole.sol#L8602-L8645


 - [ ] ID-196
[safeconsole.log(uint256,uint256,bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L9849-L9892) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9858-L9880)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9883-L9891)

contracts/lib/forge-std/src/safeconsole.sol#L9849-L9892


 - [ ] ID-197
[safeconsole.log(uint256,bytes32,address,address)](contracts/lib/forge-std/src/safeconsole.sol#L9946-L9989) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9955-L9977)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9980-L9988)

contracts/lib/forge-std/src/safeconsole.sol#L9946-L9989


 - [ ] ID-198
[safeconsole.log(address,bytes32,bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L5110-L5160) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5121-L5146)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5149-L5159)

contracts/lib/forge-std/src/safeconsole.sol#L5110-L5160


 - [ ] ID-199
[safeconsole.log(bool,bytes32,address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L7502-L7552) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7513-L7538)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7541-L7551)

contracts/lib/forge-std/src/safeconsole.sol#L7502-L7552


 - [ ] ID-200
[Bytes.replace(bytes,uint256,bytes,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L154-L172) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L167-L169)

node_modules/@openzeppelin/contracts/utils/Bytes.sol#L154-L172


 - [ ] ID-201
[safeconsole.log(bool,uint256,bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L6935-L6964) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6942-L6954)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6957-L6963)

contracts/lib/forge-std/src/safeconsole.sol#L6935-L6964


 - [ ] ID-202
[safeconsole.log(bool,bool,bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L6396-L6439) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6405-L6427)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6430-L6438)

contracts/lib/forge-std/src/safeconsole.sol#L6396-L6439


 - [ ] ID-203
[Panic.panic(uint256)](node_modules/@openzeppelin/contracts/utils/Panic.sol#L50-L56) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Panic.sol#L51-L55)

node_modules/@openzeppelin/contracts/utils/Panic.sol#L50-L56


 - [ ] ID-204
[safeconsole.log(address,uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L987-L1026) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L995-L1015)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1018-L1025)

contracts/lib/forge-std/src/safeconsole.sol#L987-L1026


 - [ ] ID-205
[StdCheatsSafe._viewChainId()](contracts/lib/forge-std/src/StdCheats.sol#L631-L638) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/StdCheats.sol#L633-L635)

contracts/lib/forge-std/src/StdCheats.sol#L631-L638


 - [ ] ID-206
[safeconsole.log(bool,address,bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L5702-L5731) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5709-L5721)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5724-L5730)

contracts/lib/forge-std/src/safeconsole.sol#L5702-L5731


 - [ ] ID-207
[safeconsole.log(uint256,address,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L8481-L8510) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8488-L8500)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8503-L8509)

contracts/lib/forge-std/src/safeconsole.sol#L8481-L8510


 - [ ] ID-208
[safeconsole.log(address,bool,uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L3893-L3922) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3900-L3912)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3915-L3921)

contracts/lib/forge-std/src/safeconsole.sol#L3893-L3922


 - [ ] ID-209
[safeconsole.log(bool,bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L1402-L1441) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1410-L1430)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1433-L1440)

contracts/lib/forge-std/src/safeconsole.sol#L1402-L1441


 - [ ] ID-210
[safeconsole.log(address,bool,address,address)](contracts/lib/forge-std/src/safeconsole.sol#L3586-L3615) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3593-L3605)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3608-L3614)

contracts/lib/forge-std/src/safeconsole.sol#L3586-L3615


 - [ ] ID-211
[safeconsole.log(uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L424-L445) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L429-L437)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L440-L444)

contracts/lib/forge-std/src/safeconsole.sol#L424-L445


 - [ ] ID-212
[safeconsole.log(uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L401-L422) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L406-L414)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L417-L421)

contracts/lib/forge-std/src/safeconsole.sol#L401-L422


 - [ ] ID-213
[safeconsole.log(address,uint256,bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L4418-L4461) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4427-L4449)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4452-L4460)

contracts/lib/forge-std/src/safeconsole.sol#L4418-L4461


 - [ ] ID-214
[safeconsole.log(bytes32,bytes32,bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L13317-L13367) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13328-L13353)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13356-L13366)

contracts/lib/forge-std/src/safeconsole.sol#L13317-L13367


 - [ ] ID-215
[Bytes.splice(bytes,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L117-L129) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L123-L126)

node_modules/@openzeppelin/contracts/utils/Bytes.sol#L117-L129


 - [ ] ID-216
[safeconsole.log(bytes32,bool,bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L12163-L12213) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12174-L12199)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12202-L12212)

contracts/lib/forge-std/src/safeconsole.sol#L12163-L12213


 - [ ] ID-217
[SignatureChecker.isValidERC1271SignatureNow(address,bytes32,bytes)](node_modules/@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol#L64-L88) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol#L72-L87)

node_modules/@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol#L64-L88


 - [ ] ID-218
[safeconsole.log(bool,uint256,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L7104-L7133) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7111-L7123)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7126-L7132)

contracts/lib/forge-std/src/safeconsole.sol#L7104-L7133


 - [ ] ID-219
[StorageSlot.getInt256Slot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L102-L106) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L103-L105)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L102-L106


 - [ ] ID-220
[safeconsole.log(bytes32,uint256,address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L12409-L12459) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12420-L12445)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12448-L12458)

contracts/lib/forge-std/src/safeconsole.sol#L12409-L12459


 - [ ] ID-221
[safeconsole.log(address,bool,address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L3679-L3722) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3688-L3710)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3713-L3721)

contracts/lib/forge-std/src/safeconsole.sol#L3679-L3722


 - [ ] ID-222
[safeconsole.log(address,uint256,bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L4387-L4416) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4394-L4406)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4409-L4415)

contracts/lib/forge-std/src/safeconsole.sol#L4387-L4416


 - [ ] ID-223
[safeconsole.log(bytes32,bytes32,address,address)](contracts/lib/forge-std/src/safeconsole.sol#L13050-L13100) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13061-L13086)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13089-L13099)

contracts/lib/forge-std/src/safeconsole.sol#L13050-L13100


 - [ ] ID-224
[safeconsole.log(bytes32,bytes32,address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L13154-L13204) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13165-L13190)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13193-L13203)

contracts/lib/forge-std/src/safeconsole.sol#L13154-L13204


 - [ ] ID-225
[safeconsole.log(bool,bool,address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L6227-L6256) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6234-L6246)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6249-L6255)

contracts/lib/forge-std/src/safeconsole.sol#L6227-L6256


 - [ ] ID-226
[safeconsole.log(address,address,bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L3154-L3183) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3161-L3173)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3176-L3182)

contracts/lib/forge-std/src/safeconsole.sol#L3154-L3183


 - [ ] ID-227
[safeconsole.log(uint256,uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L2061-L2100) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2069-L2089)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2092-L2099)

contracts/lib/forge-std/src/safeconsole.sol#L2061-L2100


 - [ ] ID-228
[safeconsole.log(uint256,uint256,bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L9545-L9574) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9552-L9564)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9567-L9573)

contracts/lib/forge-std/src/safeconsole.sol#L9545-L9574


 - [ ] ID-229
[safeconsole.log(address,bytes32,address,address)](contracts/lib/forge-std/src/safeconsole.sol#L4788-L4831) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4797-L4819)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4822-L4830)

contracts/lib/forge-std/src/safeconsole.sol#L4788-L4831


 - [ ] ID-230
[safeconsole.log(bytes32,address,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L11186-L11229) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11195-L11217)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11220-L11228)

contracts/lib/forge-std/src/safeconsole.sol#L11186-L11229


 - [ ] ID-231
[safeconsole.log(bytes32,bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L2567-L2613) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2577-L2600)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2603-L2612)

contracts/lib/forge-std/src/safeconsole.sol#L2567-L2613


 - [ ] ID-232
[safeconsole.log(bool,address,bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L5978-L6021) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5987-L6009)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6012-L6020)

contracts/lib/forge-std/src/safeconsole.sol#L5978-L6021


 - [ ] ID-233
[safeconsole.log(uint256,bytes32,bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L10133-L10176) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10142-L10164)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10167-L10175)

contracts/lib/forge-std/src/safeconsole.sol#L10133-L10176


 - [ ] ID-234
[safeconsole.log(address,address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L689-L714) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L695-L705)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L708-L713)

contracts/lib/forge-std/src/safeconsole.sol#L689-L714


 - [ ] ID-235
[safeconsole.log(address,bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L784-L809) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L790-L800)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L803-L808)

contracts/lib/forge-std/src/safeconsole.sol#L784-L809


 - [ ] ID-236
[safeconsole.log(bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L507-L542) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L514-L532)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L535-L541)

contracts/lib/forge-std/src/safeconsole.sol#L507-L542


 - [ ] ID-237
[safeconsole.log(address,bool,bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L3817-L3860) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3826-L3848)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3851-L3859)

contracts/lib/forge-std/src/safeconsole.sol#L3817-L3860


 - [ ] ID-238
[safeconsole.log(uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L470-L505) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L477-L495)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L498-L504)

contracts/lib/forge-std/src/safeconsole.sol#L470-L505


 - [ ] ID-239
[safeconsole.log(bool,bytes32,bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L7689-L7739) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7700-L7725)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7728-L7738)

contracts/lib/forge-std/src/safeconsole.sol#L7689-L7739


 - [ ] ID-240
[safeconsole.log(bool,bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L1348-L1373) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1354-L1364)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1367-L1372)

contracts/lib/forge-std/src/safeconsole.sol#L1348-L1373


 - [ ] ID-241
[safeconsole.log(bool,bytes32,address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L7457-L7500) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7466-L7488)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7491-L7499)

contracts/lib/forge-std/src/safeconsole.sol#L7457-L7500


 - [ ] ID-242
[safeconsole.log(bytes32,bool,bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L11820-L11870) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11831-L11856)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11859-L11869)

contracts/lib/forge-std/src/safeconsole.sol#L11820-L11870


 - [ ] ID-243
[safeconsole.log(address,bytes32,address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L4878-L4921) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4887-L4909)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4912-L4920)

contracts/lib/forge-std/src/safeconsole.sol#L4878-L4921


 - [ ] ID-244
[Bytes.toNibbles(bytes)](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L210-L245) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L211-L244)

node_modules/@openzeppelin/contracts/utils/Bytes.sol#L210-L245


 - [ ] ID-245
[safeconsole.log(bool,address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L1253-L1278) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1259-L1269)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1272-L1277)

contracts/lib/forge-std/src/safeconsole.sol#L1253-L1278


 - [ ] ID-246
[safeconsole.log(bool,bytes32,address,address)](contracts/lib/forge-std/src/safeconsole.sol#L7367-L7410) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7376-L7398)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7401-L7409)

contracts/lib/forge-std/src/safeconsole.sol#L7367-L7410


 - [ ] ID-247
[stdStorageSafe.getMaskByOffsets(uint256,uint256)](contracts/lib/forge-std/src/StdStorage.sol#L316-L322) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/StdStorage.sol#L319-L321)

contracts/lib/forge-std/src/StdStorage.sol#L316-L322


 - [ ] ID-248
[safeconsole.log(uint256,address,bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L8557-L8600) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8566-L8588)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8591-L8599)

contracts/lib/forge-std/src/safeconsole.sol#L8557-L8600


 - [ ] ID-249
[safeconsole.log(bytes32,uint256,uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L12693-L12736) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12702-L12724)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12727-L12735)

contracts/lib/forge-std/src/safeconsole.sol#L12693-L12736


 - [ ] ID-250
[safeconsole.log(bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L295-L316) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L300-L308)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L311-L315)

contracts/lib/forge-std/src/safeconsole.sol#L295-L316


 - [ ] ID-251
[MessageHashUtils.toTypedDataHash(bytes32,bytes32)](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L92-L100) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L93-L99)

node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L92-L100


 - [ ] ID-252
[safeconsole.log(address,uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L906-L931) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L912-L922)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L925-L930)

contracts/lib/forge-std/src/safeconsole.sol#L906-L931


 - [ ] ID-253
[Strings._unsafeWriteBytesOffset(bytes,uint256,bytes1)](node_modules/@openzeppelin/contracts/utils/Strings.sol#L526-L531) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Strings.sol#L528-L530)

node_modules/@openzeppelin/contracts/utils/Strings.sol#L526-L531


 - [ ] ID-254
[safeconsole.log(uint256,bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L1858-L1883) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1864-L1874)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1877-L1882)

contracts/lib/forge-std/src/safeconsole.sol#L1858-L1883


 - [ ] ID-255
[MessageHashUtils.toDomainTypeHash(bytes1)](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L182-L227) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L185-L226)

node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L182-L227


 - [ ] ID-256
[safeconsole.log(address,bytes32,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L5252-L5295) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5261-L5283)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5286-L5294)

contracts/lib/forge-std/src/safeconsole.sol#L5252-L5295


 - [ ] ID-257
[StorageSlot.getBytesSlot(bytes)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L138-L142) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L139-L141)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L138-L142


 - [ ] ID-258
[safeconsole.log(bool,address,address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L5657-L5700) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5666-L5688)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5691-L5699)

contracts/lib/forge-std/src/safeconsole.sol#L5657-L5700


 - [ ] ID-259
[Strings.escapeJSON(string)](node_modules/@openzeppelin/contracts/utils/Strings.sol#L461-L505) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Strings.sol#L468-L470)
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Strings.sol#L499-L502)

node_modules/@openzeppelin/contracts/utils/Strings.sol#L461-L505


 - [ ] ID-260
[safeconsole.log(bytes32,bytes32,uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L13532-L13582) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13543-L13568)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13571-L13581)

contracts/lib/forge-std/src/safeconsole.sol#L13532-L13582


 - [ ] ID-261
[safeconsole.log(bytes32,bool,bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L11685-L11728) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11694-L11716)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11719-L11727)

contracts/lib/forge-std/src/safeconsole.sol#L11685-L11728


 - [ ] ID-262
[safeconsole.log(address,uint256,address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L4218-L4247) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4225-L4237)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4240-L4246)

contracts/lib/forge-std/src/safeconsole.sol#L4218-L4247


 - [ ] ID-263
[console._castToPure(function(bytes))](contracts/lib/forge-std/src/console.sol#L25-L31) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/console.sol#L28-L30)

contracts/lib/forge-std/src/console.sol#L25-L31


 - [ ] ID-264
[safeconsole.log(bytes32,address,address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L10767-L10810) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10776-L10798)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10801-L10809)

contracts/lib/forge-std/src/safeconsole.sol#L10767-L10810


 - [ ] ID-265
[StdUtils._sendLogPayloadView(bytes)](contracts/lib/forge-std/src/StdUtils.sol#L188-L196) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/StdUtils.sol#L192-L195)

contracts/lib/forge-std/src/StdUtils.sol#L188-L196


 - [ ] ID-266
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L206-L277) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L229-L236)
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L242-L251)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L206-L277


 - [ ] ID-267
[safeconsole.log(bool,uint256,bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L6904-L6933) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6911-L6923)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6926-L6932)

contracts/lib/forge-std/src/safeconsole.sol#L6904-L6933


 - [ ] ID-268
[safeconsole.log(bool,address,bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L5764-L5793) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5771-L5783)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5786-L5792)

contracts/lib/forge-std/src/safeconsole.sol#L5764-L5793


 - [ ] ID-269
[safeconsole.log(bool,uint256,bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L7225-L7268) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7234-L7256)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7259-L7267)

contracts/lib/forge-std/src/safeconsole.sol#L7225-L7268


 - [ ] ID-270
[Math.mul512(uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L37-L46) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L41-L45)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L37-L46


 - [ ] ID-271
[safeconsole.log(bool,address,bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L6068-L6111) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6077-L6099)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6102-L6110)

contracts/lib/forge-std/src/safeconsole.sol#L6068-L6111


 - [ ] ID-272
[StorageSlot.getStringSlot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L111-L115) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L112-L114)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L111-L115


 - [ ] ID-273
[safeconsole.log(bytes32,address,bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L11387-L11437) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11398-L11423)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11426-L11436)

contracts/lib/forge-std/src/safeconsole.sol#L11387-L11437


 - [ ] ID-274
[safeconsole.log(bool,bool,address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L6196-L6225) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6203-L6215)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6218-L6224)

contracts/lib/forge-std/src/safeconsole.sol#L6196-L6225


 - [ ] ID-275
[safeconsole.log(uint256,address,bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L8281-L8310) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8288-L8300)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8303-L8309)

contracts/lib/forge-std/src/safeconsole.sol#L8281-L8310


 - [ ] ID-276
[Strings.toString(uint256)](node_modules/@openzeppelin/contracts/utils/Strings.sol#L42-L60) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Strings.sol#L47-L49)
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Strings.sol#L52-L54)

node_modules/@openzeppelin/contracts/utils/Strings.sol#L42-L60


 - [ ] ID-277
[safeconsole.log(address,address,bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L3489-L3532) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3498-L3520)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3523-L3531)

contracts/lib/forge-std/src/safeconsole.sol#L3489-L3532


 - [ ] ID-278
[safeconsole.log(address,uint256,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L4525-L4554) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4532-L4544)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4547-L4553)

contracts/lib/forge-std/src/safeconsole.sol#L4525-L4554


 - [ ] ID-279
[safeconsole.log(uint256,bytes32,uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L10320-L10363) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10329-L10351)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10354-L10362)

contracts/lib/forge-std/src/safeconsole.sol#L10320-L10363


 - [ ] ID-280
[safeconsole.log(uint256,uint256,uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L9621-L9650) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9628-L9640)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9643-L9649)

contracts/lib/forge-std/src/safeconsole.sol#L9621-L9650


 - [ ] ID-281
[safeconsole.log(address,address,uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L3292-L3321) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3299-L3311)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3314-L3320)

contracts/lib/forge-std/src/safeconsole.sol#L3292-L3321


 - [ ] ID-282
[safeconsole.log(address,uint256,address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L4249-L4278) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4256-L4268)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4271-L4277)

contracts/lib/forge-std/src/safeconsole.sol#L4249-L4278


 - [ ] ID-283
[safeconsole.log(bool,bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L1565-L1604) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1573-L1593)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1596-L1603)

contracts/lib/forge-std/src/safeconsole.sol#L1565-L1604


 - [ ] ID-284
[safeconsole.log(bool,address,address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L5595-L5624) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5602-L5614)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5617-L5623)

contracts/lib/forge-std/src/safeconsole.sol#L5595-L5624


 - [ ] ID-285
[safeconsole.log(address,address,address)](contracts/lib/forge-std/src/safeconsole.sol#L662-L687) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L668-L678)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L681-L686)

contracts/lib/forge-std/src/safeconsole.sol#L662-L687


 - [ ] ID-286
[safeconsole.log(bool,address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L1226-L1251) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1232-L1242)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1245-L1250)

contracts/lib/forge-std/src/safeconsole.sol#L1226-L1251


 - [ ] ID-287
[ECDSA.parse(bytes)](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L217-L240) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L218-L239)

node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L217-L240


 - [ ] ID-288
[safeconsole.log(bytes32,bool,bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L11775-L11818) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11784-L11806)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11809-L11817)

contracts/lib/forge-std/src/safeconsole.sol#L11775-L11818


 - [ ] ID-289
[safeconsole.log(address,address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L743-L782) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L751-L771)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L774-L781)

contracts/lib/forge-std/src/safeconsole.sol#L743-L782


 - [ ] ID-290
[safeconsole.log(uint256,uint256,bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L9894-L9944) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9905-L9930)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9933-L9943)

contracts/lib/forge-std/src/safeconsole.sol#L9894-L9944


 - [ ] ID-291
[safeconsole.log(uint256,bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L1912-L1937) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1918-L1928)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1931-L1936)

contracts/lib/forge-std/src/safeconsole.sol#L1912-L1937


 - [ ] ID-292
[safeconsole._sendLogPayloadView(uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L21-L26) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L23-L25)

contracts/lib/forge-std/src/safeconsole.sol#L21-L26


 - [ ] ID-293
[ECDSA.tryRecover(bytes32,bytes)](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L61-L80) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L71-L75)

node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L61-L80


 - [ ] ID-294
[safeconsole.log(address,bool,bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L3724-L3753) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3731-L3743)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3746-L3752)

contracts/lib/forge-std/src/safeconsole.sol#L3724-L3753


 - [ ] ID-295
[safeconsole.log(bool,bytes32,uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L7786-L7829) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7795-L7817)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7820-L7828)

contracts/lib/forge-std/src/safeconsole.sol#L7786-L7829


 - [ ] ID-296
[safeconsole.log(uint256,uint256,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L9683-L9712) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9690-L9702)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9705-L9711)

contracts/lib/forge-std/src/safeconsole.sol#L9683-L9712


 - [ ] ID-297
[safeconsole.log(address,address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L716-L741) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L722-L732)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L735-L740)

contracts/lib/forge-std/src/safeconsole.sol#L716-L741


 - [ ] ID-298
[safeconsole.log(uint256,bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L2225-L2271) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2235-L2258)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2261-L2270)

contracts/lib/forge-std/src/safeconsole.sol#L2225-L2271


 - [ ] ID-299
[stdStorage.checked_write(StdStorage,bool)](contracts/lib/forge-std/src/StdStorage.sol#L401-L408) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/StdStorage.sol#L404-L406)

contracts/lib/forge-std/src/StdStorage.sol#L401-L408


 - [ ] ID-300
[safeconsole.log(bytes32,bool,bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L12111-L12161) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12122-L12147)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12150-L12160)

contracts/lib/forge-std/src/safeconsole.sol#L12111-L12161


 - [ ] ID-301
[safeconsole.log(address,bytes32,bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L5401-L5451) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5412-L5437)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5440-L5450)

contracts/lib/forge-std/src/safeconsole.sol#L5401-L5451


 - [ ] ID-302
[safeconsole.log(uint256,bytes32,bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L10268-L10318) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10279-L10304)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10307-L10317)

contracts/lib/forge-std/src/safeconsole.sol#L10268-L10318


 - [ ] ID-303
[safeconsole.log(uint256,uint256,uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L9652-L9681) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9659-L9671)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9674-L9680)

contracts/lib/forge-std/src/safeconsole.sol#L9652-L9681


 - [ ] ID-304
[safeconsole.log(bytes32,uint256,address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L12319-L12362) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12328-L12350)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12353-L12361)

contracts/lib/forge-std/src/safeconsole.sol#L12319-L12362


 - [ ] ID-305
[safeconsole.log(bool,bool,bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L6669-L6712) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6678-L6700)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6703-L6711)

contracts/lib/forge-std/src/safeconsole.sol#L6669-L6712


 - [ ] ID-306
[safeconsole.log(uint256,bytes32,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L10410-L10453) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10419-L10441)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10444-L10452)

contracts/lib/forge-std/src/safeconsole.sol#L10410-L10453


 - [ ] ID-307
[safeconsole.log(bytes32,bool,address,address)](contracts/lib/forge-std/src/safeconsole.sol#L11498-L11541) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11507-L11529)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11532-L11540)

contracts/lib/forge-std/src/safeconsole.sol#L11498-L11541


 - [ ] ID-308
[safeconsole.log(bool,bool,bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L6303-L6332) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6310-L6322)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6325-L6331)

contracts/lib/forge-std/src/safeconsole.sol#L6303-L6332


 - [ ] ID-309
[safeconsole.log(address,bytes32,bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L5453-L5503) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5464-L5489)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5492-L5502)

contracts/lib/forge-std/src/safeconsole.sol#L5453-L5503


 - [ ] ID-310
[safeconsole.log(bytes32,bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L2930-L2983) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2942-L2968)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2971-L2982)

contracts/lib/forge-std/src/safeconsole.sol#L2930-L2983


 - [ ] ID-311
[safeconsole.log(bytes32,bool,address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L11633-L11683) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11644-L11669)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11672-L11682)

contracts/lib/forge-std/src/safeconsole.sol#L11633-L11683


 - [ ] ID-312
[safeconsole.log(address,bytes32,uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L5162-L5205) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5171-L5193)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5196-L5204)

contracts/lib/forge-std/src/safeconsole.sol#L5162-L5205


 - [ ] ID-313
[safeconsole.log(uint256,uint256,address,address)](contracts/lib/forge-std/src/safeconsole.sol#L9345-L9374) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9352-L9364)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9367-L9373)

contracts/lib/forge-std/src/safeconsole.sol#L9345-L9374


 - [ ] ID-314
[safeconsole.log(bytes32,uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L2615-L2654) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2623-L2643)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2646-L2653)

contracts/lib/forge-std/src/safeconsole.sol#L2615-L2654


 - [ ] ID-315
[safeconsole.log(uint256,bool,bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L8975-L9018) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8984-L9006)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9009-L9017)

contracts/lib/forge-std/src/safeconsole.sol#L8975-L9018


 - [ ] ID-316
[safeconsole.log(bytes32,bytes32,bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L13369-L13419) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13380-L13405)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13408-L13418)

contracts/lib/forge-std/src/safeconsole.sol#L13369-L13419


 - [ ] ID-317
[safeconsole.log(bytes32,bool,uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L11917-L11960) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11926-L11948)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11951-L11959)

contracts/lib/forge-std/src/safeconsole.sol#L11917-L11960


 - [ ] ID-318
[safeconsole.log(bool,address,address,address)](contracts/lib/forge-std/src/safeconsole.sol#L5564-L5593) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5571-L5583)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5586-L5592)

contracts/lib/forge-std/src/safeconsole.sol#L5564-L5593


 - [ ] ID-319
[safeconsole.log(address,address,bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L3534-L3584) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3545-L3570)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3573-L3583)

contracts/lib/forge-std/src/safeconsole.sol#L3534-L3584


 - [ ] ID-320
[safeconsole.log(uint256,bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L2184-L2223) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2192-L2212)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2215-L2222)

contracts/lib/forge-std/src/safeconsole.sol#L2184-L2223


 - [ ] ID-321
[Handshake._sendNative(address,uint256)](contracts/src/Handshake.sol#L474-L480) uses assembly
	- [INLINE ASM](contracts/src/Handshake.sol#L476-L478)

contracts/src/Handshake.sol#L474-L480


 - [ ] ID-322
[safeconsole.log(uint256,uint256,bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L9514-L9543) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9521-L9533)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9536-L9542)

contracts/lib/forge-std/src/safeconsole.sol#L9514-L9543


 - [ ] ID-323
[safeconsole.log(address,bool,bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L4045-L4088) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4054-L4076)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4079-L4087)

contracts/lib/forge-std/src/safeconsole.sol#L4045-L4088


 - [ ] ID-324
[safeconsole.log(address,bool,uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L3862-L3891) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3869-L3881)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3884-L3890)

contracts/lib/forge-std/src/safeconsole.sol#L3862-L3891


 - [ ] ID-325
[safeconsole.log(address,bool,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L3924-L3953) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3931-L3943)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3946-L3952)

contracts/lib/forge-std/src/safeconsole.sol#L3924-L3953


 - [ ] ID-326
[safeconsole.log(bytes32,address,address)](contracts/lib/forge-std/src/safeconsole.sol#L2273-L2312) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2281-L2301)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2304-L2311)

contracts/lib/forge-std/src/safeconsole.sol#L2273-L2312


 - [ ] ID-327
[safeconsole.log(uint256,address,bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L8343-L8372) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8350-L8362)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8365-L8371)

contracts/lib/forge-std/src/safeconsole.sol#L8343-L8372


 - [ ] ID-328
[safeconsole.log(uint256,bytes32,bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L10559-L10609) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10570-L10595)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10598-L10608)

contracts/lib/forge-std/src/safeconsole.sol#L10559-L10609


 - [ ] ID-329
[safeconsole.log(bool,uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L1443-L1468) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1449-L1459)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1462-L1467)

contracts/lib/forge-std/src/safeconsole.sol#L1443-L1468


 - [ ] ID-330
[safeconsole.log(address,bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L1028-L1067) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1036-L1056)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1059-L1066)

contracts/lib/forge-std/src/safeconsole.sol#L1028-L1067


 - [ ] ID-331
[safeconsole.log(bool,address,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L5902-L5931) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5909-L5921)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5924-L5930)

contracts/lib/forge-std/src/safeconsole.sol#L5902-L5931


 - [ ] ID-332
[safeconsole.log(bool,address,bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L5733-L5762) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5740-L5752)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5755-L5761)

contracts/lib/forge-std/src/safeconsole.sol#L5733-L5762


 - [ ] ID-333
[safeconsole.log(uint256,bool,address,address)](contracts/lib/forge-std/src/safeconsole.sol#L8744-L8773) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8751-L8763)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8766-L8772)

contracts/lib/forge-std/src/safeconsole.sol#L8744-L8773


 - [ ] ID-334
[safeconsole.log(bytes32,bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L2485-L2524) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2493-L2513)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2516-L2523)

contracts/lib/forge-std/src/safeconsole.sol#L2485-L2524


 - [ ] ID-335
[Strings._unsafeReadBytesOffset(bytes,uint256)](node_modules/@openzeppelin/contracts/utils/Strings.sol#L513-L518) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Strings.sol#L515-L517)

node_modules/@openzeppelin/contracts/utils/Strings.sol#L513-L518


 - [ ] ID-336
[safeconsole.log(uint256,address,bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L8692-L8742) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8703-L8728)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8731-L8741)

contracts/lib/forge-std/src/safeconsole.sol#L8692-L8742


 - [ ] ID-337
[safeconsole.log(bytes32,address,uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L11096-L11139) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11105-L11127)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11130-L11138)

contracts/lib/forge-std/src/safeconsole.sol#L11096-L11139


 - [ ] ID-338
[safeconsole.log(bool,bool,uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L6441-L6470) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6448-L6460)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6463-L6469)

contracts/lib/forge-std/src/safeconsole.sol#L6441-L6470


 - [ ] ID-339
[safeconsole.log(uint256,address,uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L8450-L8479) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8457-L8469)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8472-L8478)

contracts/lib/forge-std/src/safeconsole.sol#L8450-L8479


 - [ ] ID-340
[safeconsole.log(address,address,address,address)](contracts/lib/forge-std/src/safeconsole.sol#L2985-L3014) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2992-L3004)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3007-L3013)

contracts/lib/forge-std/src/safeconsole.sol#L2985-L3014


 - [ ] ID-341
[safeconsole.log(bool,bool,address,address)](contracts/lib/forge-std/src/safeconsole.sol#L6165-L6194) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6172-L6184)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6187-L6193)

contracts/lib/forge-std/src/safeconsole.sol#L6165-L6194


 - [ ] ID-342
[StorageSlot.getStringSlot(string)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L120-L124) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L121-L123)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L120-L124


 - [ ] ID-343
[safeconsole.log(bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L364-L399) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L371-L389)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L392-L398)

contracts/lib/forge-std/src/safeconsole.sol#L364-L399


 - [ ] ID-344
[safeconsole.log(bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L318-L339) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L323-L331)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L334-L338)

contracts/lib/forge-std/src/safeconsole.sol#L318-L339


 - [ ] ID-345
[safeconsole.log(bool,uint256,bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L7270-L7313) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7279-L7301)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7304-L7312)

contracts/lib/forge-std/src/safeconsole.sol#L7270-L7313


 - [ ] ID-346
[safeconsole.log(uint256,uint256,bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L9576-L9619) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9585-L9607)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9610-L9618)

contracts/lib/forge-std/src/safeconsole.sol#L9576-L9619


 - [ ] ID-347
[safeconsole.log(bytes32,uint256,bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L12506-L12549) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12515-L12537)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12540-L12548)

contracts/lib/forge-std/src/safeconsole.sol#L12506-L12549


 - [ ] ID-348
[stdStorageSafe.flatten(bytes32[])](contracts/lib/forge-std/src/StdStorage.sol#L292-L303) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/StdStorage.sol#L297-L299)

contracts/lib/forge-std/src/StdStorage.sol#L292-L303


 - [ ] ID-349
[safeconsole.log(bytes32,address,bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L10954-L10997) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10963-L10985)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10988-L10996)

contracts/lib/forge-std/src/safeconsole.sol#L10954-L10997


 - [ ] ID-350
[console._sendLogPayloadImplementation(bytes)](contracts/lib/forge-std/src/console.sol#L8-L23) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/console.sol#L11-L22)

contracts/lib/forge-std/src/console.sol#L8-L23


 - [ ] ID-351
[safeconsole.log(address,bool,bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L4000-L4043) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4009-L4031)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4034-L4042)

contracts/lib/forge-std/src/safeconsole.sol#L4000-L4043


 - [ ] ID-352
[safeconsole.log(address,bytes32,bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L4975-L5018) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4984-L5006)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5009-L5017)

contracts/lib/forge-std/src/safeconsole.sol#L4975-L5018


 - [ ] ID-353
[safeconsole.log(address,address,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L3323-L3352) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3330-L3342)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3345-L3351)

contracts/lib/forge-std/src/safeconsole.sol#L3323-L3352


 - [ ] ID-354
[safeconsole.log(bool,address,bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L6113-L6163) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6124-L6149)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6152-L6162)

contracts/lib/forge-std/src/safeconsole.sol#L6113-L6163


 - [ ] ID-355
[Math.tryMul(uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L73-L84) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L76-L80)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L73-L84


 - [ ] ID-356
[safeconsole.log(bytes32,address,address,address)](contracts/lib/forge-std/src/safeconsole.sol#L10722-L10765) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10731-L10753)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10756-L10764)

contracts/lib/forge-std/src/safeconsole.sol#L10722-L10765


 - [ ] ID-357
[safeconsole.log(bytes32,uint256,address,address)](contracts/lib/forge-std/src/safeconsole.sol#L12274-L12317) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12283-L12305)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12308-L12316)

contracts/lib/forge-std/src/safeconsole.sol#L12274-L12317


 - [ ] ID-358
[safeconsole.log(bytes32,bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L2834-L2880) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2844-L2867)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2870-L2879)

contracts/lib/forge-std/src/safeconsole.sol#L2834-L2880


 - [ ] ID-359
[Bytes.slice(bytes,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L86-L98) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L93-L95)

node_modules/@openzeppelin/contracts/utils/Bytes.sol#L86-L98


 - [ ] ID-360
[safeconsole.log(bytes32,bytes32,bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L13754-L13811) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13767-L13795)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13798-L13810)

contracts/lib/forge-std/src/safeconsole.sol#L13754-L13811


 - [ ] ID-361
[safeconsole.log(bytes32,address,bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L10909-L10952) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10918-L10940)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10943-L10951)

contracts/lib/forge-std/src/safeconsole.sol#L10909-L10952


 - [ ] ID-362
[safeconsole.log(address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L235-L256) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L240-L248)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L251-L255)

contracts/lib/forge-std/src/safeconsole.sol#L235-L256


 - [ ] ID-363
[safeconsole.log(address,address,address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L3047-L3076) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3054-L3066)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3069-L3075)

contracts/lib/forge-std/src/safeconsole.sol#L3047-L3076


 - [ ] ID-364
[safeconsole.log(uint256,uint256,address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L9407-L9436) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9414-L9426)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9429-L9435)

contracts/lib/forge-std/src/safeconsole.sol#L9407-L9436


 - [ ] ID-365
[safeconsole.log(address,address,bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L3399-L3442) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3408-L3430)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3433-L3441)

contracts/lib/forge-std/src/safeconsole.sol#L3399-L3442


 - [ ] ID-366
[Math.tryMod(uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L102-L110) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L105-L108)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L102-L110


 - [ ] ID-367
[safeconsole.log(bool,uint256,address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L6859-L6902) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6868-L6890)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6893-L6901)

contracts/lib/forge-std/src/safeconsole.sol#L6859-L6902


 - [ ] ID-368
[Math.tryDiv(uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L89-L97) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L92-L95)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L89-L97


 - [ ] ID-369
[safeconsole.log(uint256,bytes32,bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L10507-L10557) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10518-L10543)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10546-L10556)

contracts/lib/forge-std/src/safeconsole.sol#L10507-L10557


 - [ ] ID-370
[safeconsole.log(uint256,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L2034-L2059) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2040-L2050)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2053-L2058)

contracts/lib/forge-std/src/safeconsole.sol#L2034-L2059


 - [ ] ID-371
[safeconsole.log(bytes32,bytes32,uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L13480-L13530) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13491-L13516)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13519-L13529)

contracts/lib/forge-std/src/safeconsole.sol#L13480-L13530


 - [ ] ID-372
[safeconsole.log(bool,uint256,address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L6828-L6857) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6835-L6847)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6850-L6856)

contracts/lib/forge-std/src/safeconsole.sol#L6828-L6857


 - [ ] ID-373
[StorageSlot.getBytesSlot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L129-L133) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L130-L132)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L129-L133


 - [ ] ID-374
[safeconsole.log(uint256,bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L1885-L1910) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1891-L1901)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1904-L1909)

contracts/lib/forge-std/src/safeconsole.sol#L1885-L1910


 - [ ] ID-375
[safeconsole.log(bytes32,address,address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L10857-L10907) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10868-L10893)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10896-L10906)

contracts/lib/forge-std/src/safeconsole.sol#L10857-L10907


 - [ ] ID-376
[StdCheatsSafe.assumeUnusedAddress(address)](contracts/lib/forge-std/src/StdCheats.sol#L352-L362) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/StdCheats.sol#L354-L356)

contracts/lib/forge-std/src/StdCheats.sol#L352-L362


 - [ ] ID-377
[safeconsole.log(bytes32,address,uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L11141-L11184) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11150-L11172)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11175-L11183)

contracts/lib/forge-std/src/safeconsole.sol#L11141-L11184


 - [ ] ID-378
[safeconsole._memcopy(uint256,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L28-L36) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L32-L34)

contracts/lib/forge-std/src/safeconsole.sol#L28-L36


 - [ ] ID-379
[safeconsole.log(bool,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L1497-L1522) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1503-L1513)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1516-L1521)

contracts/lib/forge-std/src/safeconsole.sol#L1497-L1522


 - [ ] ID-380
[safeconsole.log(uint256,bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L2102-L2141) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2110-L2130)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2133-L2140)

contracts/lib/forge-std/src/safeconsole.sol#L2102-L2141


 - [ ] ID-381
[safeconsole.log(bool,address,bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L5795-L5838) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5804-L5826)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L5829-L5837)

contracts/lib/forge-std/src/safeconsole.sol#L5795-L5838


 - [ ] ID-382
[SignatureChecker.isValidERC1271SignatureNowCalldata(address,bytes32,bytes)](node_modules/@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol#L90-L115) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol#L98-L114)

node_modules/@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol#L90-L115


 - [ ] ID-383
[StdCheatsSafe.deployCode(string,bytes)](contracts/lib/forge-std/src/StdCheats.sol#L502-L510) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/StdCheats.sol#L505-L507)

contracts/lib/forge-std/src/StdCheats.sol#L502-L510


 - [ ] ID-384
[safeconsole.log(bytes32,uint256,bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L12596-L12646) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12607-L12632)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12635-L12645)

contracts/lib/forge-std/src/safeconsole.sol#L12596-L12646


 - [ ] ID-385
[safeconsole.log(uint256,address,bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L8647-L8690) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8656-L8678)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8681-L8689)

contracts/lib/forge-std/src/safeconsole.sol#L8647-L8690


 - [ ] ID-386
[safeconsole.log(uint256,address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L1763-L1788) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1769-L1779)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1782-L1787)

contracts/lib/forge-std/src/safeconsole.sol#L1763-L1788


 - [ ] ID-387
[safeconsole.log(bool,bytes32,bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L7554-L7597) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7563-L7585)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7588-L7596)

contracts/lib/forge-std/src/safeconsole.sol#L7554-L7597


 - [ ] ID-388
[Math._zeroBytes(bytes)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L478-L490) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L482-L484)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L478-L490


 - [ ] ID-389
[safeconsole.log(uint256,bool,bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L9158-L9201) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9167-L9189)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9192-L9200)

contracts/lib/forge-std/src/safeconsole.sol#L9158-L9201


 - [ ] ID-390
[Math.tryModExp(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L411-L435) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L413-L434)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L411-L435


 - [ ] ID-391
[safeconsole.log(uint256,address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L1790-L1815) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1796-L1806)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1809-L1814)

contracts/lib/forge-std/src/safeconsole.sol#L1790-L1815


 - [ ] ID-392
[safeconsole.log(address,bool,address,bool)](contracts/lib/forge-std/src/safeconsole.sol#L3617-L3646) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3624-L3636)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3639-L3645)

contracts/lib/forge-std/src/safeconsole.sol#L3617-L3646


 - [ ] ID-393
[StdCheatsSafe._pureChainId()](contracts/lib/forge-std/src/StdCheats.sol#L640-L647) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/StdCheats.sol#L643-L645)

contracts/lib/forge-std/src/StdCheats.sol#L640-L647


 - [ ] ID-394
[safeconsole.log(uint256,uint256,bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L9759-L9802) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9768-L9790)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L9793-L9801)

contracts/lib/forge-std/src/safeconsole.sol#L9759-L9802


 - [ ] ID-395
[safeconsole.log(bytes32,uint256,address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L12364-L12407) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12373-L12395)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12398-L12406)

contracts/lib/forge-std/src/safeconsole.sol#L12364-L12407


 - [ ] ID-396
[safeconsole.log(bool,uint256,uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L7042-L7071) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7049-L7061)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7064-L7070)

contracts/lib/forge-std/src/safeconsole.sol#L7042-L7071


 - [ ] ID-397
[safeconsole.log(bytes32,address,bool,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L10999-L11042) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11008-L11030)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11033-L11041)

contracts/lib/forge-std/src/safeconsole.sol#L10999-L11042


 - [ ] ID-398
[StdUtils._castLogPayloadViewToPure(function(bytes))](contracts/lib/forge-std/src/StdUtils.sol#L174-L182) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/StdUtils.sol#L179-L181)

contracts/lib/forge-std/src/StdUtils.sol#L174-L182


 - [ ] ID-399
[safeconsole.log(bytes32,bool,bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L12059-L12109) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12070-L12095)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12098-L12108)

contracts/lib/forge-std/src/safeconsole.sol#L12059-L12109


 - [ ] ID-400
[safeconsole.log(bytes32,bool,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L11962-L12005) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11971-L11993)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11996-L12004)

contracts/lib/forge-std/src/safeconsole.sol#L11962-L12005


 - [ ] ID-401
[safeconsole.log(address,uint256,bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L4736-L4786) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4747-L4772)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4775-L4785)

contracts/lib/forge-std/src/safeconsole.sol#L4736-L4786


 - [ ] ID-402
[safeconsole.log(bool,bool,bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L6714-L6764) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6725-L6750)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6753-L6763)

contracts/lib/forge-std/src/safeconsole.sol#L6714-L6764


 - [ ] ID-403
[safeconsole.log(bool,bytes32,bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L8032-L8082) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8043-L8068)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8071-L8081)

contracts/lib/forge-std/src/safeconsole.sol#L8032-L8082


 - [ ] ID-404
[safeconsole.log(uint256,bytes32,uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L10455-L10505) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10466-L10491)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10494-L10504)

contracts/lib/forge-std/src/safeconsole.sol#L10455-L10505


 - [ ] ID-405
[safeconsole.log(address,uint256,bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L4325-L4354) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4332-L4344)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4347-L4353)

contracts/lib/forge-std/src/safeconsole.sol#L4325-L4354


 - [ ] ID-406
[safeconsole.log(bool,uint256,bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L7315-L7365) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7326-L7351)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7354-L7364)

contracts/lib/forge-std/src/safeconsole.sol#L7315-L7365


 - [ ] ID-407
[safeconsole.log(uint256,bool,bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L8913-L8942) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8920-L8932)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8935-L8941)

contracts/lib/forge-std/src/safeconsole.sol#L8913-L8942


 - [ ] ID-408
[safeconsole.log(uint256,address,uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L8512-L8555) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8521-L8543)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8546-L8554)

contracts/lib/forge-std/src/safeconsole.sol#L8512-L8555


 - [ ] ID-409
[safeconsole.log(uint256,address,bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L8374-L8417) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8383-L8405)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8408-L8416)

contracts/lib/forge-std/src/safeconsole.sol#L8374-L8417


 - [ ] ID-410
[safeconsole.log(bytes32,bytes32,uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L13636-L13693) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13649-L13677)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13680-L13692)

contracts/lib/forge-std/src/safeconsole.sol#L13636-L13693


 - [ ] ID-411
[safeconsole.log(bool,bytes32,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L7831-L7874) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7840-L7862)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7865-L7873)

contracts/lib/forge-std/src/safeconsole.sol#L7831-L7874


 - [ ] ID-412
[safeconsole._sendLogPayload(uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L11-L19) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L15-L17)

contracts/lib/forge-std/src/safeconsole.sol#L11-L19


 - [ ] ID-413
[safeconsole.logMemory(uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L45-L97) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L52-L60)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L63-L67)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L75-L79)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L82-L87)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L91-L95)

contracts/lib/forge-std/src/safeconsole.sol#L45-L97


 - [ ] ID-414
[safeconsole.log.asm_0.writeString()](contracts/lib/forge-std/src/safeconsole.sol#L13888-L13894) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13888-L13894)

contracts/lib/forge-std/src/safeconsole.sol#L13888-L13894


 - [ ] ID-415
[safeconsole.log(bool,bool,bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L6624-L6667) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6633-L6655)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6658-L6666)

contracts/lib/forge-std/src/safeconsole.sol#L6624-L6667


 - [ ] ID-416
[safeconsole.log(uint256,address,bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L8312-L8341) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8319-L8331)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8334-L8340)

contracts/lib/forge-std/src/safeconsole.sol#L8312-L8341


 - [ ] ID-417
[safeconsole.log(address,bool,bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L4090-L4133) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4099-L4121)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4124-L4132)

contracts/lib/forge-std/src/safeconsole.sol#L4090-L4133


 - [ ] ID-418
[Bytes.concat(bytes[])](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L183-L203) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L194-L196)

node_modules/@openzeppelin/contracts/utils/Bytes.sol#L183-L203


 - [ ] ID-419
[safeconsole.log(bytes32,bool,bool,bool)](contracts/lib/forge-std/src/safeconsole.sol#L11730-L11773) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11739-L11761)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11764-L11772)

contracts/lib/forge-std/src/safeconsole.sol#L11730-L11773


 - [ ] ID-420
[safeconsole.log(uint256,address,address,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L8236-L8279) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8245-L8267)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8270-L8278)

contracts/lib/forge-std/src/safeconsole.sol#L8236-L8279


 - [ ] ID-421
[StdChains.getChainWithUpdatedRpcUrl(string,StdChains.Chain)](contracts/lib/forge-std/src/StdChains.sol#L151-L186) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/StdChains.sol#L179-L181)

contracts/lib/forge-std/src/StdChains.sol#L151-L186


 - [ ] ID-422
[safeconsole.log(bytes32,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L2697-L2736) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2705-L2725)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L2728-L2735)

contracts/lib/forge-std/src/safeconsole.sol#L2697-L2736


 - [ ] ID-423
[Math.add512(uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L25-L30) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L26-L29)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L25-L30


 - [ ] ID-424
[safeconsole.log(bytes32,bytes32,bytes32,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L13872-L13936) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13887-L13918)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13921-L13935)

contracts/lib/forge-std/src/safeconsole.sol#L13872-L13936


 - [ ] ID-425
[safeconsole.log(bytes32,address,bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L11283-L11333) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11294-L11319)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11322-L11332)

contracts/lib/forge-std/src/safeconsole.sol#L11283-L11333


 - [ ] ID-426
[safeconsole.log(address,address,bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L3216-L3259) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3225-L3247)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3250-L3258)

contracts/lib/forge-std/src/safeconsole.sol#L3216-L3259


 - [ ] ID-427
[safeconsole.log(bool,bool,bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L6579-L6622) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6588-L6610)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L6613-L6621)

contracts/lib/forge-std/src/safeconsole.sol#L6579-L6622


 - [ ] ID-428
[MessageHashUtils.toDomainSeparator(bytes1,bytes32,bytes32,uint256,address,bytes32)](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L137-L179) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L147-L178)

node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L137-L179


 - [ ] ID-429
[safeconsole.log(uint256,bytes32,address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L10036-L10079) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10045-L10067)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10070-L10078)

contracts/lib/forge-std/src/safeconsole.sol#L10036-L10079


 - [ ] ID-430
[safeconsole.log(bytes32,bytes32,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L13584-L13634) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13595-L13620)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13623-L13633)

contracts/lib/forge-std/src/safeconsole.sol#L13584-L13634


 - [ ] ID-431
[safeconsole.log(bool,bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L1321-L1346) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1327-L1337)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L1340-L1345)

contracts/lib/forge-std/src/safeconsole.sol#L1321-L1346


 - [ ] ID-432
[safeconsole.log(bytes32,address,bool,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L11044-L11094) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11055-L11080)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11083-L11093)

contracts/lib/forge-std/src/safeconsole.sol#L11044-L11094


 - [ ] ID-433
[safeconsole.log(bytes32,bytes32,bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L13265-L13315) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13276-L13301)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L13304-L13314)

contracts/lib/forge-std/src/safeconsole.sol#L13265-L13315


 - [ ] ID-434
[safeconsole.log(address)](contracts/lib/forge-std/src/safeconsole.sol#L99-L116) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L103-L109)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L112-L115)

contracts/lib/forge-std/src/safeconsole.sol#L99-L116


 - [ ] ID-435
[safeconsole.log(address,uint256,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L960-L985) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L966-L976)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L979-L984)

contracts/lib/forge-std/src/safeconsole.sol#L960-L985


 - [ ] ID-436
[safeconsole.log(bytes32,uint256,bool,address)](contracts/lib/forge-std/src/safeconsole.sol#L12461-L12504) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12470-L12492)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12495-L12503)

contracts/lib/forge-std/src/safeconsole.sol#L12461-L12504


 - [ ] ID-437
[safeconsole.log(address,uint256,bytes32,address)](contracts/lib/forge-std/src/safeconsole.sol#L4601-L4644) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4610-L4632)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L4635-L4643)

contracts/lib/forge-std/src/safeconsole.sol#L4601-L4644


 - [ ] ID-438
[safeconsole.log(bool,bytes32,bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L7980-L8030) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L7991-L8016)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8019-L8029)

contracts/lib/forge-std/src/safeconsole.sol#L7980-L8030


 - [ ] ID-439
[safeconsole.log(bytes32,address,uint256,bytes32)](contracts/lib/forge-std/src/safeconsole.sol#L11231-L11281) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11242-L11267)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11270-L11280)

contracts/lib/forge-std/src/safeconsole.sol#L11231-L11281


 - [ ] ID-440
[safeconsole.log(uint256,address,uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L8419-L8448) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8426-L8438)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L8441-L8447)

contracts/lib/forge-std/src/safeconsole.sol#L8419-L8448


 - [ ] ID-441
[safeconsole.log(bytes32,bool,uint256,address)](contracts/lib/forge-std/src/safeconsole.sol#L11872-L11915) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11881-L11903)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11906-L11914)

contracts/lib/forge-std/src/safeconsole.sol#L11872-L11915


 - [ ] ID-442
[safeconsole.log(address,address,bytes32,bool)](contracts/lib/forge-std/src/safeconsole.sol#L3444-L3487) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3453-L3475)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3478-L3486)

contracts/lib/forge-std/src/safeconsole.sol#L3444-L3487


 - [ ] ID-443
[safeconsole.log(address,bool,address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L3648-L3677) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3655-L3667)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L3670-L3676)

contracts/lib/forge-std/src/safeconsole.sol#L3648-L3677


 - [ ] ID-444
[safeconsole.log(address,address)](contracts/lib/forge-std/src/safeconsole.sol#L189-L210) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L194-L202)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L205-L209)

contracts/lib/forge-std/src/safeconsole.sol#L189-L210


 - [ ] ID-445
[safeconsole.log(bytes32,bool,address,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L11588-L11631) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11597-L11619)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L11622-L11630)

contracts/lib/forge-std/src/safeconsole.sol#L11588-L11631


 - [ ] ID-446
[safeconsole.log(uint256,bytes32,uint256,bool)](contracts/lib/forge-std/src/safeconsole.sol#L10365-L10408) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10374-L10396)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L10399-L10407)

contracts/lib/forge-std/src/safeconsole.sol#L10365-L10408


 - [ ] ID-447
[safeconsole.log(bytes32,uint256,bytes32,uint256)](contracts/lib/forge-std/src/safeconsole.sol#L12939-L12989) uses assembly
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12950-L12975)
	- [INLINE ASM](contracts/lib/forge-std/src/safeconsole.sol#L12978-L12988)

contracts/lib/forge-std/src/safeconsole.sol#L12939-L12989


## boolean-equal
Impact: Informational
Confidence: High
 - [ ] ID-448
[StdCheatsSafe.assumeNotBlacklisted(address,address)](contracts/lib/forge-std/src/StdCheats.sol#L209-L227) compares to a boolean constant:
	-[vm.assume(! success || abi.decode(returnData,(bool)) == false)](contracts/lib/forge-std/src/StdCheats.sol#L226)

contracts/lib/forge-std/src/StdCheats.sol#L209-L227


 - [ ] ID-449
[StdCheatsSafe.assumeNotBlacklisted(address,address)](contracts/lib/forge-std/src/StdCheats.sol#L209-L227) compares to a boolean constant:
	-[vm.assume(! success || abi.decode(returnData,(bool)) == false)](contracts/lib/forge-std/src/StdCheats.sol#L222)

contracts/lib/forge-std/src/StdCheats.sol#L209-L227


## pragma
Impact: Informational
Confidence: High
 - [ ] ID-450
9 different versions of Solidity are used:
	- Version constraint >=0.6.2<0.9.0 is used by:
		-[>=0.6.2<0.9.0](contracts/lib/forge-std/src/Base.sol#L2)
		-[>=0.6.2<0.9.0](contracts/lib/forge-std/src/Script.sol#L2)
		-[>=0.6.2<0.9.0](contracts/lib/forge-std/src/StdChains.sol#L2)
		-[>=0.6.2<0.9.0](contracts/lib/forge-std/src/StdCheats.sol#L2)
		-[>=0.6.2<0.9.0](contracts/lib/forge-std/src/StdMath.sol#L2)
		-[>=0.6.2<0.9.0](contracts/lib/forge-std/src/StdStorage.sol#L2)
		-[>=0.6.2<0.9.0](contracts/lib/forge-std/src/StdUtils.sol#L2)
		-[>=0.6.2<0.9.0](contracts/lib/forge-std/src/Vm.sol#L4)
		-[>=0.6.2<0.9.0](contracts/lib/forge-std/src/interfaces/IMulticall3.sol#L2)
		-[>=0.6.2<0.9.0](contracts/lib/forge-std/src/safeconsole.sol#L2)
	- Version constraint >=0.6.0<0.9.0 is used by:
		-[>=0.6.0<0.9.0](contracts/lib/forge-std/src/StdJson.sol#L2)
	- Version constraint >=0.4.22<0.9.0 is used by:
		-[>=0.4.22<0.9.0](contracts/lib/forge-std/src/StdStyle.sol#L2)
		-[>=0.4.22<0.9.0](contracts/lib/forge-std/src/console.sol#L2)
		-[>=0.4.22<0.9.0](contracts/lib/forge-std/src/console2.sol#L2)
	- Version constraint 0.8.28 is used by:
		-[0.8.28](contracts/script/Deploy.s.sol#L2)
		-[0.8.28](contracts/src/Handshake.sol#L2)
	- Version constraint ^0.8.20 is used by:
		-[^0.8.20](node_modules/@openzeppelin/contracts/access/Ownable.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/access/Ownable2Step.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/Context.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/Panic.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/Pausable.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/ReentrancyGuard.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L5)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/math/SafeCast.sol#L5)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/math/SignedMath.sol#L4)
	- Version constraint >=0.5.0 is used by:
		-[>=0.5.0](node_modules/@openzeppelin/contracts/interfaces/IERC1271.sol#L4)
		-[>=0.5.0](node_modules/@openzeppelin/contracts/interfaces/IERC7913.sol#L4)
	- Version constraint >=0.4.16 is used by:
		-[>=0.4.16](node_modules/@openzeppelin/contracts/interfaces/IERC5267.sol#L4)
		-[>=0.4.16](node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#L4)
	- Version constraint >=0.6.2 is used by:
		-[>=0.6.2](node_modules/@openzeppelin/contracts/token/ERC721/IERC721.sol#L4)
	- Version constraint ^0.8.24 is used by:
		-[^0.8.24](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L4)
		-[^0.8.24](node_modules/@openzeppelin/contracts/utils/Strings.sol#L4)
		-[^0.8.24](node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L4)
		-[^0.8.24](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L4)
		-[^0.8.24](node_modules/@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol#L4)

contracts/lib/forge-std/src/Base.sol#L2


## cyclomatic-complexity
Impact: Informational
Confidence: High
 - [ ] ID-451
[Handshake.fulfillTrade(Handshake.TradeOrder,bytes)](contracts/src/Handshake.sol#L224-L305) has a high cyclomatic complexity (16).

contracts/src/Handshake.sol#L224-L305


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-452
Version constraint >=0.4.22<0.9.0 is too complex.
It is used by:
	- [>=0.4.22<0.9.0](contracts/lib/forge-std/src/StdStyle.sol#L2)
	- [>=0.4.22<0.9.0](contracts/lib/forge-std/src/console.sol#L2)
	- [>=0.4.22<0.9.0](contracts/lib/forge-std/src/console2.sol#L2)

contracts/lib/forge-std/src/StdStyle.sol#L2


 - [ ] ID-453
Version constraint ^0.8.20 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
	- VerbatimInvalidDeduplication
	- FullInlinerNonExpressionSplitArgumentEvaluationOrder
	- MissingSideEffectsOnSelectorAccess.
It is used by:
	- [^0.8.20](node_modules/@openzeppelin/contracts/access/Ownable.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/access/Ownable2Step.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/Context.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/Panic.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/Pausable.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/ReentrancyGuard.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L5)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/math/SafeCast.sol#L5)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/math/SignedMath.sol#L4)

node_modules/@openzeppelin/contracts/access/Ownable.sol#L4


 - [ ] ID-454
Version constraint >=0.6.0<0.9.0 is too complex.
It is used by:
	- [>=0.6.0<0.9.0](contracts/lib/forge-std/src/StdJson.sol#L2)

contracts/lib/forge-std/src/StdJson.sol#L2


 - [ ] ID-455
Version constraint >=0.6.2<0.9.0 is too complex.
It is used by:
	- [>=0.6.2<0.9.0](contracts/lib/forge-std/src/Base.sol#L2)
	- [>=0.6.2<0.9.0](contracts/lib/forge-std/src/Script.sol#L2)
	- [>=0.6.2<0.9.0](contracts/lib/forge-std/src/StdChains.sol#L2)
	- [>=0.6.2<0.9.0](contracts/lib/forge-std/src/StdCheats.sol#L2)
	- [>=0.6.2<0.9.0](contracts/lib/forge-std/src/StdMath.sol#L2)
	- [>=0.6.2<0.9.0](contracts/lib/forge-std/src/StdStorage.sol#L2)
	- [>=0.6.2<0.9.0](contracts/lib/forge-std/src/StdUtils.sol#L2)
	- [>=0.6.2<0.9.0](contracts/lib/forge-std/src/Vm.sol#L4)
	- [>=0.6.2<0.9.0](contracts/lib/forge-std/src/interfaces/IMulticall3.sol#L2)
	- [>=0.6.2<0.9.0](contracts/lib/forge-std/src/safeconsole.sol#L2)

contracts/lib/forge-std/src/Base.sol#L2


 - [ ] ID-456
Version constraint >=0.4.16 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
	- DirtyBytesArrayToStorage
	- ABIDecodeTwoDimensionalArrayMemory
	- KeccakCaching
	- EmptyByteArrayCopy
	- DynamicArrayCleanup
	- ImplicitConstructorCallvalueCheck
	- TupleAssignmentMultiStackSlotComponents
	- MemoryArrayCreationOverflow
	- privateCanBeOverridden
	- SignedArrayStorageCopy
	- ABIEncoderV2StorageArrayWithMultiSlotElement
	- DynamicConstructorArgumentsClippedABIV2
	- UninitializedFunctionPointerInConstructor_0.4.x
	- IncorrectEventSignatureInLibraries_0.4.x
	- ExpExponentCleanup
	- NestedArrayFunctionCallDecoder
	- ZeroFunctionSelector.
It is used by:
	- [>=0.4.16](node_modules/@openzeppelin/contracts/interfaces/IERC5267.sol#L4)
	- [>=0.4.16](node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#L4)

node_modules/@openzeppelin/contracts/interfaces/IERC5267.sol#L4


 - [ ] ID-457
Version constraint >=0.5.0 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
	- DirtyBytesArrayToStorage
	- ABIDecodeTwoDimensionalArrayMemory
	- KeccakCaching
	- EmptyByteArrayCopy
	- DynamicArrayCleanup
	- ImplicitConstructorCallvalueCheck
	- TupleAssignmentMultiStackSlotComponents
	- MemoryArrayCreationOverflow
	- privateCanBeOverridden
	- SignedArrayStorageCopy
	- ABIEncoderV2StorageArrayWithMultiSlotElement
	- DynamicConstructorArgumentsClippedABIV2
	- UninitializedFunctionPointerInConstructor
	- IncorrectEventSignatureInLibraries
	- ABIEncoderV2PackedStorage.
It is used by:
	- [>=0.5.0](node_modules/@openzeppelin/contracts/interfaces/IERC1271.sol#L4)
	- [>=0.5.0](node_modules/@openzeppelin/contracts/interfaces/IERC7913.sol#L4)

node_modules/@openzeppelin/contracts/interfaces/IERC1271.sol#L4


 - [ ] ID-458
Version constraint >=0.6.2 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
	- MissingSideEffectsOnSelectorAccess
	- AbiReencodingHeadOverflowWithStaticArrayCleanup
	- DirtyBytesArrayToStorage
	- NestedCalldataArrayAbiReencodingSizeValidation
	- ABIDecodeTwoDimensionalArrayMemory
	- KeccakCaching
	- EmptyByteArrayCopy
	- DynamicArrayCleanup
	- MissingEscapingInFormatting
	- ArraySliceDynamicallyEncodedBaseType
	- ImplicitConstructorCallvalueCheck
	- TupleAssignmentMultiStackSlotComponents
	- MemoryArrayCreationOverflow.
It is used by:
	- [>=0.6.2](node_modules/@openzeppelin/contracts/token/ERC721/IERC721.sol#L4)

node_modules/@openzeppelin/contracts/token/ERC721/IERC721.sol#L4


## low-level-calls
Impact: Informational
Confidence: High
 - [ ] ID-459
Low level call in [StdCheatsSafe._isPayable(address)](contracts/lib/forge-std/src/StdCheats.sol#L284-L300):
	- [(success,None) = address(addr).call{value: 1}()](contracts/lib/forge-std/src/StdCheats.sol#L293)

contracts/lib/forge-std/src/StdCheats.sol#L284-L300


 - [ ] ID-460
Low level call in [stdStorageSafe.callTarget(StdStorage)](contracts/lib/forge-std/src/StdStorage.sol#L44-L50):
	- [(success,rdat) = self._target.staticcall(cald)](contracts/lib/forge-std/src/StdStorage.sol#L46)

contracts/lib/forge-std/src/StdStorage.sol#L44-L50


 - [ ] ID-461
Low level call in [StdCheats.dealERC1155(address,address,uint256,uint256,bool)](contracts/lib/forge-std/src/StdCheats.sol#L761-L784):
	- [(None,balData) = token.staticcall(abi.encodeWithSelector(0x00fdd58e,to,id))](contracts/lib/forge-std/src/StdCheats.sol#L763)
	- [(None,totSupData) = token.staticcall(abi.encodeWithSelector(0xbd85b039,id))](contracts/lib/forge-std/src/StdCheats.sol#L771)

contracts/lib/forge-std/src/StdCheats.sol#L761-L784


 - [ ] ID-462
Low level call in [SignatureChecker.isValidSignatureNow(bytes,bytes32,bytes)](node_modules/@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol#L132-L149):
	- [(success,result) = address(bytes20(signer)).staticcall(abi.encodeCall(IERC7913SignatureVerifier.verify,(signer.slice(20),hash,signature)))](node_modules/@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol#L142-L144)

node_modules/@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol#L132-L149


 - [ ] ID-463
Low level call in [StdCheats.deal(address,address,uint256,bool)](contracts/lib/forge-std/src/StdCheats.sol#L740-L759):
	- [(None,balData) = token.staticcall(abi.encodeWithSelector(0x70a08231,to))](contracts/lib/forge-std/src/StdCheats.sol#L742)
	- [(None,totSupData) = token.staticcall(abi.encodeWithSelector(0x18160ddd))](contracts/lib/forge-std/src/StdCheats.sol#L750)

contracts/lib/forge-std/src/StdCheats.sol#L740-L759


 - [ ] ID-464
Low level call in [StdCheats.deployCodeTo(string,bytes,uint256,address)](contracts/lib/forge-std/src/StdCheats.sol#L816-L822):
	- [(success,runtimeBytecode) = where.call{value: value}()](contracts/lib/forge-std/src/StdCheats.sol#L819)

contracts/lib/forge-std/src/StdCheats.sol#L816-L822


 - [ ] ID-465
Low level call in [StdCheats.dealERC721(address,address,uint256)](contracts/lib/forge-std/src/StdCheats.sol#L786-L806):
	- [(successMinted,ownerData) = token.staticcall(abi.encodeWithSelector(0x6352211e,id))](contracts/lib/forge-std/src/StdCheats.sol#L788)
	- [(None,fromBalData) = token.staticcall(abi.encodeWithSelector(0x70a08231,abi.decode(ownerData,(address))))](contracts/lib/forge-std/src/StdCheats.sol#L792-L793)
	- [(None,toBalData) = token.staticcall(abi.encodeWithSelector(0x70a08231,to))](contracts/lib/forge-std/src/StdCheats.sol#L797)

contracts/lib/forge-std/src/StdCheats.sol#L786-L806


 - [ ] ID-466
Low level call in [StdCheats.console2_log_StdCheats(string)](contracts/lib/forge-std/src/StdCheats.sol#L825-L828):
	- [(status,None) = address(CONSOLE2_ADDRESS).staticcall(abi.encodeWithSignature(log(string),p0))](contracts/lib/forge-std/src/StdCheats.sol#L826)

contracts/lib/forge-std/src/StdCheats.sol#L825-L828


 - [ ] ID-467
Low level call in [StdCheatsSafe.assumeNotBlacklisted(address,address)](contracts/lib/forge-std/src/StdCheats.sol#L209-L227):
	- [(success,returnData) = token.staticcall(abi.encodeWithSelector(0xfe575a87,addr))](contracts/lib/forge-std/src/StdCheats.sol#L221)
	- [(success,returnData) = token.staticcall(abi.encodeWithSelector(0xe47d6060,addr))](contracts/lib/forge-std/src/StdCheats.sol#L225)

contracts/lib/forge-std/src/StdCheats.sol#L209-L227


## naming-convention
Impact: Informational
Confidence: High
 - [ ] ID-468
Parameter [stdStorage.sig(StdStorage,string)._sig](contracts/lib/forge-std/src/StdStorage.sol#L357) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L357


 - [ ] ID-469
Function [stdStorageSafe.enable_packed_slots(StdStorage)](contracts/lib/forge-std/src/StdStorage.sol#L206-L209) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L206-L209


 - [ ] ID-470
Function [stdStorageSafe.read_uint(StdStorage)](contracts/lib/forge-std/src/StdStorage.sol#L239-L241) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L239-L241


 - [ ] ID-471
Parameter [stdStorage.target(StdStorage,address)._target](contracts/lib/forge-std/src/StdStorage.sol#L349) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L349


 - [ ] ID-472
Function [stdStorageSafe.read_int(StdStorage)](contracts/lib/forge-std/src/StdStorage.sol#L243-L245) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L243-L245


 - [ ] ID-473
Parameter [stdStorageSafe.sig(StdStorage,bytes4)._sig](contracts/lib/forge-std/src/StdStorage.sol#L176) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L176


 - [ ] ID-474
Parameter [stdStorage.find(StdStorage,bool)._clear](contracts/lib/forge-std/src/StdStorage.sol#L345) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L345


 - [ ] ID-475
Function [stdStorage.checked_write(StdStorage,bytes32)](contracts/lib/forge-std/src/StdStorage.sol#L410-L444) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L410-L444


 - [ ] ID-476
Parameter [safeconsole.log.asm_0.writeString().w_log_asm_0_writeString](contracts/lib/forge-std/src/safeconsole.sol#L13888) is not in mixedCase

contracts/lib/forge-std/src/safeconsole.sol#L13888


 - [ ] ID-477
Constant [StdUtils.multicall](contracts/lib/forge-std/src/StdUtils.sol#L14) is not in UPPER_CASE_WITH_UNDERSCORES

contracts/lib/forge-std/src/StdUtils.sol#L14


 - [ ] ID-478
Parameter [stdStorage.sig(StdStorage,bytes4)._sig](contracts/lib/forge-std/src/StdStorage.sol#L353) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L353


 - [ ] ID-479
Function [stdStorage.enable_packed_slots(StdStorage)](contracts/lib/forge-std/src/StdStorage.sol#L377-L379) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L377-L379


 - [ ] ID-480
Constant [stdJson.vm](contracts/lib/forge-std/src/StdJson.sol#L26) is not in UPPER_CASE_WITH_UNDERSCORES

contracts/lib/forge-std/src/StdJson.sol#L26


 - [ ] ID-481
Parameter [stdStorage.with_calldata(StdStorage,bytes)._calldata](contracts/lib/forge-std/src/StdStorage.sol#L373) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L373


 - [ ] ID-482
Constant [StdCheatsSafe.vm](contracts/lib/forge-std/src/StdCheats.sol#L11) is not in UPPER_CASE_WITH_UNDERSCORES

contracts/lib/forge-std/src/StdCheats.sol#L11


 - [ ] ID-483
Function [stdStorage.checked_write(StdStorage,bool)](contracts/lib/forge-std/src/StdStorage.sol#L401-L408) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L401-L408


 - [ ] ID-484
Parameter [stdStorageSafe.with_calldata(StdStorage,bytes)._calldata](contracts/lib/forge-std/src/StdStorage.sol#L186) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L186


 - [ ] ID-485
Function [stdStorageSafe.with_calldata(StdStorage,bytes)](contracts/lib/forge-std/src/StdStorage.sol#L186-L189) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L186-L189


 - [ ] ID-486
Function [stdStorageSafe.read_bytes32(StdStorage)](contracts/lib/forge-std/src/StdStorage.sol#L224-L226) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L224-L226


 - [ ] ID-487
Function [stdStorage.with_key(StdStorage,bytes32)](contracts/lib/forge-std/src/StdStorage.sol#L369-L371) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L369-L371


 - [ ] ID-488
Function [stdStorage.read_uint(StdStorage)](contracts/lib/forge-std/src/StdStorage.sol#L458-L460) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L458-L460


 - [ ] ID-489
Constant [StdCheats.vm](contracts/lib/forge-std/src/StdCheats.sol#L655) is not in UPPER_CASE_WITH_UNDERSCORES

contracts/lib/forge-std/src/StdCheats.sol#L655


 - [ ] ID-490
Function [stdStorageSafe.read_address(StdStorage)](contracts/lib/forge-std/src/StdStorage.sol#L235-L237) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L235-L237


 - [ ] ID-491
Parameter [stdStorage.depth(StdStorage,uint256)._depth](contracts/lib/forge-std/src/StdStorage.sol#L381) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L381


 - [ ] ID-492
Function [StdCheats.console2_log_StdCheats(string)](contracts/lib/forge-std/src/StdCheats.sol#L825-L828) is not in mixedCase

contracts/lib/forge-std/src/StdCheats.sol#L825-L828


 - [ ] ID-493
Variable [Script.IS_SCRIPT](contracts/lib/forge-std/src/Script.sol#L26) is not in mixedCase

contracts/lib/forge-std/src/Script.sol#L26


 - [ ] ID-494
Event [stdStorageSafe.WARNING_UninitedSlot(address,uint256)](contracts/lib/forge-std/src/StdStorage.sol#L26) is not in CapWords

contracts/lib/forge-std/src/StdStorage.sol#L26


 - [ ] ID-495
Contract [console](contracts/lib/forge-std/src/console.sol#L4-L1560) is not in CapWords

contracts/lib/forge-std/src/console.sol#L4-L1560


 - [ ] ID-496
Function [StdUtils.console2_log_StdUtils(string,uint256)](contracts/lib/forge-std/src/StdUtils.sol#L202-L204) is not in mixedCase

contracts/lib/forge-std/src/StdUtils.sol#L202-L204


 - [ ] ID-497
Function [EIP712._EIP712Version()](node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L157-L159) is not in mixedCase

node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L157-L159


 - [ ] ID-498
Function [stdStorage.read_int(StdStorage)](contracts/lib/forge-std/src/StdStorage.sol#L462-L464) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L462-L464


 - [ ] ID-499
Constant [StdChains.vm](contracts/lib/forge-std/src/StdChains.sol#L35) is not in UPPER_CASE_WITH_UNDERSCORES

contracts/lib/forge-std/src/StdChains.sol#L35


 - [ ] ID-500
Function [stdStorage.checked_write(StdStorage,address)](contracts/lib/forge-std/src/StdStorage.sol#L389-L391) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L389-L391


 - [ ] ID-501
Function [stdStorage.read_bool(StdStorage)](contracts/lib/forge-std/src/StdStorage.sol#L450-L452) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L450-L452


 - [ ] ID-502
Contract [stdStorage](contracts/lib/forge-std/src/StdStorage.sol#L334-L473) is not in CapWords

contracts/lib/forge-std/src/StdStorage.sol#L334-L473


 - [ ] ID-503
Contract [stdJson](contracts/lib/forge-std/src/StdJson.sol#L25-L283) is not in CapWords

contracts/lib/forge-std/src/StdJson.sol#L25-L283


 - [ ] ID-504
Parameter [safeconsole.log.asm_0.writeString().pos_log_asm_0_writeString](contracts/lib/forge-std/src/safeconsole.sol#L13888) is not in mixedCase

contracts/lib/forge-std/src/safeconsole.sol#L13888


 - [ ] ID-505
Constant [stdStorageSafe.vm](contracts/lib/forge-std/src/StdStorage.sol#L28) is not in UPPER_CASE_WITH_UNDERSCORES

contracts/lib/forge-std/src/StdStorage.sol#L28


 - [ ] ID-506
Constant [StdStyle.vm](contracts/lib/forge-std/src/StdStyle.sol#L7) is not in UPPER_CASE_WITH_UNDERSCORES

contracts/lib/forge-std/src/StdStyle.sol#L7


 - [ ] ID-507
Constant [stdStorage.vm](contracts/lib/forge-std/src/StdStorage.sol#L335) is not in UPPER_CASE_WITH_UNDERSCORES

contracts/lib/forge-std/src/StdStorage.sol#L335


 - [ ] ID-508
Constant [ScriptBase.vmSafe](contracts/lib/forge-std/src/Base.sol#L34) is not in UPPER_CASE_WITH_UNDERSCORES

contracts/lib/forge-std/src/Base.sol#L34


 - [ ] ID-509
Function [stdStorage.with_key(StdStorage,address)](contracts/lib/forge-std/src/StdStorage.sol#L361-L363) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L361-L363


 - [ ] ID-510
Function [stdStorage.checked_write(StdStorage,uint256)](contracts/lib/forge-std/src/StdStorage.sol#L393-L395) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L393-L395


 - [ ] ID-511
Contract [stdStorageSafe](contracts/lib/forge-std/src/StdStorage.sol#L24-L332) is not in CapWords

contracts/lib/forge-std/src/StdStorage.sol#L24-L332


 - [ ] ID-512
Function [stdStorageSafe.with_key(StdStorage,address)](contracts/lib/forge-std/src/StdStorage.sol#L191-L194) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L191-L194


 - [ ] ID-513
Contract [stdMath](contracts/lib/forge-std/src/StdMath.sol#L4-L43) is not in CapWords

contracts/lib/forge-std/src/StdMath.sol#L4-L43


 - [ ] ID-514
Function [StdUtils.console2_log_StdUtils(string)](contracts/lib/forge-std/src/StdUtils.sol#L198-L200) is not in mixedCase

contracts/lib/forge-std/src/StdUtils.sol#L198-L200


 - [ ] ID-515
Function [stdStorage.with_calldata(StdStorage,bytes)](contracts/lib/forge-std/src/StdStorage.sol#L373-L375) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L373-L375


 - [ ] ID-516
Parameter [stdStorageSafe.depth(StdStorage,uint256)._depth](contracts/lib/forge-std/src/StdStorage.sol#L211) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L211


 - [ ] ID-517
Parameter [stdStorageSafe.find(StdStorage,bool)._clear](contracts/lib/forge-std/src/StdStorage.sol#L106) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L106


 - [ ] ID-518
Function [stdStorage.read_address(StdStorage)](contracts/lib/forge-std/src/StdStorage.sol#L454-L456) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L454-L456


 - [ ] ID-519
Function [VmSafe.eth_getLogs(uint256,uint256,address,bytes32[])](contracts/lib/forge-std/src/Vm.sol#L593-L595) is not in mixedCase

contracts/lib/forge-std/src/Vm.sol#L593-L595


 - [ ] ID-520
Parameter [stdStorageSafe.target(StdStorage,address)._target](contracts/lib/forge-std/src/StdStorage.sol#L171) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L171


 - [ ] ID-521
Contract [safeconsole](contracts/lib/forge-std/src/safeconsole.sol#L6-L13937) is not in CapWords

contracts/lib/forge-std/src/safeconsole.sol#L6-L13937


 - [ ] ID-522
Constant [StdUtils.vm](contracts/lib/forge-std/src/StdUtils.sol#L15) is not in UPPER_CASE_WITH_UNDERSCORES

contracts/lib/forge-std/src/StdUtils.sol#L15


 - [ ] ID-523
Function [stdStorageSafe.with_key(StdStorage,uint256)](contracts/lib/forge-std/src/StdStorage.sol#L196-L199) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L196-L199


 - [ ] ID-524
Function [StdUtils.console2_log_StdUtils(string,string)](contracts/lib/forge-std/src/StdUtils.sol#L206-L208) is not in mixedCase

contracts/lib/forge-std/src/StdUtils.sol#L206-L208


 - [ ] ID-525
Parameter [stdStorageSafe.sig(StdStorage,string)._sig](contracts/lib/forge-std/src/StdStorage.sol#L181) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L181


 - [ ] ID-526
Function [stdStorageSafe.read_bool(StdStorage)](contracts/lib/forge-std/src/StdStorage.sol#L228-L233) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L228-L233


 - [ ] ID-527
Function [stdStorage.checked_write_int(StdStorage,int256)](contracts/lib/forge-std/src/StdStorage.sol#L397-L399) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L397-L399


 - [ ] ID-528
Function [stdStorageSafe.with_key(StdStorage,bytes32)](contracts/lib/forge-std/src/StdStorage.sol#L201-L204) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L201-L204


 - [ ] ID-529
Function [EIP712._EIP712Name()](node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L146-L148) is not in mixedCase

node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L146-L148


 - [ ] ID-530
Constant [CommonBase.vm](contracts/lib/forge-std/src/Base.sol#L27) is not in UPPER_CASE_WITH_UNDERSCORES

contracts/lib/forge-std/src/Base.sol#L27


 - [ ] ID-531
Function [stdStorage.with_key(StdStorage,uint256)](contracts/lib/forge-std/src/StdStorage.sol#L365-L367) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L365-L367


 - [ ] ID-532
Function [stdStorage.read_bytes32(StdStorage)](contracts/lib/forge-std/src/StdStorage.sol#L446-L448) is not in mixedCase

contracts/lib/forge-std/src/StdStorage.sol#L446-L448


## redundant-statements
Impact: Informational
Confidence: High
 - [ ] ID-533
Redundant expression "[status](contracts/lib/forge-std/src/StdCheats.sol#L827)" in[StdCheats](contracts/lib/forge-std/src/StdCheats.sol#L651-L829)

contracts/lib/forge-std/src/StdCheats.sol#L827


## too-many-digits
Impact: Informational
Confidence: Medium
 - [ ] ID-534
[Bytes.toNibbles(bytes)](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L210-L245) uses literals with too many digits:
	- [chunk_toNibbles_asm_0 = 0x00000000ffffffff00000000ffffffff00000000ffffffff00000000ffffffff & chunk_toNibbles_asm_0 << 32 | chunk_toNibbles_asm_0](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L226-L229)

node_modules/@openzeppelin/contracts/utils/Bytes.sol#L210-L245


 - [ ] ID-535
[Math.log2(uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L619-L658) uses literals with too many digits:
	- [r = r | byte(uint256,uint256)(x >> r,0x0000010102020202030303030303030300000000000000000000000000000000)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L656)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L619-L658


 - [ ] ID-536
[safeconsole.slitherConstructorConstantVariables()](contracts/lib/forge-std/src/safeconsole.sol#L6-L13937) uses literals with too many digits:
	- [CONSOLE_ADDR = 0x000000000000000000000000000000000000000000636F6e736F6c652e6c6f67](contracts/lib/forge-std/src/safeconsole.sol#L7)

contracts/lib/forge-std/src/safeconsole.sol#L6-L13937


 - [ ] ID-537
[ShortStrings.slitherConstructorConstantVariables()](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L40-L122) uses literals with too many digits:
	- [FALLBACK_SENTINEL = 0x00000000000000000000000000000000000000000000000000000000000000FF](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L42)

node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L40-L122


 - [ ] ID-538
[Bytes.reverseBytes32(bytes32)](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L258-L272) uses literals with too many digits:
	- [value = ((value >> 32) & 0x00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF) | ((value & 0x00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF) << 32)](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L265-L267)

node_modules/@openzeppelin/contracts/utils/Bytes.sol#L258-L272


 - [ ] ID-539
[Bytes.toNibbles(bytes)](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L210-L245) uses literals with too many digits:
	- [chunk_toNibbles_asm_0 = 0x0000000000000000ffffffffffffffff0000000000000000ffffffffffffffff & chunk_toNibbles_asm_0 << 64 | chunk_toNibbles_asm_0](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L222-L225)

node_modules/@openzeppelin/contracts/utils/Bytes.sol#L210-L245


 - [ ] ID-540
[Bytes.reverseBytes16(bytes16)](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L275-L286) uses literals with too many digits:
	- [value = ((value & 0xFFFFFFFF00000000FFFFFFFF00000000) >> 32) | ((value & 0x00000000FFFFFFFF00000000FFFFFFFF) << 32)](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L282-L284)

node_modules/@openzeppelin/contracts/utils/Bytes.sol#L275-L286


 - [ ] ID-541
[Bytes.reverseBytes32(bytes32)](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L258-L272) uses literals with too many digits:
	- [value = ((value >> 64) & 0x0000000000000000FFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF) | ((value & 0x0000000000000000FFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF) << 64)](node_modules/@openzeppelin/contracts/utils/Bytes.sol#L268-L270)

node_modules/@openzeppelin/contracts/utils/Bytes.sol#L258-L272


## unindexed-event-address
Impact: Informational
Confidence: High
 - [ ] ID-542
Event [stdStorageSafe.SlotFound(address,bytes4,bytes32,uint256)](contracts/lib/forge-std/src/StdStorage.sol#L25) has address parameters but no indexed parameters

contracts/lib/forge-std/src/StdStorage.sol#L25


 - [ ] ID-543
Event [Pausable.Unpaused(address)](node_modules/@openzeppelin/contracts/utils/Pausable.sol#L28) has address parameters but no indexed parameters

node_modules/@openzeppelin/contracts/utils/Pausable.sol#L28


 - [ ] ID-544
Event [stdStorageSafe.WARNING_UninitedSlot(address,uint256)](contracts/lib/forge-std/src/StdStorage.sol#L26) has address parameters but no indexed parameters

contracts/lib/forge-std/src/StdStorage.sol#L26


 - [ ] ID-545
Event [Pausable.Paused(address)](node_modules/@openzeppelin/contracts/utils/Pausable.sol#L23) has address parameters but no indexed parameters

node_modules/@openzeppelin/contracts/utils/Pausable.sol#L23


## unused-state
Impact: Informational
Confidence: High
 - [ ] ID-546
[CommonBase.DEFAULT_SENDER](contracts/lib/forge-std/src/Base.sol#L15) is never used in [Deploy](contracts/script/Deploy.s.sol#L11-L35)

contracts/lib/forge-std/src/Base.sol#L15


 - [ ] ID-547
[CommonBase.MULTICALL3_ADDRESS](contracts/lib/forge-std/src/Base.sol#L19) is never used in [Deploy](contracts/script/Deploy.s.sol#L11-L35)

contracts/lib/forge-std/src/Base.sol#L19


 - [ ] ID-548
[CommonBase.stdstore](contracts/lib/forge-std/src/Base.sol#L28) is never used in [Deploy](contracts/script/Deploy.s.sol#L11-L35)

contracts/lib/forge-std/src/Base.sol#L28


 - [ ] ID-549
[CommonBase.SECP256K1_ORDER](contracts/lib/forge-std/src/Base.sol#L21-L22) is never used in [Deploy](contracts/script/Deploy.s.sol#L11-L35)

contracts/lib/forge-std/src/Base.sol#L21-L22


 - [ ] ID-550
[CommonBase.UINT256_MAX](contracts/lib/forge-std/src/Base.sol#L24-L25) is never used in [Deploy](contracts/script/Deploy.s.sol#L11-L35)

contracts/lib/forge-std/src/Base.sol#L24-L25


 - [ ] ID-551
[ScriptBase.vmSafe](contracts/lib/forge-std/src/Base.sol#L34) is never used in [Deploy](contracts/script/Deploy.s.sol#L11-L35)

contracts/lib/forge-std/src/Base.sol#L34


 - [ ] ID-552
[CommonBase.DEFAULT_TEST_CONTRACT](contracts/lib/forge-std/src/Base.sol#L17) is never used in [Deploy](contracts/script/Deploy.s.sol#L11-L35)

contracts/lib/forge-std/src/Base.sol#L17


 - [ ] ID-553
[CommonBase.CONSOLE](contracts/lib/forge-std/src/Base.sol#L11) is never used in [Deploy](contracts/script/Deploy.s.sol#L11-L35)

contracts/lib/forge-std/src/Base.sol#L11


 - [ ] ID-554
[CommonBase.CREATE2_FACTORY](contracts/lib/forge-std/src/Base.sol#L13) is never used in [Deploy](contracts/script/Deploy.s.sol#L11-L35)

contracts/lib/forge-std/src/Base.sol#L13


## constable-states
Impact: Optimization
Confidence: High
 - [ ] ID-555
[Script.IS_SCRIPT](contracts/lib/forge-std/src/Script.sol#L26) should be constant 

contracts/lib/forge-std/src/Script.sol#L26


