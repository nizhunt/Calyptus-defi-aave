// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./ILendingPoolAAVE2.sol";
import "./CalyptusDefiAAVE2.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

/**
 * @title CalyptusDefiAAVE2Factory
 * @dev This smart contract creates and keep track of the CalyptusDefiAAVE2 smart contract using
 * the clone pattern in order to save gas.
 */
contract CalyptusDefiAAVE2Factory {
    address immutable calyptusDefiAAVE2TemplateAddress;
    address immutable aaveLendingPoolAddress;
    address immutable aaveProtocolDataProviderAddress;
    address immutable priceFeedAddress;
    address immutable feesManagerAddress;

    // mapping to keep track of the user smart contracts: user's adress => CalyptusDefiAAVE2 smart contract.
    mapping(address => address) public userContracts;

    event CloneCreated(address indexed _owner, address _clone);

    constructor(
        address _aaveLendingPoolAddress,
        address _aaveProtocolDataProviderAddress,
        address _priceFeedAddress,
        address _feesManagerAddress
    ) {
        calyptusDefiAAVE2TemplateAddress = address(new CalyptusDefiAAVE2());
        aaveLendingPoolAddress = _aaveLendingPoolAddress;
        aaveProtocolDataProviderAddress = _aaveProtocolDataProviderAddress;
        priceFeedAddress = _priceFeedAddress;
        feesManagerAddress = _feesManagerAddress;
    }

    // Create a clone of CalyptusDefiAAVE2 contract
    function createClone() external {
        address clone = Clones.clone(calyptusDefiAAVE2TemplateAddress);
        CalyptusDefiAAVE2(clone).initialize(
            aaveLendingPoolAddress,
            aaveProtocolDataProviderAddress,
            priceFeedAddress,
            feesManagerAddress,
            msg.sender
        );
        userContracts[msg.sender] = clone;
        emit CloneCreated(msg.sender, clone);
    }
}
