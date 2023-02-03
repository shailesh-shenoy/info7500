import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BasicDutchAuction } from "../typechain-types/BasicDutchAuction";

describe("BasicDutchAuction", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  const NUM_BLOCKS_AUCTION_OPEN = 10;
  const RESERVE_PRICE = 500;
  const OFFER_PRICE_DECREMENT = 50;

  async function deployBasicDAFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, account1, account2] = await ethers.getSigners();

    const BasicDutchAuction = await ethers.getContractFactory(
      "BasicDutchAuction"
    );

    const basicDutchAuction = await BasicDutchAuction.deploy(
      RESERVE_PRICE,
      NUM_BLOCKS_AUCTION_OPEN,
      OFFER_PRICE_DECREMENT
    );

    return { basicDutchAuction, owner, account1, account2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { basicDutchAuction, owner, account1 } = await loadFixture(
        deployBasicDAFixture
      );

      expect(await basicDutchAuction.owner()).to.equal(owner.address);
    });
    it("Should have no winner", async function () {
      const { basicDutchAuction, owner, account1 } = await loadFixture(
        deployBasicDAFixture
      );

      expect(await basicDutchAuction.winner()).to.equal(
        ethers.constants.AddressZero
      );
    });
  });

  describe("Bids", function () {
    it("Should have current price as per formula", async function () {
      const { basicDutchAuction, account1 } = await loadFixture(
        deployBasicDAFixture
      );

      const initialPrice =
        RESERVE_PRICE + NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT;

      expect(await basicDutchAuction.getCurrentPrice()).to.equal(initialPrice);
    });

    it("Should reject low bids", async function () {
      const { basicDutchAuction, account1 } = await loadFixture(
        deployBasicDAFixture
      );

      //This is the Bid price which would be accepted two blocks later
      const lowBidPrice =
        RESERVE_PRICE +
        NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT -
        OFFER_PRICE_DECREMENT * 2;

      await expect(
        basicDutchAuction.connect(account1).bid({
          value: lowBidPrice,
        })
      ).to.be.revertedWith("The wei value sent is not acceptable");
    });
  });
});
