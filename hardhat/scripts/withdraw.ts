import { ethers, getNamedAccounts, network } from "hardhat";
import {
    CalyptusDefiAAVE2,
    CalyptusDefiAAVE2Factory,
} from "../typechain-types";
import { networkConfig, developmentChains } from "../helper-hardhat-config";

const main = async () => {
    const { deployer } = await getNamedAccounts();
    console.log(`deployer: ${deployer}`);
    const calyptusDefiAAVE2Factory: CalyptusDefiAAVE2Factory =
        await ethers.getContract("CalyptusDefiAAVE2Factory", deployer);

    console.log("Getting user clone...");
    const cloneAddress = await calyptusDefiAAVE2Factory.userContracts(deployer);
    console.log(`Found clone: ${cloneAddress}`);

    const calyptusDefiAAVE2: CalyptusDefiAAVE2 = await ethers.getContractAt(
        "CalyptusDefiAAVE2",
        cloneAddress
    );

    let daiContractAddress;
    if (developmentChains.includes(network.name)) {
        const daiContract = await ethers.getContract("MockERC20", deployer);
        daiContractAddress = daiContract.address;
    } else {
        const chainId = network.config.chainId || 31337;
        daiContractAddress = networkConfig[chainId].daiContract;
    }

    console.log(`withdraw... from ${deployer}`);
    const result = await calyptusDefiAAVE2.withdraw(
        daiContractAddress,
        ethers.utils.parseEther("0.5"),
        { from: deployer }
    );
    await result.wait(1);
    console.log("finished withdraw!");
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
