import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import {
    MockContract,
    deployMockContract,
} from "@ethereum-waffle/mock-contract";
import { ethers, deployments, network } from "hardhat";
import { FeesCollector, CalyptusDefiAAVE2 } from "../../typechain-types";

import ILendingPoolAAVE2Json from "../../artifacts/contracts/ILendingPoolAAVE2.sol/ILendingPoolAAVE2.json";
import IProtocolDataProviderAAVE2Json from "../../artifacts/contracts/IProtocolDataProviderAAVE2.sol/IProtocolDataProviderAAVE2.json";
import PriceFeedConsumerJson from "../../artifacts/contracts/PriceFeedConsumer.sol/PriceFeedConsumer.json";
import ERC20 from "../helpers/TestERC20.json";
import { Contract, ContractFactory, utils } from "ethers";
import { developmentChains } from "../../helper-hardhat-config";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("CalyptusDefiAAVE2 contract test", async () => {
          const deployCalyptusDefiAAVE2Fixture = async () => {
              const [owner, account1] = await ethers.getSigners();
              await deployments.fixture(["all"]);
              const feesCollectorcalyptusDefiAAVE2: FeesCollector =
                  await ethers.getContract("FeesCollector");

              await deployments.deploy("CalyptusDefiAAVE2", {
                  from: owner.address,
              });
              const calyptusDefiAAVE2: CalyptusDefiAAVE2 =
                  await ethers.getContract("CalyptusDefiAAVE2");

              const aaveLendingPool = await deployMockContract(
                  owner,
                  ILendingPoolAAVE2Json.abi
              );
              await aaveLendingPool.mock.withdraw.returns(1);
              await aaveLendingPool.mock.deposit.returns();

              const aaveProtocolDataProvider = await deployMockContract(
                  owner,
                  IProtocolDataProviderAAVE2Json.abi
              );

              const priceFeedConsumer = await deployMockContract(
                  owner,
                  PriceFeedConsumerJson.abi
              );
              await priceFeedConsumer.mock.getLatestPrice.returns(
                  utils.parseEther("100")
              );

              return {
                  calyptusDefiAAVE2,
                  owner,
                  account1,
                  feesCollectorcalyptusDefiAAVE2,
                  aaveLendingPool,
                  aaveProtocolDataProvider,
                  priceFeedConsumer,
              };
          };

          describe("initialize", async () => {
              let calyptusDefiAAVE2: CalyptusDefiAAVE2;
              let aaveLendingPool: MockContract;
              let aaveProtocolDataProvider: MockContract;
              let priceFeedConsumer: MockContract;
              let feesCollectorcalyptusDefiAAVE2: FeesCollector;
              let owner: SignerWithAddress;
              let account1: SignerWithAddress;

              beforeEach(async () => {
                  ({
                      calyptusDefiAAVE2,
                      aaveLendingPool,
                      aaveProtocolDataProvider,
                      priceFeedConsumer,
                      feesCollectorcalyptusDefiAAVE2,
                      owner,
                      account1,
                  } = await loadFixture(deployCalyptusDefiAAVE2Fixture));

                  await calyptusDefiAAVE2.initialize(
                      aaveLendingPool.address,
                      aaveProtocolDataProvider.address,
                      priceFeedConsumer.address,
                      feesCollectorcalyptusDefiAAVE2.address,
                      owner.address
                  );
              });

              it("should set the owner correctly", async () => {
                  const calyptusDefiAAVE2Owner =
                      await calyptusDefiAAVE2.owner();
                  expect(calyptusDefiAAVE2Owner).to.equal(owner.address);
              });

              context("initialize a second time", async () => {
                  it("should revert", async () => {
                      await expect(
                          calyptusDefiAAVE2.initialize(
                              aaveLendingPool.address,
                              aaveProtocolDataProvider.address,
                              priceFeedConsumer.address,
                              feesCollectorcalyptusDefiAAVE2.address,
                              account1.address
                          )
                      ).to.be.revertedWith(
                          "Initializable: contract is already initialized"
                      );
                  });
              });
          });

          describe("deposit", async () => {
              let calyptusDefiAAVE2: CalyptusDefiAAVE2;
              let aaveLendingPool: MockContract;
              let aaveProtocolDataProvider: MockContract;
              let priceFeedConsumer: MockContract;
              let feesCollectorcalyptusDefiAAVE2: FeesCollector;
              let owner: SignerWithAddress;
              let account1: SignerWithAddress;

              let erc20: Contract;
              beforeEach(async () => {
                  ({
                      calyptusDefiAAVE2,
                      aaveLendingPool,
                      aaveProtocolDataProvider,
                      priceFeedConsumer,
                      feesCollectorcalyptusDefiAAVE2,
                      owner,
                      account1,
                  } = await loadFixture(deployCalyptusDefiAAVE2Fixture));

                  await calyptusDefiAAVE2.initialize(
                      aaveLendingPool.address,
                      aaveProtocolDataProvider.address,
                      priceFeedConsumer.address,
                      feesCollectorcalyptusDefiAAVE2.address,
                      owner.address
                  );
                  const contractFactory = new ContractFactory(
                      ERC20.abi,
                      ERC20.bytecode,
                      owner
                  );
                  erc20 = await contractFactory.deploy(
                      utils.parseEther("100000")
                  );
              });

              it("should revert if not called by the owner", async () => {
                  await expect(
                      calyptusDefiAAVE2
                          .connect(account1)
                          .deposit(erc20.address, utils.parseEther("100000"))
                  ).to.be.revertedWith("Ownable: caller is not the owner");
              });

              it("should revert if the amount asked is 0", async () => {
                  await expect(
                      calyptusDefiAAVE2.deposit(
                          erc20.address,
                          utils.parseEther("0")
                      )
                  ).to.be.revertedWith("amount must be > 0!");
              });

              it("should revert if the smart contract has no allowance to spend the user's erc20", async () => {
                  expect(await erc20.balanceOf(owner.address)).to.equal(
                      utils.parseEther("100000")
                  );

                  await expect(
                      calyptusDefiAAVE2.deposit(
                          erc20.address,
                          utils.parseEther("100000")
                      )
                  ).to.be.revertedWith("ERC20: insufficient allowance");
              });

              context("when the smart contract has allowance", async () => {
                  beforeEach(async () => {
                      expect(await erc20.balanceOf(owner.address)).to.equal(
                          utils.parseEther("100000")
                      );
                      await erc20.approve(
                          calyptusDefiAAVE2.address,
                          utils.parseEther("50"),
                          { from: owner.address }
                      );
                  });

                  it("should revert if the amount is greater than the allowance", async () => {
                      await expect(
                          calyptusDefiAAVE2.deposit(
                              erc20.address,
                              utils.parseEther("100000"),
                              { from: owner.address }
                          )
                      ).to.be.revertedWith("ERC20: insufficient allowance");
                  });

                  it("should transfer (erc20 - the fees) from the user to the smart contract", async () => {
                      const initialSmartContractBalance = await erc20.balanceOf(
                          calyptusDefiAAVE2.address
                      );
                      expect(initialSmartContractBalance).to.equal(
                          utils.parseEther("0")
                      );

                      await calyptusDefiAAVE2.deposit(
                          erc20.address,
                          utils.parseEther("50"),
                          { from: owner.address }
                      );

                      // expect 50 - 2% fees = 49
                      const smartContractBalance = await erc20.balanceOf(
                          calyptusDefiAAVE2.address
                      );
                      expect(smartContractBalance).to.equal(
                          utils.parseEther("49")
                      );

                      const erc20Balance =
                          await calyptusDefiAAVE2.depositedBalance(
                              erc20.address,
                              {
                                  from: owner.address,
                              }
                          );
                      expect(erc20Balance).to.equal(utils.parseEther("49"));

                      const erc20AvgCost = await calyptusDefiAAVE2.assetAvgCost(
                          erc20.address,
                          { from: owner.address }
                      );
                      expect(erc20AvgCost).to.equal(utils.parseEther("100"));
                  });

                  it("should emit a Deposit event", async () => {
                      expect(
                          await calyptusDefiAAVE2.deposit(
                              erc20.address,
                              utils.parseEther("50"),
                              { from: owner.address }
                          )
                      )
                          .to.emit(calyptusDefiAAVE2, "Deposit")
                          .withArgs(erc20.address, utils.parseEther("49"));
                  });

                  it("should transfer the referal fees to the collector", async () => {
                      await calyptusDefiAAVE2.deposit(
                          erc20.address,
                          utils.parseEther("50"),
                          { from: owner.address }
                      );

                      expect(
                          await erc20.balanceOf(
                              feesCollectorcalyptusDefiAAVE2.address
                          )
                      ).to.equal(utils.parseEther("1"));
                  });
              });
          });

          describe("withdraw", async () => {
              let calyptusDefiAAVE2: CalyptusDefiAAVE2;
              let aaveLendingPool: MockContract;
              let aaveProtocolDataProvider: MockContract;
              let priceFeedConsumer: MockContract;
              let feesCollectorcalyptusDefiAAVE2: FeesCollector;
              let owner: SignerWithAddress;
              let account1: SignerWithAddress;
              let erc20: Contract;

              beforeEach(async () => {
                  const result = ({
                      calyptusDefiAAVE2: calyptusDefiAAVE2,
                      aaveLendingPool: aaveLendingPool,
                      aaveProtocolDataProvider: aaveProtocolDataProvider,
                      priceFeedConsumer: priceFeedConsumer,
                      feesCollectorcalyptusDefiAAVE2:
                          feesCollectorcalyptusDefiAAVE2,
                      owner: owner,
                      account1: account1,
                  } = await loadFixture(deployCalyptusDefiAAVE2Fixture));

                  await calyptusDefiAAVE2.initialize(
                      aaveLendingPool.address,
                      aaveProtocolDataProvider.address,
                      priceFeedConsumer.address,
                      feesCollectorcalyptusDefiAAVE2.address,
                      owner.address
                  );
                  const contractFactory = new ContractFactory(
                      ERC20.abi,
                      ERC20.bytecode,
                      owner
                  );
                  erc20 = await contractFactory.deploy(
                      utils.parseEther("100000")
                  );

                  // the user deposits 50 tokens into the smart contract
                  await erc20.approve(
                      calyptusDefiAAVE2.address,
                      utils.parseEther("50"),
                      { from: owner.address }
                  );
                  await calyptusDefiAAVE2.deposit(
                      erc20.address,
                      utils.parseEther("50"),
                      { from: owner.address }
                  );
                  await aaveProtocolDataProvider.mock.getUserReserveData.returns(
                      utils.parseEther("49"),
                      0,
                      0,
                      0,
                      0,
                      0,
                      0,
                      0,
                      false
                  );
                  expect(await erc20.balanceOf(owner.address)).to.equal(
                      utils.parseEther("99950")
                  );
                  expect(
                      await erc20.balanceOf(calyptusDefiAAVE2.address)
                  ).to.equal(utils.parseEther("49"));
                  expect(
                      await calyptusDefiAAVE2.depositedBalance(erc20.address)
                  ).to.equal(utils.parseEther("49"));
                  expect(
                      await calyptusDefiAAVE2.assetAvgCost(erc20.address)
                  ).to.equal(utils.parseEther("100"));
              });

              it("should revert if the user is not the owner", async () => {
                  await expect(
                      calyptusDefiAAVE2
                          .connect(account1)
                          .withdraw(erc20.address, utils.parseEther("100000"))
                  ).to.be.revertedWith("Ownable: caller is not the owner");
              });

              it("should revert if amount asked is 0", async () => {
                  await expect(
                      calyptusDefiAAVE2.withdraw(
                          erc20.address,
                          utils.parseEther("0")
                      )
                  ).to.be.revertedWith("_amount must be > 0!");
              });

              it("should revert if amount asked > smart contract balance", async () => {
                  await expect(
                      calyptusDefiAAVE2.withdraw(
                          erc20.address,
                          utils.parseEther("60")
                      )
                  ).to.be.revertedWith("Insufficiant balance");
              });

              it("should transfer the smart contract amount balance to the user", async () => {
                  await calyptusDefiAAVE2.withdraw(
                      erc20.address,
                      utils.parseEther("49")
                  );

                  expect(await erc20.balanceOf(owner.address)).to.equal(
                      utils.parseEther("99999")
                  );
                  expect(
                      await erc20.balanceOf(calyptusDefiAAVE2.address)
                  ).to.equal(utils.parseEther("0"));
                  expect(
                      await calyptusDefiAAVE2.depositedBalance(erc20.address)
                  ).to.equal(utils.parseEther("0"));
              });

              it("should emit a Withdraw event", async () => {
                  expect(
                      await calyptusDefiAAVE2.withdraw(
                          erc20.address,
                          utils.parseEther("49")
                      )
                  )
                      .to.emit(calyptusDefiAAVE2, "Withdraw")
                      .withArgs(erc20.address, utils.parseEther("49"));
              });

              context(
                  "When the user makes a profit in $, but with no rewards",
                  async () => {
                      beforeEach(async () => {
                          await priceFeedConsumer.mock.getLatestPrice.returns(
                              utils.parseEther("110")
                          );
                      });

                      it("should transfer the smart contract amount balance - the performance fees to the user", async () => {
                          await calyptusDefiAAVE2.withdraw(
                              erc20.address,
                              utils.parseEther("49")
                          );

                          expect(await erc20.balanceOf(owner.address)).to.equal(
                              utils.parseEther("99998.554545454545454546")
                          );
                          expect(
                              await erc20.balanceOf(calyptusDefiAAVE2.address)
                          ).to.equal(utils.parseEther("0"));
                          expect(
                              await calyptusDefiAAVE2.depositedBalance(
                                  erc20.address
                              )
                          ).to.equal(utils.parseEther("0"));
                      });

                      it("should transfer the performance fees to the collector", async () => {
                          await calyptusDefiAAVE2.withdraw(
                              erc20.address,
                              utils.parseEther("49")
                          );

                          expect(
                              await erc20.balanceOf(
                                  feesCollectorcalyptusDefiAAVE2.address
                              )
                          ).to.equal(utils.parseEther("1.445454545454545454"));
                      });
                  }
              );

              context(
                  "When the user makes a profit in $, with rewards",
                  async () => {
                      beforeEach(async () => {
                          await priceFeedConsumer.mock.getLatestPrice.returns(
                              utils.parseEther("110")
                          ); // profit regarding the price of the erc20
                          await aaveProtocolDataProvider.mock.getUserReserveData.returns(
                              utils.parseEther("60"),
                              0,
                              0,
                              0,
                              0,
                              0,
                              0,
                              0,
                              false
                          ); // profit in qty because of the rewards

                          // Put rewards on the contract
                          await erc20.transfer(
                              calyptusDefiAAVE2.address,
                              utils.parseEther("11"),
                              { from: owner.address }
                          );

                          expect(
                              await erc20.balanceOf(
                                  feesCollectorcalyptusDefiAAVE2.address
                              )
                          ).to.equal(utils.parseEther("1"));
                      });

                      it("should transfer the smart contract total amount balance - the performance fees to the user", async () => {
                          await calyptusDefiAAVE2.withdraw(
                              erc20.address,
                              utils.parseEther("60")
                          );

                          expect(await erc20.balanceOf(owner.address)).to.equal(
                              utils.parseEther("99997.454545454545454546")
                          );
                          expect(
                              await erc20.balanceOf(calyptusDefiAAVE2.address)
                          ).to.equal(utils.parseEther("0"));
                          expect(
                              await calyptusDefiAAVE2.depositedBalance(
                                  erc20.address
                              )
                          ).to.equal(utils.parseEther("0"));
                      });

                      it("should transfer the performance fees to the collector", async () => {
                          await calyptusDefiAAVE2.withdraw(
                              erc20.address,
                              utils.parseEther("60")
                          );

                          expect(
                              await erc20.balanceOf(
                                  feesCollectorcalyptusDefiAAVE2.address
                              )
                          ).to.equal(utils.parseEther("2.545454545454545454"));
                      });
                  }
              );
          });
      });
