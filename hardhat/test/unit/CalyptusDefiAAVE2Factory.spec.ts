import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, deployments, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { CalyptusDefiAAVE2 } from "../../typechain-types";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("CalyptusDefiAAVE2Factory test", async () => {
          // We define a fixture to reuse the same setup in every test.
          // We use loadFixture to run this setup once, snapshot that state,
          // and reset Hardhat Network to that snapshot in every test.
          const deployCalyptusDefiAAVE2FactoryFixture = async () => {
              // Contracts are deployed using the first signer/account by default
              const [owner, otherAccount1, otherAccount2] =
                  await ethers.getSigners();

              await deployments.fixture(["all"]);

              const calyptusDefiAAVE2Factory = await ethers.getContract(
                  "CalyptusDefiAAVE2Factory"
              );

              return {
                  calyptusDefiAAVE2Factory,
                  owner,
                  otherAccount1,
                  otherAccount2,
              };
          };

          it("should deploy with no errors", async function () {
              const { calyptusDefiAAVE2Factory } = await loadFixture(
                  deployCalyptusDefiAAVE2FactoryFixture
              );
              expect(calyptusDefiAAVE2Factory.address).is.not.null;
          });

          describe("create CalyptusDefiAAVE2 clones", async () => {
              it("should create new CalyptusDefiAAVE2 smart contracts", async () => {
                  const {
                      calyptusDefiAAVE2Factory,
                      owner,
                      otherAccount1,
                      otherAccount2,
                  } = await loadFixture(deployCalyptusDefiAAVE2FactoryFixture);
                  await calyptusDefiAAVE2Factory.connect(owner).createClone();

                  await calyptusDefiAAVE2Factory
                      .connect(otherAccount1)
                      .createClone();
                  await calyptusDefiAAVE2Factory
                      .connect(otherAccount2)
                      .createClone();

                  const ownerCloneAddress =
                      await calyptusDefiAAVE2Factory.userContracts(
                          owner.address
                      );
                  const accountCloneAddress =
                      await calyptusDefiAAVE2Factory.userContracts(
                          otherAccount1.address
                      );
                  const account2CloneAddress =
                      await calyptusDefiAAVE2Factory.userContracts(
                          otherAccount2.address
                      );

                  const ownerSc = await ethers.getContractAt(
                      "CalyptusDefiAAVE2",
                      ownerCloneAddress
                  );
                  const account1Sc = await ethers.getContractAt(
                      "CalyptusDefiAAVE2",
                      accountCloneAddress
                  );
                  const account2Sc = await ethers.getContractAt(
                      "CalyptusDefiAAVE2",
                      account2CloneAddress
                  );

                  expect(ownerSc).not.to.be.null;
                  expect(account1Sc).not.to.be.null;
                  expect(account2Sc).not.to.be.null;
              });

              it("should emit a CloneCreated event", async () => {
                  const {
                      calyptusDefiAAVE2Factory,
                      owner,
                      otherAccount1,
                      otherAccount2,
                  } = await loadFixture(deployCalyptusDefiAAVE2FactoryFixture);
                  let receiptOwner: CalyptusDefiAAVE2 =
                      await calyptusDefiAAVE2Factory
                          .connect(owner)
                          .createClone();
                  let receiptAccount1: CalyptusDefiAAVE2 =
                      await calyptusDefiAAVE2Factory
                          .connect(otherAccount1)
                          .createClone();
                  let receiptAccount2: CalyptusDefiAAVE2 =
                      await calyptusDefiAAVE2Factory
                          .connect(otherAccount2)
                          .createClone();

                  const ownerCloneAddress =
                      await calyptusDefiAAVE2Factory.userContracts(
                          owner.address
                      );
                  const accountCloneAddress =
                      await calyptusDefiAAVE2Factory.userContracts(
                          otherAccount1.address
                      );
                  const account2CloneAddress =
                      await calyptusDefiAAVE2Factory.userContracts(
                          otherAccount2.address
                      );

                  expect(receiptOwner)
                      .to.emit(calyptusDefiAAVE2Factory, "CloneCreated")
                      .withArgs(owner.address, ownerCloneAddress);
                  expect(receiptAccount1)
                      .to.emit(calyptusDefiAAVE2Factory, "CloneCreated")
                      .withArgs(otherAccount1.address, accountCloneAddress);
                  expect(receiptAccount2)
                      .to.emit(calyptusDefiAAVE2Factory, "CloneCreated")
                      .withArgs(otherAccount2.address, account2CloneAddress);
              });
          });
      });
