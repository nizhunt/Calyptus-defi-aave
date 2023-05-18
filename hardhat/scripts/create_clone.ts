import { ethers, getNamedAccounts } from "hardhat";
import { CalyptusDefiAAVE2Factory } from "../typechain-types";

const main = async () => {
    const { deployer } = await getNamedAccounts();
    console.log(`deployer: ${deployer}`);
    const calyptusDefiAAVE2Factory: CalyptusDefiAAVE2Factory =
        await ethers.getContract("CalyptusDefiAAVE2Factory", deployer);
    console.log("Creating clone...");
    const response = await calyptusDefiAAVE2Factory.createClone();
    await response.wait(1);
    console.log("Clone created");
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
