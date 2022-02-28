import { expect } from "chai";
import { ethers } from "hardhat";

describe("Lupi", function () {
  it("Should return return game version after deployment", async function () {
    const Lupi = await ethers.getContractFactory("Lupi");
    const lupi = await Lupi.deploy("1");
    await lupi.deployed();

    expect(await lupi.getGameVersion()).to.equal("1");
  });
});
