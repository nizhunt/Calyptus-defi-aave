import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { developmentChains, networkConfig } from "../../helper-hardhat-config";
import {
    CalyptusDefiAAVE2,
    CalyptusDefiAAVE2Factory,
} from "../../typechain-types";
import ERC20 from "../helpers/TestERC20.json";
import { IProtocolDataProviderAAVE2 } from "../../typechain-types";

developmentChains.includes(network.name)
    ? describe.skip
    : describe("CalyptusDefiAAVE2 contract staging test", async () => {
          let calyptusDefiAAVE2Factory: CalyptusDefiAAVE2Factory;
          let deployer: SignerWithAddress;
          let calyptusDefiAAVE2: CalyptusDefiAAVE2;
          before(async () => {
              [deployer] = await ethers.getSigners();
              calyptusDefiAAVE2Factory = await ethers.getContract(
                  "CalyptusDefiAAVE2Factory",
                  deployer
              );
          });

          describe("simple scenario", async () => {
              const chainId = network.config.chainId || 31337;
              const daiContractAddress = networkConfig[chainId].daiContract;
              const daiContract = new ethers.Contract(
                  daiContractAddress,
                  ERC20.abi
              );
              let value: BigNumber;

              beforeEach(async () => {
                  const existingCloneAddress =
                      await calyptusDefiAAVE2Factory.userContracts(
                          deployer.address
                      );
                  calyptusDefiAAVE2 = await ethers.getContractAt(
                      "CalyptusDefiAAVE2",
                      existingCloneAddress
                  );
                  value = await calyptusDefiAAVE2.depositedBalance(
                      daiContractAddress
                  );
                  await daiContract
                      .connect(deployer)
                      .approve(
                          calyptusDefiAAVE2.address,
                          ethers.utils.parseEther("1"),
                          { from: deployer.address }
                      );
              });

              it("deposit if there is no deposited amount", async () => {
                  if (value.isZero()) {
                      const result = await calyptusDefiAAVE2
                          .connect(deployer)
                          .deposit(
                              daiContractAddress,
                              ethers.utils.parseEther("1")
                          );
                      await result.wait(1);
                      // expect 1 - 2% fees = 0,98
                      const depositeBalance =
                          await calyptusDefiAAVE2.depositedBalance(
                              daiContractAddress
                          );
                      expect(depositeBalance).to.equal(
                          ethers.utils.parseEther("0.98")
                      );
                  }
              });

              it("withdraw should transfer the smart contract total amount balance - the performance fees to the user", async () => {
                  const aave2ProviderContractAddress =
                      networkConfig[chainId].aave2DataProvider;

                  const dataProvider: IProtocolDataProviderAAVE2 =
                      await ethers.getContractAt(
                          "IProtocolDataProviderAAVE2",
                          aave2ProviderContractAddress
                      );
                  const data = await dataProvider.getUserReserveData(
                      daiContractAddress,
                      calyptusDefiAAVE2.address
                  );
                  const maxQty = ethers.BigNumber.from(data[0]);

                  const beforeBalance = await daiContract
                      .connect(deployer)
                      .balanceOf(deployer.address);

                  const result = await calyptusDefiAAVE2
                      .connect(deployer)
                      .withdraw(daiContractAddress, maxQty);
                  await result.wait(1);
                  expect(
                      await daiContract
                          .connect(deployer)
                          .balanceOf(deployer.address)
                  ).to.be.greaterThan(beforeBalance);
                  expect(
                      await calyptusDefiAAVE2.depositedBalance(
                          daiContractAddress
                      )
                  ).to.equal(ethers.utils.parseEther("0"));
              });
          });
      });
