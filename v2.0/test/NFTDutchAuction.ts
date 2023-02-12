import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("NFTDutchAuction", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  const NUM_BLOCKS_AUCTION_OPEN = 10;
  const RESERVE_PRICE = 500;
  const OFFER_PRICE_DECREMENT = 50;
  const NFT_TOKEN_ID = 0;
  const TOKEN_URI = "https://www.youtube.com/watch?v=pXRviuL6vMY";

  async function deployNFTDAFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, account1, account2] = await ethers.getSigners();

    //Deploy and mint NFT contract
    const RandomMusicNFT = await ethers.getContractFactory("RandomMusicNFT");
    const randomMusicNFT = await RandomMusicNFT.deploy();
    await randomMusicNFT.mintNFT(owner.address, TOKEN_URI);

    const NFTDutchAuction = await ethers.getContractFactory("NFTDutchAuction");

    const nftDutchAuction = await NFTDutchAuction.deploy(
      randomMusicNFT.address,
      NFT_TOKEN_ID,
      RESERVE_PRICE,
      NUM_BLOCKS_AUCTION_OPEN,
      OFFER_PRICE_DECREMENT
    );

    randomMusicNFT.approve(nftDutchAuction.address, NFT_TOKEN_ID);

    return { randomMusicNFT, nftDutchAuction, owner, account1, account2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { nftDutchAuction, owner } = await loadFixture(deployNFTDAFixture);

      expect(await nftDutchAuction.owner()).to.equal(owner.address);
    });

    it("Should have no winner", async function () {
      const { nftDutchAuction } = await loadFixture(deployNFTDAFixture);

      expect(await nftDutchAuction.winner()).to.equal(
        ethers.constants.AddressZero
      );
    });

    it("Should have initial price as per formula", async function () {
      const { nftDutchAuction } = await loadFixture(deployNFTDAFixture);

      const initialPrice =
        RESERVE_PRICE + NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT;

      expect(await nftDutchAuction.initialPrice()).to.equal(initialPrice);
    });
  });

  describe("Bids", function () {
    it("Should have expected current price after 5 blocks as per formula", async function () {
      const { nftDutchAuction } = await loadFixture(deployNFTDAFixture);

      const initialPrice =
        RESERVE_PRICE + NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT;

      const priceAfter5Blocks = initialPrice - 5 * OFFER_PRICE_DECREMENT;
      //Mine 5 blocks, since 1 block was already mined
      //when we approved the Auction contract for NFT Transfer
      await mine(4);

      expect(await nftDutchAuction.getCurrentPrice()).to.equal(
        priceAfter5Blocks
      );
    });

    it("Should reject low bids", async function () {
      const { nftDutchAuction, account1 } = await loadFixture(
        deployNFTDAFixture
      );

      //Mine 1 block, 1 already mined
      //when we approved the Auction contract for NFT Transfer
      await mine(1);

      //This is the Bid price which would be accepted three blocks later
      //But should be rejected now
      const lowBidPrice =
        RESERVE_PRICE +
        NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT -
        OFFER_PRICE_DECREMENT * 5;

      await expect(
        nftDutchAuction.connect(account1).bid({
          value: lowBidPrice,
        })
      ).to.be.revertedWith("The wei value sent is not acceptable");

      //Test with an arbitrarily low value too
      await expect(
        nftDutchAuction.connect(account1).bid({
          value: 50,
        })
      ).to.be.revertedWith("The wei value sent is not acceptable");
    });

    it("Should accept bids higher than currentPrice and set winner as bidder's address", async function () {
      const { nftDutchAuction, account1 } = await loadFixture(
        deployNFTDAFixture
      );
      //mine 5 blocks
      await mine(5);

      const initialPrice =
        RESERVE_PRICE + NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT;
      //Get price after 4 blocks
      const highBidPrice = initialPrice - OFFER_PRICE_DECREMENT * 4;

      //Bid function should succeed
      expect(
        await nftDutchAuction.connect(account1).bid({
          value: highBidPrice,
        })
      ).to.not.be.reverted;

      //Winner should be account1
      expect(await nftDutchAuction.winner()).to.equal(account1.address);
    });

    it("Should reject bids after a winning bid is already accepted", async function () {
      const { nftDutchAuction, account1, account2 } = await loadFixture(
        deployNFTDAFixture
      );
      //mine 5 blocks
      await mine(5);

      const initialPrice =
        RESERVE_PRICE + NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT;
      //Get price after 4 blocks
      const highBidPrice = initialPrice - OFFER_PRICE_DECREMENT * 4;

      //Bid function should succeed
      expect(
        await nftDutchAuction.connect(account1).bid({
          value: highBidPrice,
        })
      ).to.not.be.reverted;

      //Bid should be rejected
      await expect(
        nftDutchAuction.connect(account2).bid({
          value: highBidPrice,
        })
      ).to.be.revertedWith("Auction has already concluded");
    });

    it("Bids should not be accepted after the auction expires", async function () {
      const { nftDutchAuction, account1, account2 } = await loadFixture(
        deployNFTDAFixture
      );
      //mine 5 blocks
      await mine(NUM_BLOCKS_AUCTION_OPEN + 1);

      const initialPrice =
        RESERVE_PRICE + NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT;
      //Get price after 4 blocks
      const highBidPrice = initialPrice - OFFER_PRICE_DECREMENT * 4;

      //Bid function should fail with auction expired message
      await expect(
        nftDutchAuction.connect(account2).bid({
          value: highBidPrice,
        })
      ).to.be.revertedWith("Auction expired");
    });

    it("Should return reservePrice when max number of auction blocks have elapsed", async function () {
      const { nftDutchAuction } = await loadFixture(deployNFTDAFixture);
      //mine 10 blocks
      await mine(NUM_BLOCKS_AUCTION_OPEN);
      //Should return reserve price after 10 blocks are mined
      expect(await nftDutchAuction.getCurrentPrice()).to.equal(RESERVE_PRICE);

      //Mine 5 more blocks
      await mine(5);
      //Should return reserve price after 15 blocks are mined
      expect(await nftDutchAuction.getCurrentPrice()).to.equal(RESERVE_PRICE);
    });

    it("Should send the accepted bid wei value from bidder's account to owner's account", async function () {
      const { nftDutchAuction, owner, account1 } = await loadFixture(
        deployNFTDAFixture
      );
      //mine 5 blocks
      await mine(5);

      const initialPrice =
        RESERVE_PRICE + NUM_BLOCKS_AUCTION_OPEN * OFFER_PRICE_DECREMENT;
      //Get price after 4 blocks
      const highBidPrice = initialPrice - OFFER_PRICE_DECREMENT * 4;

      //Bid function should succeed and teansfer wei value from account1 to owner
      await expect(
        nftDutchAuction.connect(account1).bid({
          value: highBidPrice,
        })
      ).to.changeEtherBalances(
        [account1, owner],
        [-highBidPrice, highBidPrice]
      );
    });
  });
});