import { expect } from "chai";
import { BigNumber, utils } from "ethers";
import { ethers } from "hardhat";
import { describe } from "mocha";

console.log(`index.ts`);
function getSalt(salt: string) {
  return utils.solidityKeccak256(["string"], [salt]);
}
const salt = getSalt("42");

function getGuessHash(currentNonce: string, guess: number, salt: string) {
  return utils.solidityKeccak256(
    ["bytes32", "uint32", "bytes32"],
    [currentNonce, guess, salt]
  );
}

const nullAddress = "0x0000000000000000000000000000000000000000";

describe("Lupi", async function () {
  it("Should return return game version after deployment", async function () {
    const Lupi = await ethers.getContractFactory("Lupi");
    const lupi = await Lupi.deploy("1");
    await lupi.deployed();

    expect(await lupi.getGameVersion()).to.equal("1");
  });

  it("Should commit 5 guesses", async function () {
    const Lupi = await ethers.getContractFactory("Lupi");
    const lupi = await Lupi.deploy("1");
    await lupi.deployed();

    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const lupiAddr1 = lupi.connect(addr1);

    const currentNonce = await lupiAddr1.getCurrentNonce();

    for (let i = 1; i < 5; i++) {
      const guessHash = getGuessHash(currentNonce, i, salt);

      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      await lupiAddr1.commitGuess(guessHash, overrides);
    }
  });

  it("Should revert after guessDeadline passes", async function () {
    const Lupi = await ethers.getContractFactory("Lupi");
    const lupi = await Lupi.deploy("1");
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const lupiAddr1 = lupi.connect(addr1);

    const currentNonce = await lupiAddr1.getCurrentNonce();

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const now =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      4 * 24 * 60 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [now]);
    await ethers.provider.send("evm_mine", []);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await expect(
      lupiAddr1.commitGuess(guessHash, overrides)
    ).to.be.revertedWith("Guess deadline has passed");
  });

  it("Should revert if no guess made", async function () {
    const Lupi = await ethers.getContractFactory("Lupi");
    const lupi = await Lupi.deploy("1");
    await lupi.deployed();

    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const lupiAddr1 = lupi.connect(addr1);

    const currentNonce = await lupiAddr1.getCurrentNonce();

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const now =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      4 * 24 * 60 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [now]);
    await ethers.provider.send("evm_mine", []);

    await expect(lupiAddr1.revealGuess(guessHash, 1, salt)).to.be.revertedWith(
      "No guesses to reveal"
    );
  });

  it("Should revert if no matching guessHash found", async function () {
    const Lupi = await ethers.getContractFactory("Lupi");
    const lupi = await Lupi.deploy("1");
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const lupiAddr1 = lupi.connect(addr1);

    const currentNonce = await lupiAddr1.getCurrentNonce();

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await lupiAddr1.commitGuess(guessHash, overrides);

    const now =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      4 * 24 * 60 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [now]);
    await ethers.provider.send("evm_mine", []);

    const unguessedHash = getGuessHash(currentNonce, 2, salt);

    await expect(
      lupiAddr1.revealGuess(unguessedHash, 2, salt)
    ).to.be.revertedWith("revealGuess no matching guessHash found");
  });

  it("Should revert if reveal too early", async function () {
    const Lupi = await ethers.getContractFactory("Lupi");
    const lupi = await Lupi.deploy("1");
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const lupiAddr1 = lupi.connect(addr1);

    const currentNonce = await lupiAddr1.getCurrentNonce();

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await lupiAddr1.commitGuess(guessHash, overrides);

    await expect(lupiAddr1.revealGuess(guessHash, 1, salt)).to.be.revertedWith(
      "revealGuess guessDeadline hasn't passed"
    );
  });

  it("Should revert if reveal too late", async function () {
    const Lupi = await ethers.getContractFactory("Lupi");
    const lupi = await Lupi.deploy("1");
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const lupiAddr1 = lupi.connect(addr1);

    const currentNonce = await lupiAddr1.getCurrentNonce();

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await lupiAddr1.commitGuess(guessHash, overrides);

    const now =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      8 * 24 * 60 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [now]);
    await ethers.provider.send("evm_mine", []);

    await expect(lupiAddr1.revealGuess(guessHash, 1, salt)).to.be.revertedWith(
      "revealGuess revealDeadline has passed"
    );
  });

  it("Should revert if reveal is of <=0", async function () {
    const Lupi = await ethers.getContractFactory("Lupi");
    const lupi = await Lupi.deploy("1");
    await lupi.deployed();

    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const lupiAddr1 = lupi.connect(addr1);

    const currentNonce = await lupiAddr1.getCurrentNonce();

    const guessHash = getGuessHash(currentNonce, 0, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await lupiAddr1.commitGuess(guessHash, overrides);

    const now =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      4 * 24 * 60 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [now]);
    await ethers.provider.send("evm_mine", []);

    await expect(lupiAddr1.revealGuess(guessHash, 0, salt)).to.be.revertedWith(
      "revealGuess answer must be positive"
    );
  });

  it("Should revert if reveal hash doesn't match guess hash", async function () {
    const Lupi = await ethers.getContractFactory("Lupi");
    const lupi = await Lupi.deploy("1");
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const lupiAddr1 = lupi.connect(addr1);

    const currentNonce = await lupiAddr1.getCurrentNonce();

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await lupiAddr1.commitGuess(guessHash, overrides);

    const now =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      4 * 24 * 60 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [now]);
    await ethers.provider.send("evm_mine", []);

    const wrongSalt = getSalt("43");

    await expect(
      lupiAddr1.revealGuess(guessHash, 1, wrongSalt)
    ).to.be.revertedWith("Reveal hash does not match guessHash");
  });

  it("Should revert commitGuess after reveal has started", async function () {
    const Lupi = await ethers.getContractFactory("Lupi");
    const lupi = await Lupi.deploy("1");
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const lupiAddr1 = lupi.connect(addr1);

    const currentNonce = await lupiAddr1.getCurrentNonce();

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const now =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      8 * 24 * 60 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [now]);
    await ethers.provider.send("evm_mine", []);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await expect(
      lupiAddr1.commitGuess(guessHash, overrides)
    ).to.be.revertedWith("Guess deadline has passed");
  });

  it("Should commit a guess and make a reveal", async function () {
    const Lupi = await ethers.getContractFactory("Lupi");
    const lupi = await Lupi.deploy("1");
    await lupi.deployed();
    const currentNonce = await lupi.getCurrentNonce();

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await lupi.commitGuess(guessHash, overrides);

    const players = await lupi.getPlayers();
    expect(players.length).to.equal(1);

    const committedGuessHashes = await lupi.getCommittedGuessHashes(players[0]);
    expect(committedGuessHashes.length).to.equal(1);

    const now =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      4 * 24 * 60 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [now]);
    await ethers.provider.send("evm_mine", []);

    const revealHash = getGuessHash(currentNonce, 1, salt);

    await lupi.revealGuess(revealHash, 1, salt);
  });

  it("Two users should commit 5 guesses and make 5 reveals, one user should also guess one unique (1)", async function () {
    const Lupi = await ethers.getContractFactory("Lupi");
    const lupi = await Lupi.deploy("1");
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const currentNonce = await lupi.getCurrentNonce();

    for (let j = 0; j < 2; j++) {
      const lupiUser = lupi.connect(users[j]);

      for (let i = 2; i < 7; i++) {
        const guessHash = getGuessHash(currentNonce, i, salt);
        const overrides = {
          value: ethers.utils.parseEther("0.01"),
        };

        await lupiUser.commitGuess(guessHash, overrides);
      }
    }

    for (let j = 0; j < 2; j++) {
      const lupiUser = lupi.connect(users[j]);

      const committedGuessHashes = await lupiUser.getCommittedGuessHashes(
        users[j].address
      );
      expect(committedGuessHashes.length).to.equal(5);
    }

    const lupiUser = lupi.connect(users[0]);

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await lupiUser.commitGuess(guessHash, overrides);

    const committedGuessHashes = await lupiUser.getCommittedGuessHashes(
      users[0].address
    );
    expect(committedGuessHashes.length).to.equal(6);

    const guessDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      4 * 24 * 60 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [guessDeadline]);
    await ethers.provider.send("evm_mine", []);

    for (let j = 0; j < 2; j++) {
      const lupiUser = lupi.connect(users[j]);
      for (let i = 2; i < 7; i++) {
        const guessHash = getGuessHash(currentNonce, i, salt);

        await lupiUser.revealGuess(guessHash, i, salt);
      }
    }

    const revealHash = getGuessHash(currentNonce, 1, salt);

    await lupiUser.revealGuess(revealHash, 1, salt);

    const revealedGuesses = await lupi.getRevealedGuess();
    expect(revealedGuesses.length).to.equal(11);

    const revealDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      4 * 24 * 60 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [revealDeadline]);
    await ethers.provider.send("evm_mine", []);

    await expect(lupi.endGame())
      .to.emit(lupi, "GameResult")
      .withArgs(currentNonce, users[0].address, 1);
  });

  it("1 User should commit 9 guesses (4 duplicate, 1 unique) and make 6 reveals", async function () {
    const Lupi = await ethers.getContractFactory("Lupi");
    const lupi = await Lupi.deploy("1");
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const currentNonce = await lupi.getCurrentNonce();

    const lupiUser = lupi.connect(users[0]);

    for (let j = 0; j < 2; j++) {
      for (let i = 1; i < 5; i++) {
        const guessHash = getGuessHash(currentNonce, i, salt);
        const overrides = {
          value: ethers.utils.parseEther("0.01"),
        };

        await lupiUser.commitGuess(guessHash, overrides);
      }
    }

    const guessHash = getGuessHash(currentNonce, 6, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await lupiUser.commitGuess(guessHash, overrides);

    const guessDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      4 * 24 * 60 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [guessDeadline]);
    await ethers.provider.send("evm_mine", []);

    for (let j = 0; j < 2; j++) {
      const lupiUser = lupi.connect(users[0]);
      for (let i = 1; i < 5; i++) {
        const guessHash = getGuessHash(currentNonce, i, salt);

        if (j === 0) {
          await lupiUser.revealGuess(guessHash, i, salt);
        } else {
          await expect(
            lupiUser.revealGuess(guessHash, i, salt)
          ).to.be.revertedWith("Already revealed");
        }
      }
    }

    const revealHash = getGuessHash(currentNonce, 6, salt);

    const committedGuessHashes = await lupiUser.getCommittedGuessHashes(
      users[0].address
    );
    expect(committedGuessHashes.length).to.equal(9);

    await lupiUser.revealGuess(revealHash, 6, salt);

    const revealedGuesses = await lupi.getRevealedGuess();
    expect(revealedGuesses.length).to.equal(5);
    const revealDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      4 * 24 * 60 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [revealDeadline]);
    await ethers.provider.send("evm_mine", []);

    await expect(lupi.endGame())
      .to.emit(lupi, "GameResult")
      .withArgs(currentNonce, users[0].address, 1);
  });

  it("Two users should make 4 idendtical gusses, there should be no winner", async function () {
    const Lupi = await ethers.getContractFactory("Lupi");
    const lupi = await Lupi.deploy("1");
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const currentNonce = await lupi.getCurrentNonce();

    for (let j = 0; j < 2; j++) {
      const lupiUser = lupi.connect(users[j]);

      for (let i = 1; i < 5; i++) {
        const guessHash = getGuessHash(currentNonce, i, salt);

        const overrides = {
          value: ethers.utils.parseEther("0.01"),
        };

        await lupiUser.commitGuess(guessHash, overrides);
      }
    }

    const guessDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      4 * 24 * 60 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [guessDeadline]);
    await ethers.provider.send("evm_mine", []);

    for (let j = 0; j < 2; j++) {
      const lupiUser = lupi.connect(users[j]);
      for (let i = 1; i < 5; i++) {
        const guessHash = getGuessHash(currentNonce, i, salt);

        await lupiUser.revealGuess(guessHash, i, salt);
      }
    }

    const revealDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 24 * 60 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [revealDeadline]);
    await ethers.provider.send("evm_mine", []);

    await expect(lupi.endGame())
      .to.emit(lupi, "GameResult")
      .withArgs(currentNonce, nullAddress, 0);
  });

  it("Should should revert if endGame too early", async function () {
    const Lupi = await ethers.getContractFactory("Lupi");
    const lupi = await Lupi.deploy("1");
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const currentNonce = await lupi.getCurrentNonce();

    for (let j = 0; j < 2; j++) {
      const lupiUser = lupi.connect(users[0]);

      for (let i = 1; i < 5; i++) {
        const guessHash = getGuessHash(currentNonce, i, salt);

        const overrides = {
          value: ethers.utils.parseEther("0.01"),
        };

        await lupiUser.commitGuess(guessHash, overrides);
      }
    }

    const lupiUser = lupi.connect(users[0]);

    const guessHash = getGuessHash(currentNonce, 6, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await lupiUser.commitGuess(guessHash, overrides);

    const guessDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      4 * 24 * 60 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [guessDeadline]);
    await ethers.provider.send("evm_mine", []);

    for (let j = 0; j < 2; j++) {
      const lupiUser = lupi.connect(users[0]);
      for (let i = 1; i < 5; i++) {
        const guessHash = getGuessHash(currentNonce, i, salt);

        if (j === 0) {
          await lupiUser.revealGuess(guessHash, i, salt);
        } else {
          await expect(
            lupiUser.revealGuess(guessHash, i, salt)
          ).to.be.revertedWith("Already revealed");
        }
      }
    }

    const revealHash = getGuessHash(currentNonce, 6, salt);

    await lupiUser.revealGuess(revealHash, 6, salt);

    const revealedGuesses = await lupiUser.getRevealedGuess();

    expect(revealedGuesses.length).to.equal(5);

    await expect(lupi.endGame()).to.be.revertedWith("Still in reveal phase");
  });

  it("Should should revert commitGuess if not enough eth provided", async function () {
    const Lupi = await ethers.getContractFactory("Lupi");
    const lupi = await Lupi.deploy("1");
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();

    const currentNonce = await lupi.getCurrentNonce();

    const lupiUser = lupi.connect(addr1);

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.001"),
    };

    await expect(lupiUser.commitGuess(guessHash, overrides)).to.be.revertedWith(
      "Must send at least ticketPrice"
    );
  });

  it("Should should return extra eth from commitGuess", async function () {
    const Lupi = await ethers.getContractFactory("Lupi");
    const lupi = await Lupi.deploy("1");
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();

    const balance = await addr1.getBalance();

    const currentNonce = await lupi.getCurrentNonce();

    const lupiUser = lupi.connect(addr1);

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.02"),
    };

    const tx = await lupiUser.commitGuess(guessHash, overrides);

    const { gasUsed } = await tx.wait();

    const afterBalance = await addr1.getBalance();
    expect(
      BigNumber.from("10000000000000000") ===
        balance.sub(afterBalance).add(gasUsed)
    );
  });
});
